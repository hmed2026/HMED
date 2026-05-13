import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const getClients = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const { page = '1', limit = '20', search, type, isActive, sortBy = 'name', sortOrder = 'asc' } = req.query as Record<string, string>;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = { companyId, deletedAt: null };

  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { document: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.client.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take: parseInt(limit) }),
    prisma.client.count({ where }),
  ]);

  res.json({ data, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
};

export const getClient = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const client = await prisma.client.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      sales: { where: { deletedAt: null }, orderBy: { soldAt: 'desc' }, take: 10 },
      transactions: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!client) throw new AppError('Cliente não encontrado', 404);
  res.json(client);
};

export const createClient = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;
  const client = await prisma.client.create({ data: { ...req.body, companyId } });
  res.status(201).json(client);
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const existing = await prisma.client.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw new AppError('Cliente não encontrado', 404);

  const client = await prisma.client.update({ where: { id }, data: req.body });
  res.json(client);
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const existing = await prisma.client.findFirst({ where: { id, companyId, deletedAt: null } });
  if (!existing) throw new AppError('Cliente não encontrado', 404);

  await prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  res.json({ message: 'Cliente excluído com sucesso' });
};
