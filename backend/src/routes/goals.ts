import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
const router = Router();
router.use(authenticate);
router.get('/', async (req: AuthRequest, res) => {
  const data = await prisma.goal.findMany({ where:{companyId:req.user!.companyId,isActive:true}, orderBy:{endDate:'asc'} });
  res.json(data);
});
router.post('/', async (req: AuthRequest, res) => {
  const g = await prisma.goal.create({ data:{...req.body,companyId:req.user!.companyId} });
  res.status(201).json(g);
});
router.put('/:id', async (req: AuthRequest, res) => {
  const g = await prisma.goal.update({ where:{id:req.params.id}, data:req.body });
  res.json(g);
});
router.delete('/:id', async (req: AuthRequest, res) => {
  await prisma.goal.update({ where:{id:req.params.id}, data:{isActive:false} });
  res.json({ message: 'Meta removida' });
});
export default router;
