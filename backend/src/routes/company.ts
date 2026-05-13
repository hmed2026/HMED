import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
const router = Router();
router.use(authenticate);
router.get('/', async (req: AuthRequest, res) => {
  const c = await prisma.company.findUnique({ where:{id:req.user!.companyId} });
  res.json(c);
});
router.put('/', async (req: AuthRequest, res) => {
  const c = await prisma.company.update({ where:{id:req.user!.companyId}, data:req.body });
  res.json(c);
});
export default router;
