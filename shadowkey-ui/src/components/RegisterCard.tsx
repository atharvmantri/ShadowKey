import { useState } from 'react';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RegisterCardProps {
  onRegister: () => Promise<string | undefined>;
  isLoading: boolean;
}

export function RegisterCard({ onRegister, isLoading }: RegisterCardProps) {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRegister = async () => {
    const txHash = await onRegister();
    if (txHash) {
      setResult({ success: true, message: `Registered! Tx: ${txHash.slice(0, 16)}...` });
    } else {
      setResult({ success: false, message: 'Registration failed. You may already be registered.' });
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-white">Register Identity</CardTitle>
            <CardDescription className="text-slate-400">Generate a secret and register your ZK identity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          Your secret is generated locally and never leaves your browser. Only a zero-knowledge proof is submitted to Midnight.
        </p>
        <Button 
          onClick={handleRegister} 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
          {isLoading ? 'Generating ZK Proof...' : 'Generate Secret & Register'}
        </Button>
        {result && (
          <Badge variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}>
            {result.success ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
            {result.message}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
