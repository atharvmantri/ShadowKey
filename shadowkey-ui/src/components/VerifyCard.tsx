import { useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const EXPLORER_BASE = 'https://explorer.preview.midnight.network';

interface VerifyCardProps {
  onVerify: (nonce: string) => Promise<boolean | undefined>;
  isLoading: boolean;
  isLive?: boolean;
}

export function VerifyCard({ onVerify, isLoading, isLive }: VerifyCardProps) {
  const [nonce, setNonce] = useState('');
  const [result, setResult] = useState<{ valid: boolean } | null>(null);

  const handleVerify = async () => {
    if (!nonce.trim()) return;
    const valid = await onVerify(nonce.trim());
    if (valid !== undefined) {
      setResult({ valid });
    }
  };

  return (
    <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Verify Session</h2>
            <p className="text-slate-400 text-sm">Confirm the proof on-chain</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-500 font-medium">Session Nonce</label>
          <Input
            value={nonce}
            onChange={e => setNonce(e.target.value)}
            placeholder="Paste the session nonce from the Prove step..."
            className="font-mono text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500"
            disabled={isLoading}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
          />
        </div>

        <Button 
          onClick={handleVerify}
          disabled={isLoading || !nonce.trim()}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold h-11"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
          {isLoading ? 'Verifying ZK Proof...' : 'Verify Session'}
        </Button>

        {result && (
          result.valid ? (
            <Badge className="w-full justify-center py-3 text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              ✓ Session Valid You Are Authenticated
            </Badge>
          ) : (
            <Badge variant="destructive" className="w-full justify-center py-3 text-sm">
              <XCircle className="w-5 h-5 mr-2" />
              ✗ Session Invalid or Expired
            </Badge>
          )
        )}
      </CardContent>
    </Card>
  );
}
