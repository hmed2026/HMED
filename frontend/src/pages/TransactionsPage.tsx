import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Filter, Download, Search, ArrowUpRight, ArrowDownRight, Edit, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, TRANSACTION_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../utils/format';
import toast from 'react-hot-toast';
import TransactionModal from '../components/forms/TransactionModal';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-yellow',
  PAID: 'badge-green',
  OVERDUE: 'badge-red',
  CANCELLED: 'badge-blue',
  PARTIAL: 'badge-purple',
};

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', page, search, typeFilter, statusFilter],
    queryFn: () => api.get('/transactions', { params: { page, limit: 20, search, type: typeFilter, status: statusFilter } }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); toast.success('Movimentação excluída'); },
    onError: () => toast.error('Erro ao excluir'),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/transactions/${id}/pay`, { paidAt: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); toast.success('Marcado como pago!'); },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const openCreate = () => { setEditingItem(null); setModalOpen(true); };
  const openEdit = (item: any) => { setEditingItem(item); setModalOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-semibold text-xl">Financeiro</h2>
          <p className="text-dark-400 text-sm">Controle de receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-secondary text-sm p-2.5"><RefreshCw size={15} /></button>
          <button className="btn-secondary text-sm"><Download size={15} />Exportar</button>
          <button onClick={openCreate} className="btn-primary text-sm"><Plus size={15} />Nova Movimentação</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Receitas', value: data?.data?.filter((t:any) => t.type==='INCOME').reduce((s:number,t:any)=>s+t.amount,0) || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
          { label: 'Despesas', value: data?.data?.filter((t:any) => t.type==='EXPENSE').reduce((s:number,t:any)=>s+t.amount,0) || 0, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
          { label: 'Saldo', value: (data?.data?.filter((t:any) => t.type==='INCOME').reduce((s:number,t:any)=>s+t.amount,0)||0) - (data?.data?.filter((t:any) => t.type==='EXPENSE').reduce((s:number,t:any)=>s+t.amount,0)||0), color: 'text-primary-400', bg: 'bg-primary-500/5 border-primary-500/20' },
        ].map(card => (
          <div key={card.label} className={`glass-card p-4 border ${card.bg}`}>
            <p className="text-dark-400 text-xs mb-1">{card.label}</p>
            <p className={`font-bold text-lg ${card.color}`}>{formatCurrency(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 text-sm py-2" placeholder="Buscar..." />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="input-field text-sm py-2 w-auto">
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field text-sm py-2 w-auto">
          <option value="">Todos os status</option>
          {Object.entries(TRANSACTION_STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Tipo', 'Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left text-dark-400 text-xs font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length:8}).map((_,i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({length:7}).map((_,j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data?.map((t: any) => (
                <motion.tr
                  key={t.id}
                  className="table-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type==='INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {t.type==='INCOME' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-dark-100 text-sm font-medium">{t.description}</p>
                    {t.client && <p className="text-dark-500 text-xs">{t.client.name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {t.category ? (
                      <span className="flex items-center gap-1.5 text-xs text-dark-300">
                        <span className="w-2 h-2 rounded-full" style={{background: t.category.color}} />
                        {t.category.name}
                      </span>
                    ) : <span className="text-dark-500 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-dark-300 text-sm whitespace-nowrap">{formatDate(t.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold text-sm ${t.type==='INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type==='INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUS_COLORS[t.status] || 'badge-blue'}>{TRANSACTION_STATUS_LABELS[t.status] || t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {t.status === 'PENDING' && (
                        <button onClick={() => payMutation.mutate(t.id)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Marcar como pago">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => { if(confirm('Excluir esta movimentação?')) deleteMutation.mutate(t.id); }} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {!isLoading && !data?.data?.length && (
                <tr><td colSpan={7} className="text-center text-dark-500 py-12 text-sm">Nenhuma movimentação encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-dark-400 text-sm">{data.pagination.total} registros</p>
            <div className="flex items-center gap-2">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Anterior</button>
              <span className="text-dark-300 text-sm px-2">{page} / {data.pagination.totalPages}</span>
              <button disabled={page>=data.pagination.totalPages} onClick={() => setPage(p=>p+1)} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Próximo</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <TransactionModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setModalOpen(false); }}
        />
      )}
    </div>
  );
}
