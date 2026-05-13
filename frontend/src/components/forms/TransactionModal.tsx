import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Props { item?: any; onClose: () => void; onSuccess: () => void; }

export default function TransactionModal({ item, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: item ? {
      ...item,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
      amount: item.amount,
    } : { type: 'EXPENSE', status: 'PENDING' },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const { data: clients } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => api.get('/clients', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => item
      ? api.put(`/transactions/${item.id}`, data)
      : api.post('/transactions', data),
    onSuccess: () => {
      toast.success(item ? 'Movimentação atualizada!' : 'Movimentação criada!');
      onSuccess();
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="glass-card w-full max-w-lg relative z-10 p-6"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">{item ? 'Editar' : 'Nova'} Movimentação</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-700/60 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dark-300 text-sm mb-1.5 block">Tipo *</label>
              <select {...register('type', { required: true })} className="input-field text-sm">
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
                <option value="TRANSFER">Transferência</option>
              </select>
            </div>
            <div>
              <label className="text-dark-300 text-sm mb-1.5 block">Status</label>
              <select {...register('status')} className="input-field text-sm">
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Vencido</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-dark-300 text-sm mb-1.5 block">Descrição *</label>
            <input {...register('description', { required: 'Descrição obrigatória' })} className="input-field text-sm" placeholder="Ex: Pagamento de fornecedor" />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dark-300 text-sm mb-1.5 block">Valor (R$) *</label>
              <input {...register('amount', { required: true, min: 0.01 })} type="number" step="0.01" className="input-field text-sm" placeholder="0,00" />
            </div>
            <div>
              <label className="text-dark-300 text-sm mb-1.5 block">Vencimento *</label>
              <input {...register('dueDate', { required: true })} type="date" className="input-field text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-dark-300 text-sm mb-1.5 block">Categoria</label>
              <select {...register('categoryId')} className="input-field text-sm">
                <option value="">Sem categoria</option>
                {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-dark-300 text-sm mb-1.5 block">Forma de Pagamento</label>
              <select {...register('paymentMethod')} className="input-field text-sm">
                <option value="">Selecionar</option>
                {[['PIX','PIX'],['CASH','Dinheiro'],['CREDIT_CARD','Cartão Crédito'],['DEBIT_CARD','Cartão Débito'],['BANK_TRANSFER','Transferência'],['BOLETO','Boleto']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-dark-300 text-sm mb-1.5 block">Cliente</label>
            <select {...register('clientId')} className="input-field text-sm">
              <option value="">Nenhum</option>
              {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-dark-300 text-sm mb-1.5 block">Observações</label>
            <textarea {...register('notes')} className="input-field text-sm resize-none" rows={2} placeholder="Observações opcionais..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={15} />{item ? 'Atualizar' : 'Criar'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
