import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Building2 } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, CLIENT_TYPE_LABELS } from '../utils/format';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ name:'',email:'',phone:'',type:'COMPANY',city:'',state:'',notes:'' });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: () => api.get('/clients', { params: { page, limit: 16, search } }).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d: any) => editingItem ? api.put(`/clients/${editingItem.id}`, d) : api.post('/clients', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setModalOpen(false); toast.success('Cliente salvo!'); },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); toast.success('Cliente excluído'); },
  });

  const openCreate = () => { setEditingItem(null); setForm({ name:'',email:'',phone:'',type:'COMPANY',city:'',state:'',notes:'' }); setModalOpen(true); };
  const openEdit = (c: any) => { setEditingItem(c); setForm({name:c.name,email:c.email||'',phone:c.phone||'',type:c.type,city:c.city||'',state:c.state||'',notes:c.notes||''}); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-white font-semibold text-xl">Clientes</h2>
          <p className="text-dark-400 text-sm">Gerenciamento de clientes e parceiros</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm"><Plus size={15} />Novo Cliente</button>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9 text-sm py-2" placeholder="Buscar por nome, email..." />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i) => <div key={i} className="skeleton rounded-2xl h-44" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data?.map((client: any, i: number) => (
            <motion.div key={client.id} className="glass-card-hover p-5" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-700/20 flex items-center justify-center text-primary-300 font-bold text-sm">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg text-dark-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"><Edit size={13} /></button>
                  <button onClick={() => { if(confirm('Excluir?')) deleteMutation.mutate(client.id); }} className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="text-white font-semibold text-sm">{client.name}</p>
              <span className="badge-blue text-xs mt-1 inline-block">{CLIENT_TYPE_LABELS[client.type] || client.type}</span>
              <div className="mt-3 space-y-1">
                {client.email && <p className="text-dark-400 text-xs flex items-center gap-1.5"><Mail size={11} />{client.email}</p>}
                {client.phone && <p className="text-dark-400 text-xs flex items-center gap-1.5"><Phone size={11} />{client.phone}</p>}
                {client.city && <p className="text-dark-400 text-xs flex items-center gap-1.5"><MapPin size={11} />{client.city}{client.state && `, ${client.state}`}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-dark-500 text-xs">Total de compras</p>
                <p className="text-emerald-400 font-semibold text-sm">{formatCurrency(client.totalPurchases)}</p>
              </div>
            </motion.div>
          ))}
          {!data?.data?.length && <div className="col-span-full text-center text-dark-500 py-12 text-sm">Nenhum cliente encontrado</div>}
        </div>
      )}

      {data?.pagination && (
        <div className="flex items-center justify-between">
          <p className="text-dark-400 text-sm">{data.pagination.total} clientes</p>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Anterior</button>
            <span className="text-dark-300 text-sm px-2">{page} / {data.pagination.totalPages}</span>
            <button disabled={page>=data.pagination.totalPages} onClick={() => setPage(p=>p+1)} className="btn-secondary text-xs py-1.5 disabled:opacity-40">Próximo</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <motion.div className="glass-card w-full max-w-lg relative z-10 p-6" initial={{ scale:0.95,opacity:0 }} animate={{ scale:1,opacity:1 }}>
            <h3 className="text-white font-semibold text-lg mb-5">{editingItem ? 'Editar' : 'Novo'} Cliente</h3>
            <div className="space-y-3">
              <div><label className="text-dark-300 text-sm mb-1 block">Nome *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field text-sm" placeholder="Nome do cliente" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-dark-300 text-sm mb-1 block">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field text-sm" /></div>
                <div><label className="text-dark-300 text-sm mb-1 block">Telefone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input-field text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-dark-300 text-sm mb-1 block">Tipo</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input-field text-sm">
                    {Object.entries(CLIENT_TYPE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div><label className="text-dark-300 text-sm mb-1 block">Cidade</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="input-field text-sm" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending} className="btn-primary flex-1 justify-center">
                  {saveMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
