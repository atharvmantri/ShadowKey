import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Database, Zap } from 'lucide-react';
import type { LogEntry } from '@/hooks/useContract';

interface TerminalLogProps {
  log: LogEntry[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  error: AlertCircle,
  data: Database,
  zk: Zap,
};

const COLORS: Record<string, string> = {
  info: 'text-blue-400',
  success: 'text-emerald-400',
  warn: 'text-amber-400',
  error: 'text-rose-400',
  data: 'text-purple-400',
  zk: 'text-cyan-400',
};

export function TerminalLog({ log }: TerminalLogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/50">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operations Log</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-600">live</span>
        </div>
      </div>
      <div ref={ref} className="p-3 space-y-1 max-h-80 overflow-y-auto font-mono text-xs">
        {log.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-600">
            <span>Run a flow to see detailed operations</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {log.map((entry, i) => {
              const Icon = ICONS[entry.level];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 py-0.5"
                >
                  <span className="text-slate-600 shrink-0 w-14">[{entry.time}]</span>
                  <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${COLORS[entry.level]}`} />
                  <span className={COLORS[entry.level]}>{entry.message}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
