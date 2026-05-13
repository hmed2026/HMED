import { Router } from 'express';
import { authenticate } from '../middleware/auth';
const router = Router();
router.use(authenticate);
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

router.get('/', async (req: AuthRequest, res) => {
  const companyId = req.user!.companyId;
  const { page='1',limit='20',status,clientId,search,startDate,endDate } = req.query as any;
  const skip = (parseInt(page)-1)*parseInt(limit);
  const where: any = { companyId, deletedAt: null };
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (startDate||endDate) { where.soldAt={}; if(startDate) where.soldAt.gte=new Date(startDate); if(endDate) where.soldAt.lte=new Date(endDate); }
  if (search) where.OR=[{client:{name:{contains:search,mode:'insensitive'}}}];
  const [data,total] = await Promise.all([
    prisma.sale.findMany({where,include:{client:{select:{id:true,name:true}},items:{include:{product:{select:{id:true,name:true}}}},seller:{select:{id:true,name:true}}},orderBy:{soldAt:'desc'},skip,take:parseInt(limit)}),
    prisma.sale.count({where})
  ]);
  res.json({data,pagination:{page:parseInt(page),limit:parseInt(limit),total,totalPages:Math.ceil(total/parseInt(limit))}});
});

router.post('/', async (req: AuthRequest, res) => {
  const companyId = req.user!.companyId;
  const userId = req.user!.id;
  const { clientId, items, discount=0, paymentMethod, notes, soldAt } = req.body;
  let subtotal = 0;
  const saleItems = items.map((item: any) => {
    const total = item.quantity * item.unitPrice * (1 - (item.discount||0)/100);
    subtotal += total;
    return { quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount||0, total, productId: item.productId };
  });
  const total = subtotal - discount;
  const lastSale = await prisma.sale.findFirst({ where: { companyId }, orderBy: { number: 'desc' } });
  const number = (lastSale?.number || 0) + 1;
  const sale = await prisma.sale.create({ data: { number, companyId, userId, clientId, subtotal, discount, total, paymentMethod, notes, soldAt: soldAt ? new Date(soldAt) : new Date(), items: { create: saleItems } }, include: { items: true, client: true } });
  if (clientId) await prisma.client.update({ where:{id:clientId}, data:{totalPurchases:{increment:total},lastPurchaseAt:new Date()} }).catch(()=>{});
  res.status(201).json(sale);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  await prisma.sale.update({ where:{id}, data:{deletedAt:new Date()} });
  res.json({ message: 'Venda excluída' });
});

export default router;
