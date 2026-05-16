import { Shield, Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalletConnectProps {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
  balances: { shielded: string; unshielded: string; dust: string };
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ isInstalled, isConnected, address, error, balances, onConnect, onDisconnect }: WalletConnectProps) {
  if (!isInstalled) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm">
        <Shield className="w-4 h-4" />
        <span>Install Lace Wallet (Midnight Preview)</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button onClick={onConnect} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold gap-2">
          <Wallet className="w-4 h-4" />
          Connect Lace Wallet
        </Button>
        {error && <span className="text-xs text-rose-400">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-xs text-slate-400 font-mono">{address?.slice(0, 12)}...{address?.slice(-8)}</span>
        <div className="flex gap-2 text-xs text-slate-500">
          <span>⚡ {balances.shielded}</span>
          <span>◎ {balances.unshielded}</span>
          <span>◈ {balances.dust}</span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-slate-400 hover:text-white">
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
