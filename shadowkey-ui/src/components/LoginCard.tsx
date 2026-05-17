import { useState } from 'react';
import { Key, Loader2, CheckCircle2, Copy, ExternalLink, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const EXPLORER_BASE = 'https://explorer.preview.midnight.network';

interface LoginCardProps {
  onLogin: (username: string) => Promise<{ nonce: string; txHash: string } | undefined>;
  isLoading: boolean;
  isLive?: boolean;
}

export function LoginCard({ onLogin, isLoading, isLive }: LoginCardProps) {
  const [username, setUsername] = useState('');
  const [nonce, setNonce] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) return;
    const result = await onLogin(username.trim());
    if (result) {
      setNonce(result.nonce);
      setTxHash(result.txHash);
    }
  };

  const copyNonce = () => {
    if (nonce) {
      navigator.clipboard.writeText(nonce);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 shadow-lg shadow-purple-500/10">
            <Key className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Prove Identity</h2>
            <p className="text-slate-400 text-sm">Generate a ZK proof and mint a session nonce</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-medium">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your registered username..."
              className="pl-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-purple-500"
              disabled={isLoading}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>

        <Button 
          onClick={handleLogin}
          disabled={isLoading || !username.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold h-11"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
          {isLoading ? 'Generating Groth16 Proof...' : 'Prove Identity & Mint Nonce'}
        </Button>

        {nonce && (
          <div className="space-y-3">
            <Badge className="w-full justify-center py-2 text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              ZK Proof Verified Session Active
            </Badge>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Session Nonce</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-300 truncate">
                  {nonce}
                </code>
                <Button variant="ghost" size="icon" onClick={copyNonce} className="text-slate-400 hover:text-white shrink-0 h-10 w-10">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copied && <p className="text-xs text-emerald-400">Copied!</p>}
            </div>
            {txHash && isLive && (
              <a href={`${EXPLORER_BASE}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline">
                <ExternalLink className="w-3 h-3" />
                View on Explorer
              </a>
            )}
            <p className="text-xs text-slate-500 text-center">Copy the nonce above, then switch to the Verify tab to check it.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
