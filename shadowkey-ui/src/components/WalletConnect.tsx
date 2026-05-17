import { Shield, Wallet, LogOut, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface WalletConnectProps {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
  balances: { shielded: string; unshielded: string; dust: string };
  onConnect: () => void;
  onConnectDemo: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ isInstalled, isConnected, address, error, balances, onConnect, onConnectDemo, onDisconnect }: WalletConnectProps) {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={onConnect} size="sm" className="gap-1.5 text-xs h-8">
          <Wallet className="w-3.5 h-3.5" />
          Connect Lace
        </Button>
        <Button onClick={onConnectDemo} size="sm" variant="outline" className={`gap-1.5 text-xs h-8 ${isInstalled ? 'hidden sm:flex' : ''}`}>
          <Beaker className="w-3.5 h-3.5" />
          Demo
        </Button>
        {error && <span className="text-xs text-rose-400 max-w-[140px] text-right leading-tight">{error}</span>}
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span className="text-xs font-mono text-[#c4b5fd]">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
        </div>
        <div className="flex gap-2 text-[10px] text-[#6b7a9e]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
            {balances.shielded} shielded
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />
            {balances.unshielded}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-[#6b7a9e] hover:text-white h-8 w-8 p-0">
        <LogOut className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
}
