import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Lock, Mail, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      await login(email, password);
      toast.success('Bem-vindo ao H MED!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Credenciais inválidas');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 50%, #0f1f4a 0%, #080c16 60%)' }}
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <motion.div
          className="glass-card p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}
              animate={{ boxShadow: ['0 0 20px rgba(59,130,246,0.3)', '0 0 40px rgba(59,130,246,0.5)', '0 0 20px rgba(59,130,246,0.3)'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              HM
            </motion.div>
            <h1 className="text-2xl font-bold text-white">H MED</h1>
            <p className="text-dark-400 text-sm mt-1">Sistema de Gestão Empresarial</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-dark-300 text-sm font-medium mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-dark-300 text-sm font-medium mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar no Sistema
                </>
              )}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-primary-900/20 border border-primary-700/30 rounded-xl">
            <div className="flex items-center gap-2 text-primary-300 text-xs font-semibold mb-2">
              <Shield size={13} />
              Credenciais de acesso:
            </div>
            <div className="space-y-1 text-xs text-dark-400">
              <p><span className="text-dark-300">Admin:</span> admin@hmed.com / Admin@2024</p>
              <p><span className="text-dark-300">Demo:</span> demo@hmed.com / Demo@2024</p>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-dark-600 text-xs mt-6">
          © 2024 H MED DISTRIBUIDORA · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
