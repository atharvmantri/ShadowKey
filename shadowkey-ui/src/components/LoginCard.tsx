import { useState } from 'react';
import { Key, Loader2, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LoginCardProps {
  onLogin: () => Promise<{ nonce: string; txHash: string } | undefined>;
  isLoading: boolean;
}

export function LoginCard({ onLogin, isLoading }: LoginCardProps) {
  const [nonce, setNonce] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    const result = await onLogin();
    if (result) {
      setNonce(result.nonce);
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
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Key className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-white">Prove Identity</CardTitle>
            <CardDescription className="text-slate-400">Generate a session nonce without revealing your secret</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          This generates a zero-knowledge proof that you are a registered user. The contract verifies your membership without learning your identity.
        </p>
        <Button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
          {isLoading ? 'Generating ZK Proof...' : 'Prove Identity & Mint Nonce'}
        </Button>
        {nonce && (
          <div className="space-y-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Proof Valid — Session Active
            </Badge>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-300 truncate">
                {nonce}
              </code>
              <Button variant="ghost" size="sm" onClick={copyNonce} className="text-slate-400 hover:text-white">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">Copy this nonce to verify in the next tab.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
