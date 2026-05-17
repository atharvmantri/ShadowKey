import { Shield, Wallet, LogOut, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <Button onClick={onConnect} size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white gap-1.5 text-xs h-8">
          <Wallet className="w-3.5 h-3.5" />
          Connect Lace
        </Button>
        <Button onClick={onConnectDemo} size="sm" variant="outline" className={`border-slate-700 text-slate-400 hover:text-white gap-1.5 text-xs h-8 ${isInstalled ? 'hidden sm:flex' : ''}`}>
          <Beaker className="w-3.5 h-3.5" />
          Demo
        </Button>
        {error && <span className="text-xs text-rose-400 max-w-[140px] text-right leading-tight">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-mono text-slate-200">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
        </div>
        <div className="flex gap-2 text-[10px] text-slate-500">
          <span>shielded {balances.shielded}</span>
          <span>unshielded {balances.unshielded}</span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-slate-500 hover:text-white h-8 w-8 p-0">
        <LogOut className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}