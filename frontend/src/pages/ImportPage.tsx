import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileText, CheckCircle, AlertCircle, X, ArrowUpRight, ArrowDownRight, FileSpreadsheet, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

export default function ImportPage() {
  const [result, setResult] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);

  const previewMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append('file', file);
      return api.post('/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: setPreview,
    onError: () => toast.error('Erro ao pré-visualizar arquivo'),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData(); fd.append('file', file); fd.append('type', 'TRANSACTIONS');
      return api.post('/import/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: (data) => { setResult(data); setPreview(null); toast.success(data.message); },
    onError: () => toast.error('Erro ao importar arquivo'),
  });

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) previewMutation.mutate(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/csv': ['.csv'] },
    maxFiles: 1, maxSize: 50*1024*1024,
  });

  const handleImport = () => { if (acceptedFiles[0]) importMutation.mutate(acceptedFiles[0]); };
  const handleReset = () => { setResult(null); setPreview(null); };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-white font-semibold text-xl">Importar Dados</h2>
        <p className="text-dark-400 text-sm mt-0.5">Importe planilhas de transações, vendas e clientes automaticamente</p>
      </div>

      {/* Supported formats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: FileSpreadsheet, label: 'Excel', desc: '.xlsx, .xls', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { icon: FileText, label: 'CSV', desc: '.csv', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: FileText, label: 'Texto', desc: '.txt, .ofx', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map(f => (
          <div key={f.label} className={`glass-card p-4 border ${f.bg} flex items-center gap-3`}>
            <f.icon size={20} className={f.color} />
            <div><p className="text-white text-sm font-medium">{f.label}</p><p className="text-dark-400 text-xs">{f.desc}</p></div>
          </div>
        ))}
      </div>

      {/* Dropzone */}
      {!result && (
        <div
          {...getRootProps()}
          className={`glass-card p-12 border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center ${
            isDragActive ? 'border-primary-500/60 bg-primary-500/5' : 'border-white/[0.08] hover:border-primary-500/40 hover:bg-primary-500/5'
          }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary-700/20 flex items-center justify-center mb-4"
          >
            <Upload size={28} className="text-primary-400" />
          </motion.div>
          <p className="text-white font-semibold text-lg mb-2">
            {isDragActive ? 'Solte o arquivo aqui!' : 'Arraste seu arquivo ou clique para selecionar'}
          </p>
          <p className="text-dark-400 text-sm">Suporte a Excel (.xlsx), CSV e extratos bancários</p>
          {acceptedFiles[0] && (
            <div className="mt-4 px-4 py-2 rounded-xl bg-primary-700/20 border border-primary-600/30 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-primary-400" />
              <span className="text-primary-300 text-sm">{acceptedFiles[0].name}</span>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {preview && !result && (
          <motion.div className="glass-card p-6" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <h3 className="text-white font-semibold mb-4">Pré-visualização</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total detectado', value: preview.summary?.total },
                { label: 'Receitas', value: preview.summary?.income },
                { label: 'Despesas', value: preview.summary?.expense },
                { label: 'Erros', value: preview.summary?.total - preview.summary?.processed },
              ].map(s => (
                <div key={s.label} className="bg-dark-800/40 rounded-xl p-3 text-center">
                  <p className="text-dark-400 text-xs mb-1">{s.label}</p>
                  <p className="text-white font-bold text-xl">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/[0.06]">
                  {['Descrição','Tipo','Valor','Data','Categoria'].map(h => <th key={h} className="text-dark-400 text-xs font-medium text-left px-3 py-2">{h}</th>)}
                </tr></thead>
                <tbody>
                  {preview.preview?.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-dark-700/20">
                      <td className="px-3 py-2 text-dark-200 max-w-[200px] truncate">{r.description}</td>
                      <td className="px-3 py-2">{r.type==='INCOME' ? <span className="badge-green">Receita</span> : <span className="badge-red">Despesa</span>}</td>
                      <td className="px-3 py-2 text-dark-200">{formatCurrency(r.amount)}</td>
                      <td className="px-3 py-2 text-dark-400 whitespace-nowrap">{new Date(r.dueDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-3 py-2 text-dark-400">{r.category || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleReset} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={handleImport} disabled={importMutation.isPending} className="btn-primary text-sm">
                {importMutation.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importando...</> : <><Upload size={15} />Confirmar Importação</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div className="glass-card p-6 border border-emerald-500/20" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center"><CheckCircle size={24} className="text-emerald-400" /></div>
              <div><h3 className="text-white font-semibold text-lg">Importação Concluída!</h3><p className="text-dark-400 text-sm">{result.message}</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Total lido', value: result.summary?.total, color: 'text-white' },
                { label: 'Importados', value: result.summary?.saved, color: 'text-emerald-400' },
                { label: 'Receitas', value: result.summary?.income, color: 'text-emerald-400' },
                { label: 'Despesas', value: result.summary?.expense, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-dark-800/40 rounded-xl p-3 text-center">
                  <p className="text-dark-400 text-xs mb-1">{s.label}</p>
                  <p className={`font-bold text-xl ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <button onClick={handleReset} className="btn-primary text-sm"><RefreshCw size={14} />Nova Importação</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
