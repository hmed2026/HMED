import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  const companyId = req.user!.companyId;
  const { page='1',limit='20',search,category,isActive } = req.query as any;
  const skip = (parseInt(page)-1)*parseInt(limit);
  const where: any = { companyId, deletedAt: null };
  if (category) where.category = category;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) where.OR=[{name:{contains:search,mode:'insensitive'}},{code:{contains:search,mode:'insensitive'}}];
  const [data,total] = await Promise.all([prisma.product.findMany({where,orderBy:{name:'asc'},skip,take:parseInt(limit)}),prisma.product.count({where})]);
  res.json({data,pagination:{page:parseInt(page),limit:parseInt(limit),total,totalPages:Math.ceil(total/parseInt(limit))}});
});
router.post('/', async (req: AuthRequest, res) => {
  const p = await prisma.product.create({ data: { ...req.body, companyId: req.user!.companyId } });
  res.status(201).json(p);
});
router.put('/:id', async (req: AuthRequest, res) => {
  const p = await prisma.product.update({ where:{id:req.params.id}, data:req.body });
  res.json(p);
});
router.delete('/:id', async (req: AuthRequest, res) => {
  await prisma.product.update({ where:{id:req.params.id}, data:{deletedAt:new Date()} });
  res.json({ message: 'Produto excluído' });
});
export default router;
