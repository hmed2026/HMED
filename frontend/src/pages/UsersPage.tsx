import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit, UserX, Shield, User } from 'lucide-react';
import api from '../services/api';
import { formatDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string,string> = { SUPER_ADMIN:'Super Admin', ADMIN:'Administrador', MANAGER:'Gerente', OPERATOR:'Operador', VIEWER:'Visualizador' };
const ROLE_COLORS: Record<string,string> = { SUPER_ADMIN:'badge-red', ADMIN:'badge-purple', MANAGER:'badge-blue', OPERATOR:'badge-green', VIEWER:'badge-yellow' };

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'OPERATOR' });

  const { data, isLoading } = useQuery({ queryKey:['users'], queryFn:()=>api.get('/users').then(r=>r.data) });

  const saveMutation = useMutation({
    mutationFn: (d:any) => api.post('/users', d),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['users']}); setModalOpen(false); toast.success('Usuário criado!'); },
    onError: () => toast.error('Erro ao criar usuário'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id:string) => api.delete(`/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['users']}); toast.success('Usuário desativado'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-white font-semibold text-xl">Usuários</h2><p className="text-dark-400 text-sm">Gerenciar equipe e permissões</p></div>
        <button onClick={()=>{setForm({name:'',email:'',password:'',role:'OPERATOR'});setModalOpen(true);}} className="btn-primary text-sm"><Plus size={15}/>Novo Usuário</button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/[0.06]">{['Usuário','Email','Cargo','Status','Último Acesso','Ações'].map(h=><th key={h} className="text-left text-dark-400 text-xs font-semibold px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? Array.from({length:5}).map((_,i)=><tr key={i} className="border-b border-white/[0.04]">{Array.from({length:6}).map((_,j)=><td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-24"/></td>)}</tr>) : data?.map((u:any)=>(
              <motion.tr key={u.id} className="table-row" initial={{opacity:0}} animate={{opacity:1}}>
                <td className="px-4 py-3"><div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-700/20 flex items-center justify-center text-primary-300 text-xs font-bold">{u.name.charAt(0)}</div>
                  <span className="text-dark-100 text-sm font-medium">{u.name}</span>
                </div></td>
                <td className="px-4 py-3 text-dark-300 text-sm">{u.email}</td>
                <td className="px-4 py-3"><span className={ROLE_COLORS[u.role]||'badge-blue'}>{ROLE_LABELS[u.role]||u.role}</span></td>
                <td className="px-4 py-3"><span className={u.isActive?'badge-green':'badge-red'}>{u.isActive?'Ativo':'Inativo'}</span></td>
                <td className="px-4 py-3 text-dark-400 text-sm whitespace-nowrap">{u.lastLoginAt?formatDateTime(u.lastLoginAt):'Nunca'}</td>
                <td className="px-4 py-3">
                  <button onClick={()=>{if(confirm('Desativar?'))deactivateMutation.mutate(u.id);}} className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" disabled={!u.isActive}><UserX size={14}/></button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
          <motion.div className="glass-card w-full max-w-md relative z-10 p-6" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}>
            <h3 className="text-white font-semibold text-lg mb-5">Novo Usuário</h3>
            <div className="space-y-3">
              <div><label className="text-dark-300 text-sm mb-1 block">Nome *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input-field text-sm"/></div>
              <div><label className="text-dark-300 text-sm mb-1 block">Email *</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="input-field text-sm"/></div>
              <div><label className="text-dark-300 text-sm mb-1 block">Senha *</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="input-field text-sm"/></div>
              <div><label className="text-dark-300 text-sm mb-1 block">Cargo</label>
                <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="input-field text-sm">
                  {Object.entries(ROLE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button onClick={()=>saveMutation.mutate(form)} disabled={!form.name||!form.email||!form.password||saveMutation.isPending} className="btn-primary flex-1 justify-center">{saveMutation.isPending?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:'Criar'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
