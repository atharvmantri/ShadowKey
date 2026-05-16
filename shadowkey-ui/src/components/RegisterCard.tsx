import { useState } from 'react';
import { Shield, Loader2, CheckCircle2, ExternalLink, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const EXPLORER_BASE = 'https://explorer.preview.midnight.network';

interface RegisterCardProps {
  onRegister: (username: string) => Promise<string | undefined>;
  isLoading: boolean;
  isLive?: boolean;
}

export function RegisterCard({ onRegister, isLoading, isLive }: RegisterCardProps) {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null);

  const handleRegister = async () => {
    if (!username.trim()) return;
    const txHash = await onRegister(username.trim());
    if (txHash) {
      setResult({ success: true, message: `Registered as "${username}"`, txHash });
    } else {
      setResult({ success: false, message: 'Registration failed' });
    }
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Register Identity</h2>
            <p className="text-slate-400 text-sm">Create a private ZK credential on Midnight</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-medium">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter a username..."
              className="pl-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500"
              disabled={isLoading}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
            />
          </div>
        </div>

        <Button 
          onClick={handleRegister}
          disabled={isLoading || !username.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold h-11"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
          {isLoading ? 'Generating ZK Proof...' : 'Generate Secret & Register'}
        </Button>

        {result && (
          <div className="space-y-2">
            <Badge variant={result.success ? 'default' : 'destructive'} className={`w-full justify-center py-2 text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}`}>
              {result.success ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : null}
              {result.message}
            </Badge>
            {result.success && result.txHash && isLive && (
              <a href={`${EXPLORER_BASE}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline">
                <ExternalLink className="w-3 h-3" />
                View on Explorer
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
