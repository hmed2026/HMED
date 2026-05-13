import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ name:'',code:'',category:'',unit:'UN',costPrice:'',salePrice:'',stock:'',minStock:'' });

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => api.get('/products', { params: { page, limit:20, search } }).then(r=>r.data),
  });
  const saveMutation = useMutation({
    mutationFn: (d:any) => editingItem ? api.put(`/products/${editingItem.id}`, d) : api.post('/products', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setModalOpen(false); toast.success('Produto salvo!'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id:string) => api.delete(`/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Produto excluído'); },
  });

  const openCreate = () => { setEditingItem(null); setForm({ name:'',code:'',category:'',unit:'UN',costPrice:'',salePrice:'',stock:'',minStock:'' }); setModalOpen(true); };
  const openEdit = (p:any) => { setEditingItem(p); setForm({name:p.name,code:p.code||'',category:p.category||'',unit:p.unit||'UN',costPrice:p.costPrice,salePrice:p.salePrice,stock:p.stock,minStock:p.minStock}); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-white font-semibold text-xl">Produtos</h2><p className="text-dark-400 text-sm">Gestão de estoque e produtos</p></div>
        <button onClick={openCreate} className="btn-primary text-sm"><Plus size={15}/>Novo Produto</button>
      </div>
      <div className="glass-card p-4">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" /><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="input-field pl-9 text-sm py-2" placeholder="Buscar produto..." /></div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.06]">{['Produto','Código','Categoria','Custo','Venda','Estoque','Ações'].map(h=><th key={h} className="text-left text-dark-400 text-xs font-semibold px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {isLoading ? Array.from({length:8}).map((_,i)=><tr key={i} className="border-b border-white/[0.04]">{Array.from({length:7}).map((_,j)=><td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>)}</tr>) : data?.data?.map((p:any)=>(
                <motion.tr key={p.id} className="table-row" initial={{opacity:0}} animate={{opacity:1}}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary-700/20 flex items-center justify-center"><Package size={14} className="text-primary-400" /></div><p className="text-dark-100 text-sm font-medium">{p.name}</p></div></td>
                  <td className="px-4 py-3 text-dark-400 text-xs font-mono">{p.code||'—'}</td>
                  <td className="px-4 py-3 text-dark-300 text-sm">{p.category||'—'}</td>
                  <td className="px-4 py-3 text-dark-300 text-sm">{formatCurrency(p.costPrice)}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold text-sm">{formatCurrency(p.salePrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {p.stock <= p.minStock && <AlertTriangle size={13} className="text-yellow-400" />}
                      <span className={`text-sm font-medium ${p.stock<=p.minStock?'text-yellow-400':'text-dark-200'}`}>{p.stock} {p.unit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <button onClick={()=>openEdit(p)} className="p-1.5 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"><Edit size={14}/></button>
                    <button onClick={()=>{if(confirm('Excluir?'))deleteMutation.mutate(p.id);}} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14}/></button>
                  </div></td>
                </motion.tr>
              ))}
              {!isLoading&&!data?.data?.length&&<tr><td colSpan={7} className="text-center text-dark-500 py-12 text-sm">Nenhum produto encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)} />
          <motion.div className="glass-card w-full max-w-lg relative z-10 p-6" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
            <h3 className="text-white font-semibold text-lg mb-5">{editingItem?'Editar':'Novo'} Produto</h3>
            <div className="space-y-3">
              <div><label className="text-dark-300 text-sm mb-1 block">Nome *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-dark-300 text-sm mb-1 block">Código</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="input-field text-sm" /></div>
                <div><label className="text-dark-300 text-sm mb-1 block">Unidade</label><input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} className="input-field text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-dark-300 text-sm mb-1 block">Preço Custo (R$)</label><input type="number" step="0.01" value={form.costPrice} onChange={e=>setForm({...form,costPrice:e.target.value})} className="input-field text-sm" /></div>
                <div><label className="text-dark-300 text-sm mb-1 block">Preço Venda (R$)</label><input type="number" step="0.01" value={form.salePrice} onChange={e=>setForm({...form,salePrice:e.target.value})} className="input-field text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-dark-300 text-sm mb-1 block">Estoque</label><input type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="input-field text-sm" /></div>
                <div><label className="text-dark-300 text-sm mb-1 block">Estoque Mínimo</label><input type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} className="input-field text-sm" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button onClick={()=>saveMutation.mutate(form)} disabled={!form.name||saveMutation.isPending} className="btn-primary flex-1 justify-center">{saveMutation.isPending?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:'Salvar'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
