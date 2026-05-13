import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0f1f4a 0%, #080c16 70%)',
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Logo container */}
      <motion.div
        className="relative flex flex-col items-center gap-6 z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo circle */}
        <motion.div
          className="relative"
          animate={{ boxShadow: ['0 0 30px rgba(59,130,246,0.4)', '0 0 60px rgba(59,130,246,0.7)', '0 0 30px rgba(59,130,246,0.4)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-bold text-3xl"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}
          >
            HM
          </div>
          <div className="absolute -inset-1 rounded-3xl opacity-40"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', filter: 'blur(8px)', zIndex: -1 }} />
        </motion.div>

        {/* Company name */}
        <div className="text-center">
          <motion.h1
            className="text-3xl font-bold text-white tracking-wide"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            H MED
          </motion.h1>
          <motion.p
            className="text-primary-300 text-sm font-medium tracking-[0.3em] mt-1 uppercase"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Distribuidora
          </motion.p>
        </div>

        {/* Loading bar */}
        <motion.div
          className="w-48 h-1 bg-dark-800 rounded-full overflow-hidden mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #1e40af, #3b82f6, #1e40af)' }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
          />
        </motion.div>

        {/* Loading text */}
        <motion.p
          className="text-dark-400 text-xs tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 0.8, duration: 1.5, repeat: Infinity }}
        >
          Carregando sistema...
        </motion.p>
      </motion.div>

      {/* Version */}
      <motion.div
        className="absolute bottom-8 text-dark-600 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        v1.0.0 · Sistema de Gestão Empresarial
      </motion.div>
    </motion.div>
  );
}
