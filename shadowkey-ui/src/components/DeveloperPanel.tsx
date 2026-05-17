import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Code2, Copy, CheckCircle2, XCircle, Shield, BookOpen, Key, Zap, Plus } from 'lucide-react';

interface DeveloperPanelProps {
  sessionNonce: string | null;
  onVerifySession: (nonce: string) => Promise<boolean | undefined>;
}

function genApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEMO_CONTRACT = '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';

export function DeveloperPanel({ sessionNonce, onVerifySession }: DeveloperPanelProps) {
  const [step, setStep] = useState<'register' | 'ready'>('register');
  const [appName, setAppName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [testNonce, setTestNonce] = useState(sessionNonce || '');
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { if (sessionNonce) setTestNonce(sessionNonce); }, [sessionNonce]);

  const handleCopy = useCallback(async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleRegister = () => {
    const name = appName.trim() || 'My dApp';
    setApiKey(genApiKey());
    setStep('ready');
  };

  const handleReset = () => {
    setStep('register');
    setApiKey('');
    setCopied(null);
  };

  const snippet = `import { ShadowKeyContract } from '@shadowkey/contract';

const CONTRACT_ADDRESS = '${DEMO_CONTRACT}';
const API_KEY = '${apiKey || 'sk_live_' + 'x'.repeat(48)}';

export async function verifyUserSession(
  sessionNonce: string
): Promise<boolean> {
  const contract = await ShadowKeyContract.deploy(
    wallet,
    { address: CONTRACT_ADDRESS }
  );
  return contract.verifySession(sessionNonce);
}

app.post('/api/auth/verify', async (req, res) => {
  const { sessionToken } = req.body;
  const authorized = await verifyUserSession(sessionToken);
  res.json({ authorized, timestamp: Date.now() });
});`;

  return (
    <div className="space-y-3">
      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
              <Key className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-[-0.02em]">One-Click Integration</h2>
              <p className="text-xs text-[#6b7a9e]">Register your app and get credentials instantly</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {step === 'register' ? (
            <div className="space-y-3">
              <Input
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder="Your dApp name (e.g. DeFi Exchange)"
                className="text-sm"
              />
              <Button onClick={handleRegister} className="w-full gap-2">
                <Zap className="w-4 h-4" />
                Generate Credentials
              </Button>
              <p className="text-[10px] text-[#4f5b7a] text-center">No signup required. Credentials generated locally in your browser.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-[#6b7a9e] uppercase tracking-[0.1em] mb-1">Contract</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs text-emerald-400 truncate flex-1">{DEMO_CONTRACT.slice(0, 16)}...</code>
                    <button onClick={() => handleCopy('contract', DEMO_CONTRACT)} className="text-[#4f5b7a] hover:text-white shrink-0 cursor-pointer">
                      {copied === 'contract' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-[10px] text-[#6b7a9e] uppercase tracking-[0.1em] mb-1">API Key</p>
                  <div className="flex items-center gap-1">
                    <code className="text-xs text-amber-400 truncate flex-1">{apiKey.slice(0, 16)}...</code>
                    <button onClick={() => handleCopy('apikey', apiKey)} className="text-[#4f5b7a] hover:text-white shrink-0 cursor-pointer">
                      {copied === 'apikey' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.06]">
                  <span className="text-[10px] text-[#6b7a9e]">TypeScript — {appName || 'My dApp'}</span>
                  <button onClick={() => handleCopy('snippet', snippet)} className="text-[#4f5b7a] hover:text-white text-[10px] flex items-center gap-1 cursor-pointer">
                    {copied === 'snippet' ? <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <pre className="p-3 font-mono text-[10px] leading-relaxed overflow-x-auto text-[#c4b5fd]">{snippet}</pre>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="text-xs flex-1">
                  <Plus className="w-3 h-3" /> New App
                </Button>
                <Button size="sm" onClick={() => handleCopy('all', `Contract: ${DEMO_CONTRACT}\nAPI Key: ${apiKey}\n\n${snippet}`)} className="text-xs gap-1.5 flex-1">
                  {copied === 'all' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied === 'all' ? 'Copied!' : 'Copy All'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-xs font-semibold text-[#c4b5fd] flex items-center gap-2 tracking-[-0.01em]">
            <Zap className="w-3.5 h-3.5 text-violet-400" /> Test Your Integration
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={testNonce}
              onChange={(e) => { setTestNonce(e.target.value); setTestResult(null); }}
              placeholder={sessionNonce || 'Paste session token to test...'}
              className="font-mono text-xs"
            />
            <Button
              onClick={async () => {
                setTesting(true);
                setTestResult(null);
                try {
                  setTestResult((await onVerifySession(testNonce)) ?? null);
                } catch {
                  setTestResult(null);
                } finally {
                  setTesting(false);
                }
              }}
              disabled={testing || !testNonce}
              size="sm"
              className="shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-[0_0_16px_rgba(52,211,153,0.2)] hover:shadow-[0_0_28px_rgba(52,211,153,0.4)]"
            >
              {testing ? 'Verifying...' : 'Test'}
            </Button>
          </div>
          <AnimatePresence>
            {testResult === true && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid session — your app can grant access.
              </motion.div>
            )}
            {testResult === false && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5" /> Invalid nonce. Generate a new session first.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: Shield, label: 'No PII', desc: 'Boolean only' },
          { icon: Code2, label: '1 Function', desc: 'verifySession()' },
          { icon: BookOpen, label: 'Open Source', desc: 'MIT license' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-2 rounded-xl bg-white/[0.01] border border-white/[0.06] text-center">
              <Icon className="w-3 h-3 text-indigo-400 mx-auto mb-0.5" />
              <p className="text-[10px] font-semibold text-[#c4b5fd]">{item.label}</p>
              <p className="text-[9px] text-[#4f5b7a]">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
