import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adicionar token
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('hmed-auth');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Erro de conexão com o servidor';

    if (error.response?.status === 401) {
      localStorage.removeItem('hmed-auth');
      window.location.href = '/login';
      toast.error('Sessão expirada. Faça login novamente.');
    } else if (error.response?.status === 403) {
      toast.error('Sem permissão para esta ação');
    } else if (error.response?.status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente.');
    } else if (error.response?.status === 429) {
      toast.error('Muitas requisições. Aguarde um momento.');
    }

    return Promise.reject(error);
  }
);

export default api;
