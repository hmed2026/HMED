import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { startOfMonth, endOfMonth, startOfYear, subMonths, format } from 'date-fns';

export const getDashboard = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);
  const startYear = startOfYear(now);

  // KPIs do mês atual
  const [incomeMonth, expenseMonth, clientsActive, salesMonth] = await Promise.all([
    prisma.transaction.aggregate({
      where: { companyId, type: 'INCOME', status: 'PAID', paidAt: { gte: startMonth, lte: endMonth }, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { companyId, type: 'EXPENSE', status: 'PAID', paidAt: { gte: startMonth, lte: endMonth }, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.client.count({ where: { companyId, isActive: true, deletedAt: null } }),
    prisma.sale.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, soldAt: { gte: startMonth, lte: endMonth }, deletedAt: null },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  // Comparação com mês anterior
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const [prevIncome, prevExpense, prevSales] = await Promise.all([
    prisma.transaction.aggregate({
      where: { companyId, type: 'INCOME', status: 'PAID', paidAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { companyId, type: 'EXPENSE', status: 'PAID', paidAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.sale.aggregate({
      where: { companyId, status: { not: 'CANCELLED' }, soldAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
      _sum: { total: true },
    }),
  ]);

  // Gráfico mensal (12 meses)
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));

    const [inc, exp] = await Promise.all([
      prisma.transaction.aggregate({
        where: { companyId, type: 'INCOME', status: 'PAID', paidAt: { gte: monthStart, lte: monthEnd }, deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { companyId, type: 'EXPENSE', status: 'PAID', paidAt: { gte: monthStart, lte: monthEnd }, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    monthlyData.push({
      month: format(monthStart, 'MMM/yy'),
      income: inc._sum.amount || 0,
      expense: exp._sum.amount || 0,
      profit: (inc._sum.amount || 0) - (exp._sum.amount || 0),
    });
  }

  // Despesas por categoria
  const expenseByCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { companyId, type: 'EXPENSE', status: 'PAID', paidAt: { gte: startMonth, lte: endMonth }, deletedAt: null },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 8,
  });

  const categoryDetails = await Promise.all(
    expenseByCategory.map(async (e) => {
      const cat = e.categoryId ? await prisma.category.findUnique({ where: { id: e.categoryId } }) : null;
      return {
        category: cat?.name || 'Sem categoria',
        color: cat?.color || '#6B7280',
        amount: e._sum.amount || 0,
      };
    })
  );

  // Últimas movimentações
  const recentTransactions = await prisma.transaction.findMany({
    where: { companyId, deletedAt: null },
    include: { category: true, client: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Contas a pagar (vencendo em 7 dias)
  const upcoming = await prisma.transaction.findMany({
    where: {
      companyId,
      type: 'EXPENSE',
      status: 'PENDING',
      dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      deletedAt: null,
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  // Top clientes
  const topClients = await prisma.client.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { totalPurchases: 'desc' },
    take: 5,
  });

  const income = incomeMonth._sum.amount || 0;
  const expense = expenseMonth._sum.amount || 0;
  const profit = income - expense;
  const prevIncomeVal = prevIncome._sum.amount || 0;
  const prevExpenseVal = prevExpense._sum.amount || 0;

  function calcGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  res.json({
    kpis: {
      income: { value: income, growth: calcGrowth(income, prevIncomeVal) },
      expense: { value: expense, growth: calcGrowth(expense, prevExpenseVal) },
      profit: { value: profit, growth: calcGrowth(profit, prevIncomeVal - prevExpenseVal) },
      salesTotal: { value: salesMonth._sum.total || 0, count: salesMonth._count },
      clientsActive,
    },
    monthlyChart: monthlyData,
    expenseByCategory: categoryDetails,
    recentTransactions,
    upcomingPayments: upcoming,
    topClients,
  });
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const now = new Date();
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);

  const [overdueCount, pendingPayable, pendingReceivable] = await Promise.all([
    prisma.transaction.count({
      where: { companyId, status: 'OVERDUE', deletedAt: null },
    }),
    prisma.transaction.aggregate({
      where: { companyId, type: 'EXPENSE', status: { in: ['PENDING', 'OVERDUE'] }, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { companyId, type: 'INCOME', status: { in: ['PENDING', 'OVERDUE'] }, deletedAt: null },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    overdueCount,
    pendingPayable: pendingPayable._sum.amount || 0,
    pendingReceivable: pendingReceivable._sum.amount || 0,
  });
};
