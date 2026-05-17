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
  info: 'text-[#60a5fa]',
  success: 'text-[#34d399]',
  warn: 'text-[#fbbf24]',
  error: 'text-[#fb7185]',
  data: 'text-[#a78bfa]',
  zk: 'text-[#22d3ee]',
};

export function TerminalLog({ log }: TerminalLogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [log]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <h3 className="text-[10px] font-semibold text-[#6b7a9e] uppercase tracking-[0.15em]">Operations Log</h3>
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[10px] text-[#4f5b7a] tracking-wide">live</span>
        </div>
      </div>
      <div ref={ref} className="p-3 space-y-1 max-h-80 overflow-y-auto font-mono text-xs">
        {log.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[#4f5b7a]">
            <span className="tracking-wide">Run a flow to see detailed operations</span>
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
                  <span className="text-[#3d4a6b] shrink-0 w-14 tabular-nums">[{entry.time}]</span>
                  <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${COLORS[entry.level]}`} />
                  <span className={`${COLORS[entry.level]} leading-snug`}>{entry.message}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
