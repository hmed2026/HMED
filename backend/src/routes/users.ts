import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN','SUPER_ADMIN','MANAGER'), async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({ where:{companyId:req.user!.companyId}, select:{id:true,name:true,email:true,role:true,isActive:true,lastLoginAt:true,createdAt:true} });
  res.json(users);
});
router.post('/', authorize('ADMIN','SUPER_ADMIN'), async (req: AuthRequest, res) => {
  const { name, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 12);
  const u = await prisma.user.create({ data:{name,email:email.toLowerCase(),password:hashed,role,companyId:req.user!.companyId} });
  const {password:_,...safe} = u;
  res.status(201).json(safe);
});
router.put('/:id', async (req: AuthRequest, res) => {
  const { password, ...data } = req.body;
  const updateData: any = data;
  if (password) updateData.password = await bcrypt.hash(password, 12);
  const u = await prisma.user.update({ where:{id:req.params.id}, data:updateData });
  const {password:_,...safe} = u;
  res.json(safe);
});
router.delete('/:id', authorize('ADMIN','SUPER_ADMIN'), async (req: AuthRequest, res) => {
  await prisma.user.update({ where:{id:req.params.id}, data:{isActive:false} });
  res.json({ message: 'Usuário desativado' });
});
export default router;
