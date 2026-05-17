import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080816]">
      <div className="text-center relative">
        <motion.div
          className="absolute -inset-8 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-600/20 blur-3xl"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="relative w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          animate={{ rotate: [0, 360], scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Shield className="w-8 h-8 text-white" />
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <motion.p
          className="text-[#a5b4fc] text-lg font-light tracking-[0.08em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          ShadowKey
        </motion.p>
        <motion.p
          className="text-[#4f5b7a] text-sm mt-2 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Loading zero-knowledge identity system
        </motion.p>
      </div>
    </div>
  );
};
