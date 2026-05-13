import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, Palette, Bell, Shield, Building2, Save } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('company');

  const { data: company } = useQuery({ queryKey:['company'], queryFn:()=>api.get('/company').then(r=>r.data) });
  const [companyForm, setCompanyForm] = useState({ name:'', email:'', phone:'', address:'', city:'', state:'' });

  const saveMutation = useMutation({
    mutationFn: (d:any) => api.put('/company', d),
    onSuccess: () => toast.success('Configurações salvas!'),
    onError: () => toast.error('Erro ao salvar'),
  });

  const tabs = [
    { id:'company', icon:Building2, label:'Empresa' },
    { id:'appearance', icon:Palette, label:'Aparência' },
    { id:'notifications', icon:Bell, label:'Notificações' },
    { id:'security', icon:Shield, label:'Segurança' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h2 className="text-white font-semibold text-xl">Configurações</h2><p className="text-dark-400 text-sm">Personalize o sistema para sua empresa</p></div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab===t.id?'bg-primary-700/30 text-white border border-primary-600/30':'text-dark-300 hover:text-white hover:bg-dark-700/60'}`}>
            <t.icon size={15}/>{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'company' && (
        <motion.div className="glass-card p-6" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <h3 className="text-white font-semibold mb-5">Dados da Empresa</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-dark-300 text-sm mb-1.5 block">Nome da Empresa</label><input defaultValue={company?.name} onChange={e=>setCompanyForm({...companyForm,name:e.target.value})} className="input-field text-sm" /></div>
              <div><label className="text-dark-300 text-sm mb-1.5 block">Email</label><input type="email" defaultValue={company?.email} onChange={e=>setCompanyForm({...companyForm,email:e.target.value})} className="input-field text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-dark-300 text-sm mb-1.5 block">Telefone</label><input defaultValue={company?.phone} onChange={e=>setCompanyForm({...companyForm,phone:e.target.value})} className="input-field text-sm" /></div>
              <div><label className="text-dark-300 text-sm mb-1.5 block">Cidade</label><input defaultValue={company?.city} onChange={e=>setCompanyForm({...companyForm,city:e.target.value})} className="input-field text-sm" /></div>
            </div>
            <button onClick={()=>saveMutation.mutate(companyForm)} disabled={saveMutation.isPending} className="btn-primary text-sm">
              {saveMutation.isPending?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Save size={14}/>Salvar Alterações</>}
            </button>
          </div>
        </motion.div>
      )}

      {activeTab === 'appearance' && (
        <motion.div className="glass-card p-6" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <h3 className="text-white font-semibold mb-5">Aparência</h3>
          <div className="space-y-4">
            <div>
              <label className="text-dark-300 text-sm mb-3 block">Cor Principal</label>
              <div className="flex gap-3 flex-wrap">
                {['#1e40af','#7c3aed','#059669','#dc2626','#d97706','#0891b2'].map(color=>(
                  <button key={color} className="w-10 h-10 rounded-xl border-2 border-white/20 hover:border-white/60 transition-all" style={{background:color}} title={color}/>
                ))}
              </div>
            </div>
            <div>
              <label className="text-dark-300 text-sm mb-3 block">Tema</label>
              <div className="flex gap-3">
                {['Escuro','Claro','Sistema'].map(t=>(
                  <button key={t} className={`px-4 py-2 rounded-xl text-sm border transition-all ${t==='Escuro'?'bg-primary-700/30 border-primary-600/30 text-white':'border-white/[0.08] text-dark-400 hover:text-white'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-dark-300 text-sm mb-1.5 block">Upload de Logo</label>
              <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-primary-500/40 transition-colors cursor-pointer">
                <p className="text-dark-400 text-sm">Arraste sua logo ou clique para selecionar</p>
                <p className="text-dark-600 text-xs mt-1">PNG, SVG - máx 2MB</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div className="glass-card p-6" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <h3 className="text-white font-semibold mb-5">Notificações</h3>
          <div className="space-y-4">
            {[
              { label:'Contas vencendo', desc:'Alerta 3 dias antes do vencimento' },
              { label:'Meta atingida', desc:'Quando atingir meta financeira' },
              { label:'Nova venda', desc:'Ao registrar nova venda' },
              { label:'Estoque baixo', desc:'Quando produto atingir estoque mínimo' },
              { label:'Importação concluída', desc:'Ao finalizar importação de arquivo' },
            ].map((n,i)=>(
              <div key={i} className="flex items-center justify-between p-4 bg-dark-800/40 rounded-xl">
                <div><p className="text-dark-100 text-sm font-medium">{n.label}</p><p className="text-dark-500 text-xs mt-0.5">{n.desc}</p></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer"/>
                  <div className="w-11 h-6 bg-dark-700 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"/>
                </label>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div className="glass-card p-6" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <h3 className="text-white font-semibold mb-5">Segurança</h3>
          <div className="space-y-4">
            <div><label className="text-dark-300 text-sm mb-1.5 block">Senha Atual</label><input type="password" className="input-field text-sm" placeholder="••••••••"/></div>
            <div><label className="text-dark-300 text-sm mb-1.5 block">Nova Senha</label><input type="password" className="input-field text-sm" placeholder="••••••••"/></div>
            <div><label className="text-dark-300 text-sm mb-1.5 block">Confirmar Nova Senha</label><input type="password" className="input-field text-sm" placeholder="••••••••"/></div>
            <button className="btn-primary text-sm"><Save size={14}/>Alterar Senha</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
