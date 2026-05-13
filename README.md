# 🏥 H MED DISTRIBUIDORA — Sistema de Gestão SaaS Premium

Sistema empresarial completo para gestão de finanças, vendas, clientes e relatórios automatizados.

---

## 🚀 Deploy Rápido (VPS/Servidor)

### Pré-requisitos
- Docker 24+
- Docker Compose 2+
- Git

### 1. Clonar e configurar

```bash
git clone <seu-repositorio>
cd hmed-saas

# Copiar e editar variáveis de ambiente
cp .env.example .env
nano .env
```

### 2. Editar o arquivo `.env`

```env
DB_PASSWORD=SUA_SENHA_SEGURA
JWT_SECRET=CHAVE_SECRETA_LONGA_E_ALEATORIA
REDIS_PASSWORD=SENHA_REDIS
FRONTEND_URL=http://SEU_IP_OU_DOMINIO
```

### 3. Subir o sistema

```bash
docker compose up -d --build
```

### 4. Verificar se está rodando

```bash
docker compose ps
curl http://localhost/health
```

### 5. Acessar o sistema

- **Frontend:** http://localhost
- **API:** http://localhost/api
- **Admin:** admin@hmed.com / Admin@2024

---

## 🛠️ Desenvolvimento Local

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar DATABASE_URL no .env

npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Acesso: http://localhost:5173

---

## 📁 Estrutura do Projeto

```
hmed-saas/
├── backend/                    # API Node.js + TypeScript
│   ├── src/
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── routes/             # Rotas da API REST
│   │   ├── middleware/         # Auth, erros, rate limit
│   │   ├── parsers/            # Parser inteligente CSV/Excel
│   │   ├── services/           # Serviços reutilizáveis
│   │   ├── config/             # Prisma, WebSocket
│   │   └── utils/              # Helpers e logger
│   ├── prisma/
│   │   ├── schema.prisma       # Schema do banco de dados
│   │   └── seed.ts             # Dados iniciais
│   └── Dockerfile
│
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/              # Páginas do sistema
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── layout/         # Sidebar, Navbar
│   │   │   ├── ui/             # SplashScreen, Skeleton
│   │   │   ├── forms/          # Modais e formulários
│   │   │   └── charts/         # Gráficos
│   │   ├── store/              # Estado global (Zustand)
│   │   ├── services/           # API client (Axios)
│   │   └── utils/              # Formatação, helpers
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf              # Reverse proxy + SSL
│
├── docker-compose.yml          # Orquestração de containers
└── .env.example                # Variáveis de ambiente
```

---

## 🔐 Credenciais Padrão

| Usuário | Email | Senha | Papel |
|---------|-------|-------|-------|
| Administrador | admin@hmed.com | Admin@2024 | Admin |
| Demo | demo@hmed.com | Demo@2024 | Gerente |

> ⚠️ **IMPORTANTE:** Altere as senhas após o primeiro acesso!

---

## 📊 Funcionalidades

### ✅ Dashboard
- KPIs em tempo real (receitas, despesas, lucro, clientes)
- Gráfico de receitas vs despesas (12 meses)
- Despesas por categoria (gráfico pizza)
- Últimas movimentações
- Contas vencendo nos próximos 7 dias
- Top clientes por volume

### ✅ Financeiro
- Controle de receitas e despesas
- Filtros avançados (data, tipo, status, categoria, valor)
- Marcar como pago com um clique
- Editar e excluir movimentações
- Categorização automática

### ✅ Importação Inteligente
- Upload drag-and-drop de Excel (.xlsx), CSV
- Pré-visualização antes de importar
- Detecção automática de tipo (receita/despesa)
- Mapeamento automático de categorias
- Parser inteligente de datas e valores brasileiros

### ✅ Vendas
- Registro de pedidos com itens
- Controle de status (Pendente → Confirmado → Entregue)
- Relatório de vendas filtrado

### ✅ Clientes
- Cadastro completo (Hospitais, Clínicas, Farmácias, etc.)
- Histórico de compras por cliente
- Filtro por tipo e status

### ✅ Produtos
- Controle de estoque
- Alerta de estoque mínimo
- Preço de custo e venda

### ✅ Relatórios
- DRE (Demonstrativo de Resultado)
- Fluxo de caixa
- Despesas por categoria

### ✅ Configurações
- Personalizar identidade visual (logo, cores)
- Gerenciar usuários e permissões
- Configurar notificações

---

## 🌐 Configurar HTTPS (SSL)

### Com Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Copiar certificados
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem nginx/ssl/

# Descomentar bloco HTTPS no nginx/nginx.conf
# e reiniciar: docker compose restart nginx
```

---

## 🔧 Comandos Úteis

```bash
# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar serviço
docker compose restart backend

# Acessar banco de dados
docker compose exec postgres psql -U hmed_user -d hmed_db

# Executar migration
docker compose exec backend npx prisma migrate deploy

# Backup do banco
docker compose exec postgres pg_dump -U hmed_user hmed_db > backup.sql

# Restaurar backup
docker compose exec -T postgres psql -U hmed_user hmed_db < backup.sql

# Parar sistema
docker compose down

# Parar e remover volumes (⚠️ apaga dados!)
docker compose down -v
```

---

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Usuário logado
- `POST /api/auth/logout` — Logout

### Financeiro
- `GET /api/transactions` — Listar com filtros
- `POST /api/transactions` — Criar
- `PUT /api/transactions/:id` — Atualizar
- `DELETE /api/transactions/:id` — Excluir (soft delete)
- `PATCH /api/transactions/:id/pay` — Marcar como pago

### Dashboard
- `GET /api/dashboard` — KPIs e gráficos

### Importação
- `POST /api/import/preview` — Preview do arquivo
- `POST /api/import/upload` — Importar arquivo

### Relatórios
- `GET /api/reports/dre` — DRE
- `GET /api/reports/cash-flow` — Fluxo de caixa

---

## 🏗️ Tecnologias

**Backend:** Node.js · TypeScript · Express · Prisma · PostgreSQL · Redis · Socket.io · JWT

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Recharts · Zustand · React Query

**Infra:** Docker · Nginx · Let's Encrypt

---

## 📞 Suporte

H MED DISTRIBUIDORA
Email: hmeddistribuidora2025@gmail.com
