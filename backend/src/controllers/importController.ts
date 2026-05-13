import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { parseExcel, parseCsv } from '../parsers/fileParser';
import { logger } from '../utils/logger';

// Configuração Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.ofx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(`Tipo de arquivo não permitido: ${ext}`, 400) as any, false);
    }
  },
});

export const importFile = async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('Arquivo não enviado', 400);

  const companyId = req.user!.companyId;
  const userId = req.user!.id;
  const { type = 'TRANSACTIONS' } = req.body;

  const ext = path.extname(req.file.originalname).toLowerCase();
  const buffer = fs.readFileSync(req.file.path);

  logger.info(`📁 Importando arquivo: ${req.file.originalname} (${type})`);

  let parseResult;

  try {
    if (ext === '.xlsx' || ext === '.xls') {
      parseResult = await parseExcel(buffer);
    } else if (ext === '.csv' || ext === '.txt') {
      parseResult = await parseCsv(buffer);
    } else {
      throw new AppError('Formato não suportado para processamento automático', 400);
    }
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }

  if (!parseResult.data.length) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum dado válido encontrado no arquivo',
      errors: parseResult.errors,
      summary: parseResult.summary,
    });
  }

  // Salvar no banco
  const batchId = `import-${Date.now()}`;
  let savedCount = 0;
  const saveErrors: string[] = [];

  // Buscar categorias da empresa para mapear
  const categories = await prisma.category.findMany({ where: { companyId } });
  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

  for (const item of parseResult.data) {
    try {
      let categoryId: string | undefined;
      if (item.category) {
        categoryId = categoryMap.get(item.category.toLowerCase());
      }

      await prisma.transaction.create({
        data: {
          description: item.description,
          amount: item.amount,
          type: item.type,
          dueDate: item.dueDate,
          status: item.status as any,
          paymentMethod: item.paymentMethod as any,
          reference: item.reference,
          notes: item.notes,
          categoryId,
          companyId,
          userId,
          importBatch: batchId,
        },
      });
      savedCount++;
    } catch (e) {
      saveErrors.push(`Erro ao salvar: ${e}`);
    }
  }

  res.json({
    success: true,
    batchId,
    message: `${savedCount} registros importados com sucesso`,
    summary: {
      ...parseResult.summary,
      saved: savedCount,
      saveErrors: saveErrors.length,
    },
    errors: [...parseResult.errors, ...saveErrors].slice(0, 20),
  });
};

export const getImportHistory = async (req: AuthRequest, res: Response) => {
  const companyId = req.user!.companyId;

  const batches = await prisma.transaction.groupBy({
    by: ['importBatch'],
    where: { companyId, importBatch: { not: null } },
    _count: true,
    _sum: { amount: true },
    orderBy: { _count: { importBatch: 'desc' } },
  });

  res.json(batches.filter(b => b.importBatch));
};

export const previewFile = async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('Arquivo não enviado', 400);

  const ext = path.extname(req.file.originalname).toLowerCase();
  const buffer = fs.readFileSync(req.file.path);

  let parseResult;
  if (ext === '.xlsx' || ext === '.xls') {
    parseResult = await parseExcel(buffer);
  } else {
    parseResult = await parseCsv(buffer);
  }

  // Limpar arquivo temporário
  if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

  // Retornar apenas preview (primeiros 10 registros)
  res.json({
    preview: parseResult.data.slice(0, 10),
    summary: parseResult.summary,
    errors: parseResult.errors.slice(0, 5),
  });
};
