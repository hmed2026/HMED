import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string,string> = { PENDING:'Pendente', CONFIRMED:'Confirmado', DELIVERED:'Entregue', CANCELLED:'Cancelado', RETURNED:'Devolvido' };
const STATUS_COLORS: Record<string,string> = { PENDING:'badge-yellow', CONFIRMED:'badge-blue', DELIVERED:'badge-green', CANCELLED:'badge-red', RETURNED:'badge-purple' };

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search],
    queryFn: () => api.get('/sales', { params: { page, limit:20, search } }).then(r=>r.data),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sales/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); toast.success('Venda excluída'); },
  });

  const totalSales = data?.data?.reduce((s:number,t:any)=>s+t.total,0) || 0;
  const totalItems = data?.pagination?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-white font-semibold text-xl">Vendas</h2><p className="text-dark-400 text-sm">Controle de pedidos e faturamento</p></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Vendido', value:formatCurrency(totalSales), icon:TrendingUp, color:'text-emerald-400', bg:'bg-emerald-500/10 border-emerald-500/20' },
          { label:'Número de Vendas', value:totalItems, icon:ShoppingCart, color:'text-primary-400', bg:'bg-primary-500/10 border-primary-500/20' },
          { label:'Ticket Médio', value:totalItems>0?formatCurrency(totalSales/totalItems):'R$ 0,00', icon:Package, color:'text-purple-400', bg:'bg-purple-500/10 border-purple-500/20' },
        ].map(c=>(
          <div key={c.label} className={`glass-card p-4 border ${c.bg}`}>
            <div className="flex items-center gap-2 mb-2"><c.icon size={16} className={c.color} /><p className="text-dark-400 text-xs">{c.label}</p></div>
            <p className={`font-bold text-xl ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="glass-card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="input-field pl-9 text-sm py-2" placeholder="Buscar por cliente..." />
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">
              {['Nº','Cliente','Data','Itens','Total','Status','Ações'].map(h=><th key={h} className="text-left text-dark-400 text-xs font-semibold px-4 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {isLoading ? Array.from({length:8}).map((_,i)=>(
                <tr key={i} className="border-b border-white/[0.04]">{Array.from({length:7}).map((_,j)=><td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>)}</tr>
              )) : data?.data?.map((s:any)=>(
                <motion.tr key={s.id} className="table-row" initial={{opacity:0}} animate={{opacity:1}}>
                  <td className="px-4 py-3 text-primary-400 font-mono text-sm">#{s.number}</td>
                  <td className="px-4 py-3"><p className="text-dark-100 text-sm">{s.client?.name||'—'}</p></td>
                  <td className="px-4 py-3 text-dark-300 text-sm whitespace-nowrap">{formatDate(s.soldAt)}</td>
                  <td className="px-4 py-3 text-dark-300 text-sm">{s.items?.length||0} item(s)</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold text-sm">{formatCurrency(s.total)}</td>
                  <td className="px-4 py-3"><span className={STATUS_COLORS[s.status]||'badge-blue'}>{STATUS_LABELS[s.status]||s.status}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={()=>{if(confirm('Excluir?'))deleteMutation.mutate(s.id);}} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14}/></button>
                  </td>
                </motion.tr>
              ))}
              {!isLoading&&!data?.data?.length&&<tr><td colSpan={7} className="text-center text-dark-500 py-12 text-sm">Nenhuma venda encontrada</td></tr>}
            </tbody>
          </table>
        </div>
        {data?.pagination&&(<div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <p className="text-dark-400 text-sm">{data.pagination.total} vendas</p>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Anterior</button>
            <span className="text-dark-300 text-sm px-2">{page}/{data.pagination.totalPages}</span>
            <button disabled={page>=data.pagination.totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Próximo</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}
