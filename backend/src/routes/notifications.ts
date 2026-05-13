import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
const router = Router();
router.use(authenticate);
router.get('/', async (req: AuthRequest, res) => {
  const data = await prisma.notification.findMany({ where:{userId:req.user!.id}, orderBy:{createdAt:'desc'}, take:50 });
  res.json(data);
});
router.patch('/:id/read', async (req: AuthRequest, res) => {
  await prisma.notification.update({ where:{id:req.params.id}, data:{isRead:true} });
  res.json({ ok: true });
});
router.patch('/read-all', async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({ where:{userId:req.user!.id,isRead:false}, data:{isRead:true} });
  res.json({ ok: true });
});
export default router;
