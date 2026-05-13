import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
const router = Router();
router.use(authenticate);
router.get('/', async (req: AuthRequest, res) => {
  const data = await prisma.category.findMany({ where:{ companyId:req.user!.companyId, isActive:true }, orderBy:{name:'asc'} });
  res.json(data);
});
router.post('/', async (req: AuthRequest, res) => {
  const c = await prisma.category.create({ data: { ...req.body, companyId: req.user!.companyId } });
  res.status(201).json(c);
});
router.put('/:id', async (req: AuthRequest, res) => {
  const c = await prisma.category.update({ where:{id:req.params.id}, data:req.body });
  res.json(c);
});
router.delete('/:id', async (req: AuthRequest, res) => {
  await prisma.category.update({ where:{id:req.params.id}, data:{isActive:false} });
  res.json({ message: 'Categoria removida' });
});
export default router;
