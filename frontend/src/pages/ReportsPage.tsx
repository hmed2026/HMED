import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Download } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/format';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => { const d=new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: dreData, isLoading: dreLoading } = useQuery({
    queryKey: ['reports-dre', startDate, endDate],
    queryFn: () => api.get('/reports/dre', { params: { startDate, endDate } }).then(r=>r.data),
  });

  const { data: cfData, isLoading: cfLoading } = useQuery({
    queryKey: ['reports-cashflow', startDate, endDate],
    queryFn: () => api.get('/reports/cash-flow', { params: { startDate, endDate } }).then(r=>r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-white font-semibold text-xl">Relatórios</h2><p className="text-dark-400 text-sm">Análise financeira e DRE</p></div>
        <button className="btn-secondary text-sm"><Download size={15}/>Exportar PDF</button>
      </div>

      {/* Date filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-dark-400 text-sm">De:</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="input-field text-sm py-2 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-dark-400 text-sm">Até:</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="input-field text-sm py-2 w-auto" />
        </div>
      </div>

      {/* DRE Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Receita Total', value:dreData?.totalIncome||0, color:'text-emerald-400', bg:'bg-emerald-500/10 border-emerald-500/20' },
          { label:'Despesas Totais', value:dreData?.totalExpense||0, color:'text-red-400', bg:'bg-red-500/10 border-red-500/20' },
          { label:'Lucro Líquido', value:dreData?.netProfit||0, color:'text-primary-400', bg:'bg-primary-500/10 border-primary-500/20' },
          { label:'Margem de Lucro', value:`${(dreData?.margin||0).toFixed(1)}%`, color:'text-purple-400', bg:'bg-purple-500/10 border-purple-500/20', isString:true },
        ].map(c=>(
          <div key={c.label} className={`glass-card p-4 border ${c.bg}`}>
            <p className="text-dark-400 text-xs mb-2">{c.label}</p>
            <p className={`font-bold text-xl ${c.color}`}>{c.isString ? c.value : formatCurrency(c.value as number)}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cash Flow */}
        <motion.div className="glass-card p-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h3 className="text-white font-semibold mb-4">Fluxo de Caixa</h3>
          {cfLoading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cfData?.slice(-30)||[]}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="description" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v?.substring(0,6)} />
                <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'12px',fontSize:'12px'}} formatter={(v:number)=>formatCurrency(v)} />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fill="url(#balGrad)" name="Saldo" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Expense by Category */}
        <motion.div className="glass-card p-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
          <h3 className="text-white font-semibold mb-4">Despesas por Categoria</h3>
          {dreLoading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dreData?.expenseByCategory?.slice(0,6)||[]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis type="number" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                <YAxis type="category" dataKey="categoryId" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} width={80} tickFormatter={v=>v?.substring(0,10)||'Sem cat.'}/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid rgba(59,130,246,0.3)',borderRadius:'12px',fontSize:'12px'}} formatter={(v:number)=>formatCurrency(v)}/>
                <Bar dataKey="_sum.amount" radius={[0,4,4,0]}>
                  {(dreData?.expenseByCategory||[]).map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
