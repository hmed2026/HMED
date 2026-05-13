import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
const router = Router();
router.use(authenticate);
router.get('/cash-flow', async (req: AuthRequest, res) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate } = req.query as any;
  const where: any = { companyId, status:'PAID', deletedAt:null };
  if (startDate||endDate) { where.paidAt={}; if(startDate) where.paidAt.gte=new Date(startDate); if(endDate) where.paidAt.lte=new Date(endDate); }
  const transactions = await prisma.transaction.findMany({ where, include:{category:true}, orderBy:{paidAt:'asc'} });
  let balance = 0;
  const data = transactions.map(t => {
    balance += t.type === 'INCOME' ? t.amount : -t.amount;
    return { ...t, balance };
  });
  res.json(data);
});
router.get('/dre', async (req: AuthRequest, res) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate } = req.query as any;
  const where: any = { companyId, status:'PAID', deletedAt:null };
  if (startDate||endDate) { where.paidAt={}; if(startDate) where.paidAt.gte=new Date(startDate); if(endDate) where.paidAt.lte=new Date(endDate); }
  const [income,expense] = await Promise.all([
    prisma.transaction.aggregate({ where:{...where,type:'INCOME'}, _sum:{amount:true} }),
    prisma.transaction.aggregate({ where:{...where,type:'EXPENSE'}, _sum:{amount:true} }),
  ]);
  const totalIncome = income._sum.amount || 0;
  const totalExpense = expense._sum.amount || 0;
  const expByCategory = await prisma.transaction.groupBy({ by:['categoryId'], where:{...where,type:'EXPENSE'}, _sum:{amount:true}, orderBy:{_sum:{amount:'desc'}} });
  res.json({ totalIncome, totalExpense, netProfit: totalIncome-totalExpense, margin: totalIncome>0 ? ((totalIncome-totalExpense)/totalIncome)*100 : 0, expenseByCategory: expByCategory });
});
export default router;
