import { useState } from 'react';
import { Eye, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface VerifyCardProps {
  onVerify: (nonce: string) => Promise<boolean | undefined>;
  isLoading: boolean;
}

export function VerifyCard({ onVerify, isLoading }: VerifyCardProps) {
  const [nonce, setNonce] = useState('');
  const [result, setResult] = useState<{ valid: boolean; checked: boolean } | null>(null);

  const handleVerify = async () => {
    if (!nonce.trim()) return;
    const valid = await onVerify(nonce.trim());
    setResult({ valid: !!valid, checked: true });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Eye className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-white">Verify Access</CardTitle>
            <CardDescription className="text-slate-400">Check if a session nonce is valid (simulates 3rd-party dApp)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          Any application can call this publicly to verify a user's session without knowing their identity, wallet address, or secret.
        </p>
        <div className="flex gap-2">
          <Input 
            placeholder="Paste session nonce..." 
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-sm"
          />
          <Button 
            onClick={handleVerify} 
            disabled={isLoading || !nonce.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>
        {result?.checked && (
          <Badge className={result.valid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}>
            {result.valid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            {result.valid ? 'Active Session — Access Granted' : 'Invalid or Expired Session'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
