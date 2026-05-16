import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StepInfo } from '@/hooks/useContract';

interface StepFlowProps {
  steps: StepInfo[];
}

export function StepFlow({ steps }: StepFlowProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ZK Proof Progress</h3>
      {steps.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-slate-600 text-xs">
          <p>Run a flow to see ZK proof steps</p>
        </div>
      ) : (
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-start gap-3 py-2">
              <div className="flex flex-col items-center gap-0.5">
                {step.status === 'done' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                ) : step.status === 'active' ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                ) : step.status === 'error' ? (
                  <div className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/50" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-700" />
                )}
                {i < steps.length - 1 && (
                  <div className={`w-px h-6 ${step.status === 'done' ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${step.status === 'done' ? 'text-slate-200' : step.status === 'active' ? 'text-indigo-300' : 'text-slate-600'}`}>
                  {step.label}
                </span>
                {step.status === 'active' && (
                  <motion.div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: step.duration / 1000, ease: 'linear' }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
