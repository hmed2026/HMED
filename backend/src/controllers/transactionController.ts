import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const {
    page = '1', limit = '20', type, status, categoryId, clientId,
    startDate, endDate, search, paymentMethod, minAmount, maxAmount,
    sortBy = 'createdAt', sortOrder = 'desc',
  } = req.query as Record<string, string>;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: any = { companyId, deletedAt: null };

  if (type) where.type = type;
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (clientId) where.clientId = clientId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    where.dueDate = {};
    if (startDate) where.dueDate.gte = new Date(startDate);
    if (endDate) where.dueDate.lte = new Date(endDate);
  }
  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = parseFloat(minAmount);
    if (maxAmount) where.amount.lte = parseFloat(maxAmount);
  }
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        client: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: parseInt(limit),
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
};

export const getTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const transaction = await prisma.transaction.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { category: true, client: true, createdBy: { select: { id: true, name: true } } },
  });

  if (!transaction) throw new AppError('Movimentação não encontrada', 404);

  res.json(transaction);
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const userId = req.user!.id;
  const data = req.body;

  const transaction = await prisma.transaction.create({
    data: { ...data, companyId, userId, amount: parseFloat(data.amount) },
    include: { category: true, client: true },
  });

  res.status(201).json(transaction);
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const existing = await prisma.transaction.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw new AppError('Movimentação não encontrada', 404);

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { ...req.body, amount: req.body.amount ? parseFloat(req.body.amount) : undefined },
    include: { category: true, client: true },
  });

  res.json(transaction);
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const existing = await prisma.transaction.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw new AppError('Movimentação não encontrada', 404);

  await prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });

  res.json({ message: 'Movimentação excluída com sucesso' });
};

export const restoreTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: null },
  });

  res.json({ message: 'Movimentação restaurada com sucesso' });
};

export const markAsPaid = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { paidAt, paymentMethod } = req.body;

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { status: 'PAID', paidAt: paidAt ? new Date(paidAt) : new Date(), paymentMethod },
  });

  res.json(transaction);
};
