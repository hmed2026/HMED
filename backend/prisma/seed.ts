import { PrismaClient, UserRole, CategoryType, ClientType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar empresa padrão
  const company = await prisma.company.upsert({
    where: { document: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'H MED DISTRIBUIDORA',
      tradeName: 'H MED',
      document: '00.000.000/0001-00',
      email: 'hmeddistribuidora2025@gmail.com',
      phone: '(00) 00000-0000',
      city: 'São Paulo',
      state: 'SP',
      settings: {
        primaryColor: '#1E40AF',
        theme: 'dark',
        currency: 'BRL',
        dateFormat: 'DD/MM/YYYY',
        language: 'pt-BR',
      },
    },
  });

  console.log('✅ Empresa criada:', company.name);

  // Criar usuário administrador
  const hashedPassword = await bcrypt.hash('Admin@2024', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hmed.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@hmed.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      companyId: company.id,
    },
  });

  console.log('✅ Admin criado:', admin.email);

  // Criar usuário demonstração
  const demoPassword = await bcrypt.hash('Demo@2024', 12);

  await prisma.user.upsert({
    where: { email: 'demo@hmed.com' },
    update: {},
    create: {
      name: 'Usuário Demo',
      email: 'demo@hmed.com',
      password: demoPassword,
      role: UserRole.MANAGER,
      companyId: company.id,
    },
  });

  // Criar categorias padrão
  const categories = [
    // Receitas
    { name: 'Vendas de Produtos', type: CategoryType.INCOME, color: '#10B981', icon: 'ShoppingCart' },
    { name: 'Prestação de Serviços', type: CategoryType.INCOME, color: '#3B82F6', icon: 'Briefcase' },
    { name: 'Comissões', type: CategoryType.INCOME, color: '#8B5CF6', icon: 'TrendingUp' },
    { name: 'Juros Recebidos', type: CategoryType.INCOME, color: '#F59E0B', icon: 'Percent' },
    { name: 'Outras Receitas', type: CategoryType.INCOME, color: '#06B6D4', icon: 'Plus' },
    // Despesas
    { name: 'Fornecedores', type: CategoryType.EXPENSE, color: '#EF4444', icon: 'Truck' },
    { name: 'Salários', type: CategoryType.EXPENSE, color: '#F97316', icon: 'Users' },
    { name: 'Aluguel', type: CategoryType.EXPENSE, color: '#EC4899', icon: 'Home' },
    { name: 'Utilidades', type: CategoryType.EXPENSE, color: '#6B7280', icon: 'Zap' },
    { name: 'Marketing', type: CategoryType.EXPENSE, color: '#7C3AED', icon: 'Megaphone' },
    { name: 'Logística', type: CategoryType.EXPENSE, color: '#0891B2', icon: 'Package' },
    { name: 'Impostos', type: CategoryType.EXPENSE, color: '#DC2626', icon: 'FileText' },
    { name: 'Manutenção', type: CategoryType.EXPENSE, color: '#78716C', icon: 'Tool' },
    { name: 'Outras Despesas', type: CategoryType.EXPENSE, color: '#9CA3AF', icon: 'Minus' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: `${company.id}-${cat.name}` },
      update: {},
      create: {
        id: `${company.id}-${cat.name}`,
        ...cat,
        companyId: company.id,
      },
    });
  }

  console.log('✅ Categorias criadas');

  // Criar clientes demonstração
  const clients = [
    { name: 'Hospital São Lucas', email: 'compras@saolucas.com', type: ClientType.HOSPITAL, city: 'São Paulo', state: 'SP' },
    { name: 'Clínica Médica Central', email: 'admin@clinicacentral.com', type: ClientType.CLINIC, city: 'Rio de Janeiro', state: 'RJ' },
    { name: 'Farmácia Popular', email: 'pedidos@farmaciapopular.com', type: ClientType.PHARMACY, city: 'Belo Horizonte', state: 'MG' },
    { name: 'UPA Norte', email: 'suprimentos@upanorte.com', type: ClientType.HOSPITAL, city: 'Brasília', state: 'DF' },
    { name: 'Distribuidora MedPlus', email: 'comercial@medplus.com', type: ClientType.DISTRIBUTOR, city: 'Curitiba', state: 'PR' },
  ];

  for (const client of clients) {
    await prisma.client.create({
      data: { ...client, companyId: company.id },
    }).catch(() => {});
  }

  console.log('✅ Clientes demo criados');

  // Criar produtos demonstração
  const products = [
    { name: 'Seringa 10ml', code: 'SER-010', category: 'Descartáveis', unit: 'CX', costPrice: 45.00, salePrice: 68.00, stock: 500 },
    { name: 'Luva Cirúrgica M', code: 'LUV-M', category: 'EPIs', unit: 'CX', costPrice: 35.00, salePrice: 52.00, stock: 300 },
    { name: 'Máscara N95', code: 'MSK-N95', category: 'EPIs', unit: 'CX', costPrice: 120.00, salePrice: 180.00, stock: 200 },
    { name: 'Termômetro Digital', code: 'TER-DIG', category: 'Equipamentos', unit: 'UN', costPrice: 25.00, salePrice: 45.00, stock: 100 },
    { name: 'Álcool 70% 1L', code: 'ALC-70', category: 'Higiene', unit: 'UN', costPrice: 8.00, salePrice: 14.00, stock: 1000 },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: { ...product, companyId: company.id },
    }).catch(() => {});
  }

  console.log('✅ Produtos demo criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('   Admin: admin@hmed.com / Admin@2024');
  console.log('   Demo:  demo@hmed.com / Demo@2024');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
