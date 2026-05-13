import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, Sun, Moon, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Financeiro',
  '/sales': 'Vendas',
  '/clients': 'Clientes',
  '/products': 'Produtos',
  '/reports': 'Relatórios',
  '/import': 'Importar Dados',
  '/users': 'Usuários',
  '/settings': 'Configurações',
};

interface NavbarProps {
  onMobileMenuToggle: () => void;
  sidebarOpen: boolean;
}

export default function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const currentRoute = routeNames[location.pathname] || 'H MED';

  return (
    <header className="h-16 flex items-center px-4 md:px-6 border-b border-white/[0.06] bg-dark-900/80 backdrop-blur-md flex-shrink-0 z-30 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/60 transition-all"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-white font-semibold text-lg hidden md:block">{currentRoute}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <AnimatePresence>
            {searchOpen ? (
              <motion.input
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="input-field text-sm py-2"
                placeholder="Buscar..."
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/60 transition-all"
              >
                <Search size={18} />
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/60 transition-all"
        >
          {darkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700/60 transition-all">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-dark-700/40 hover:bg-dark-700/80 border border-white/[0.06] transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-primary-700/40 flex items-center justify-center text-primary-300 font-semibold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-dark-200 text-sm font-medium hidden sm:block max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} className="text-dark-400" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 glass-card overflow-hidden"
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-dark-400 text-xs">{user?.email}</p>
                </div>
                <div className="p-2">
                  {[
                    { icon: User, label: 'Perfil', action: () => {} },
                    { icon: Settings, label: 'Configurações', action: () => {} },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700/60 transition-all text-sm"
                    >
                      <item.icon size={15} />
                      {item.label}
                    </button>
                  ))}
                  <div className="h-px bg-white/[0.06] my-1" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
