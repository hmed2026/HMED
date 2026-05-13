import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, ShoppingCart, Users, Package,
  BarChart3, Upload, Settings, UserCog, ChevronLeft, ChevronRight,
  Activity, LogOut, Building2, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

const navItems = [
  {
    section: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { to: '/transactions', icon: Activity, label: 'Financeiro' },
      { to: '/sales', icon: TrendingUp, label: 'Vendas' },
    ],
  },
  {
    section: 'Cadastros',
    items: [
      { to: '/clients', icon: Users, label: 'Clientes' },
      { to: '/products', icon: Package, label: 'Produtos' },
    ],
  },
  {
    section: 'Inteligência',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Relatórios' },
      { to: '/import', icon: Upload, label: 'Importar Dados' },
    ],
  },
  {
    section: 'Administração',
    items: [
      { to: '/users', icon: UserCog, label: 'Usuários' },
      { to: '/settings', icon: Settings, label: 'Configurações' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, mobileOpen, onClose, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx('flex items-center h-16 px-4 border-b border-white/[0.06] flex-shrink-0', isOpen ? 'gap-3' : 'justify-center')}>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}
        >
          HM
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0"
            >
              <p className="text-white font-semibold text-sm truncate">H MED</p>
              <p className="text-dark-400 text-xs truncate">Distribuidora</p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile close button */}
        <button onClick={onClose} className="lg:hidden ml-auto text-dark-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
        {navItems.map((section) => (
          <div key={section.section} className="mb-4">
            <AnimatePresence>
              {isOpen && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-dark-500 text-[10px] font-semibold uppercase tracking-wider px-3 mb-2"
                >
                  {section.section}
                </motion.p>
              )}
            </AnimatePresence>
            {section.items.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to) && item.to !== '/';

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={clsx(
                    'sidebar-item',
                    isActive && 'active',
                    !isOpen && 'justify-center px-2'
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <item.icon
                    size={18}
                    className={clsx(
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-primary-300' : 'text-dark-400 group-hover:text-dark-200'
                    )}
                  />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-400"
                      layoutId="activeIndicator"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
        <div className={clsx('flex items-center gap-3 p-2 rounded-xl', isOpen && 'bg-dark-800/40')}>
          <div className="w-8 h-8 rounded-xl bg-primary-700/40 flex items-center justify-center text-primary-300 font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-dark-100 text-sm font-medium truncate">{user?.name}</p>
                <p className="text-dark-500 text-xs truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {isOpen && (
            <button
              onClick={logout}
              className="text-dark-500 hover:text-red-400 transition-colors p-1"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        {!isOpen && (
          <button
            onClick={logout}
            className="w-full mt-2 flex justify-center text-dark-500 hover:text-red-400 transition-colors p-2"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: isOpen ? 240 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-full bg-dark-900/95 border-r border-white/[0.06] flex-shrink-0 relative overflow-hidden"
      >
        {sidebarContent}
        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-dark-700 border border-white/[0.08] rounded-full flex items-center justify-center text-dark-400 hover:text-white hover:border-primary-500/50 transition-all z-10 shadow-card"
        >
          {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden bg-dark-900 border-r border-white/[0.06]"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
