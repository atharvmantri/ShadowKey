import { useState } from 'react';
import type { DocumentFile } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, Clock, Trash2, LogIn, Key, Copy, FileText, User, Sparkles } from 'lucide-react';

interface DashboardProps {
  identityId: string | null;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected' | 'deleted';
  documents: DocumentFile[];
  sessionNonce: string | null;
  sessionValid: boolean | null;
  isLoading: boolean;
  onLogin: () => Promise<string | undefined>;
  onVerifySession: (nonce: string) => Promise<boolean | undefined>;
  onDelete: () => Promise<boolean>;
  onRestart: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; badge: 'default' | 'success' | 'warning' | 'error' | 'ghost'; icon: typeof Clock }> = {
  none: { label: 'Not Submitted', badge: 'ghost', icon: Clock },
  pending: { label: 'Pending Review', badge: 'warning', icon: Clock },
  verified: { label: 'Verified', badge: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', badge: 'error', icon: XCircle },
  deleted: { label: 'Deleted', badge: 'ghost', icon: Trash2 },
};

export function Dashboard({ identityId, verificationStatus, documents, sessionNonce, sessionValid, isLoading, onLogin, onVerifySession, onDelete, onRestart }: DashboardProps) {
  const [sessionInput, setSessionInput] = useState('');
  const [copied, setCopied] = useState(false);
  const config = STATUS_CONFIG[verificationStatus];
  const Icon = config.icon;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async () => {
    try {
      const nonce = await onLogin();
      if (nonce) setSessionInput(nonce);
    } catch { /* error handled by parent */ }
  };

  return (
    <div className="space-y-4">
      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-[-0.02em]">Identity Status</h2>
                <Badge variant={config.badge} className="mt-1">{config.label}</Badge>
              </div>
            </div>
            {identityId && (
              <Button variant="ghost" size="sm" onClick={() => handleCopy(identityId)} className="gap-1.5 text-xs">
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy ID'}
              </Button>
            )}
          </div>
        </div>

        {identityId && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: User, label: 'Identity ID', value: `${identityId.slice(0, 18)}...${identityId.slice(-6)}` },
                { icon: FileText, label: 'Documents', value: `${documents.filter(d => d.uploaded).length} uploaded` },
                { icon: CheckCircle2, label: 'Verified Docs', value: `${documents.filter(d => d.verified).length} verified` },
                { icon: Clock, label: 'Session', value: sessionNonce ? 'Active' : 'Inactive' },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <ItemIcon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7a9e]">{item.label}</p>
                      <p className="text-sm text-[#c4b5fd] font-mono text-xs">{item.value}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {documents.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-[#4f5b7a] uppercase tracking-[0.12em] mb-2">Uploaded Documents</p>
                <div className="space-y-1.5">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.01] border border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs text-[#c4b5fd]">{doc.name}</span>
                      </div>
                      {doc.verified ? (
                        <Badge variant="success" className="text-[10px]">Verified</Badge>
                      ) : doc.uploaded ? (
                        <Badge variant="warning" className="text-[10px]">Pending</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {verificationStatus === 'verified' && (
                <>
                  <Button onClick={handleLogin} disabled={isLoading} className="gap-2">
                    <LogIn className="w-4 h-4" />
                    {isLoading ? 'Generating...' : 'Login (ZK Session)'}
                  </Button>
                  <Button onClick={onDelete} disabled={isLoading} variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Identity
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {sessionNonce && (
        <motion.div
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.1)]">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white tracking-[-0.02em]">Session Token</h3>
              <p className="text-sm text-[#6b7a9e]">Verify your session on-chain</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] font-mono text-xs text-[#c4b5fd] truncate">
              {sessionNonce}
            </div>
            <Button variant="outline" size="sm" onClick={() => handleCopy(sessionNonce)} className="shrink-0">
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[#a5b4fc] block tracking-[-0.01em]">Verify Session</label>
            <div className="flex gap-2">
              <Input
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="Paste session token..."
                className="font-mono text-xs"
              />
              <Button
                onClick={() => onVerifySession(sessionInput)}
                disabled={isLoading || !sessionInput}
                className="gap-2 shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-[0_0_16px_rgba(52,211,153,0.2)] hover:shadow-[0_0_28px_rgba(52,211,153,0.4)]"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {sessionValid === true && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Session verified successfully! Valid for 100,000 blocks.
              </motion.div>
            )}
            {sessionValid === false && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Session verification failed. Token may be expired or invalid.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <motion.div
        className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs text-[#6b7a9e] space-y-1">
            <p><span className="text-indigo-400 font-medium">9 ZK Circuits</span> — submitIdentity, uploadDocument, approveIdentity, rejectIdentity, deleteIdentity, proveIdentityExists, proveField, login, verifySession</p>
            <p className="mt-1">Your data is stored as SHA256 commitments. Raw identity data never touches the ledger. <span className="text-emerald-400">Privacy by design.</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
