import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'hmed-secret-2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email e senha são obrigatórios', 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { company: { select: { id: true, name: true, logoUrl: true, settings: true } } },
  });

  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new AppError('Credenciais inválidas', 401);
  }

  if (!user.isActive) {
    throw new AppError('Conta desativada. Entre em contato com o administrador.', 403);
  }

  // Atualizar último login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    token,
    user: userWithoutPassword,
  });
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, companyName } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Nome, email e senha são obrigatórios', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new AppError('Email já cadastrado', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Criar empresa se não existir
  let companyId: string | undefined;
  if (companyName) {
    const company = await prisma.company.create({
      data: { name: companyName },
    });
    companyId = company.id;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      companyId,
    },
    include: { company: true },
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ token, user: userWithoutPassword });
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { company: { select: { id: true, name: true, logoUrl: true, settings: true } } },
    omit: { password: true } as any,
  });

  if (!user) throw new AppError('Usuário não encontrado', 404);

  res.json(user);
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) throw new AppError('Token não fornecido', 400);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const newToken = generateToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    });
    res.json({ token: newToken });
  } catch {
    throw new AppError('Token inválido', 401);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  // Em produção, adicionar token a uma blacklist no Redis
  res.json({ message: 'Logout realizado com sucesso' });
};
