import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart,
  ArrowUpRight, ArrowDownRight, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';
import SkeletonCard from '../components/ui/SkeletonCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' } }),
};

export default function DashboardPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height="h-32" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <SkeletonCard height="h-72 lg:col-span-2" />
        <SkeletonCard height="h-72" />
      </div>
    </div>
  );

  const { kpis, monthlyChart, expenseByCategory, recentTransactions, upcomingPayments, topClients } = data || {};

  const kpiCards = [
    {
      title: 'Receita do Mês',
      value: kpis?.income?.value || 0,
      growth: kpis?.income?.growth || 0,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      positive: true,
    },
    {
      title: 'Despesas do Mês',
      value: kpis?.expense?.value || 0,
      growth: kpis?.expense?.growth || 0,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20',
      positive: false,
    },
    {
      title: 'Lucro Líquido',
      value: kpis?.profit?.value || 0,
      growth: kpis?.profit?.growth || 0,
      icon: DollarSign,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10 border-primary-500/20',
      positive: true,
    },
    {
      title: 'Clientes Ativos',
      value: kpis?.clientsActive || 0,
      growth: 0,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      positive: true,
      isCurrency: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-xl">Visão Geral</h2>
          <p className="text-dark-400 text-sm mt-0.5">Métricas em tempo real do negócio</p>
        </div>
        <motion.button
          onClick={() => refetch()}
          className="btn-secondary text-sm"
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Atualizar</span>
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.title}
            className="stat-card"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ translateY: -2 }}
          >
            {/* Background glow */}
            <div className={`absolute inset-0 rounded-2xl opacity-20 ${card.bgColor}`} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl border ${card.bgColor}`}>
                  <card.icon size={18} className={card.color} />
                </div>
                {card.growth !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                    (card.positive ? card.growth > 0 : card.growth < 0)
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {card.growth > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(card.growth).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-dark-400 text-xs mb-1">{card.title}</p>
              <p className="text-white font-bold text-xl">
                {card.isCurrency === false ? card.value.toLocaleString('pt-BR') : formatCurrency(card.value)}
              </p>
              <p className="text-dark-500 text-xs mt-1">vs mês anterior</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <motion.div
          className="glass-card p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">Receitas vs Despesas</h3>
              <p className="text-dark-400 text-sm">Últimos 12 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyChart || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#colorIncome)" name="Receita" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#colorExpense)" name="Despesa" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Expense by Category */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-white font-semibold mb-1">Despesas por Categoria</h3>
          <p className="text-dark-400 text-sm mb-4">Mês atual</p>
          {expenseByCategory?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                    {expenseByCategory.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#1e293b', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {expenseByCategory.slice(0, 4).map((cat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color || COLORS[i % COLORS.length] }} />
                      <span className="text-dark-300 truncate max-w-[100px]">{cat.category}</span>
                    </div>
                    <span className="text-dark-200 font-medium">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-dark-500 text-sm">
              Nenhum dado disponível
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-white font-semibold mb-4">Últimas Movimentações</h3>
          <div className="space-y-3">
            {recentTransactions?.slice(0, 6).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/40 hover:bg-dark-700/40 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {t.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-dark-100 text-sm font-medium truncate">{t.description}</p>
                  <p className="text-dark-500 text-xs">{t.category?.name || 'Sem categoria'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-dark-500 text-xs">
                    {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-dark-500 text-sm text-center py-8">Nenhuma movimentação encontrada</p>
            )}
          </div>
        </motion.div>

        {/* Upcoming payments + Top clients */}
        <div className="space-y-6">
          {/* Upcoming */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-yellow-400" />
              <h3 className="text-white font-semibold">Contas a Pagar (7 dias)</h3>
            </div>
            <div className="space-y-2">
              {upcomingPayments?.length > 0 ? upcomingPayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <div className="min-w-0">
                    <p className="text-dark-200 text-sm truncate">{p.description}</p>
                    <p className="text-dark-500 text-xs">Vence: {new Date(p.dueDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-yellow-400 font-semibold text-sm ml-2 flex-shrink-0">{formatCurrency(p.amount)}</span>
                </div>
              )) : (
                <p className="text-dark-500 text-sm text-center py-4">✅ Nenhuma conta vencendo</p>
              )}
            </div>
          </motion.div>

          {/* Top Clients */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-white font-semibold mb-4">Top Clientes</h3>
            <div className="space-y-2.5">
              {topClients?.map((client: any, i: number) => (
                <div key={client.id} className="flex items-center gap-3">
                  <span className="text-dark-500 text-xs w-4">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-primary-700/20 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark-200 text-sm truncate">{client.name}</p>
                  </div>
                  <span className="text-dark-300 text-sm font-medium">{formatCurrency(client.totalPurchases)}</span>
                </div>
              )) || <p className="text-dark-500 text-sm text-center py-4">Nenhum cliente encontrado</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
