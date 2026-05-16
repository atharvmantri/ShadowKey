import { useState } from 'react';
import type { DocumentFile } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, XCircle, Clock, Trash2, LogIn, Key, Copy, RefreshCw, FileText, User, Calendar, Globe, MapPin, CreditCard, Sparkles } from 'lucide-react';

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

const STATUS_CONFIG = {
  none: { label: 'Not Submitted', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Clock },
  pending: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
  verified: { label: 'Verified ✓', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected ✗', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: XCircle },
  deleted: { label: 'Deleted', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Trash2 },
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
    const nonce = await onLogin();
    if (nonce) setSessionInput(nonce);
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <motion.div
        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-6 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bg} ${config.border} border`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Identity Status</h2>
                <p className={`text-sm ${config.color}`}>{config.label}</p>
              </div>
            </div>
            {identityId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(identityId)}
                className="text-slate-400 hover:text-white gap-1.5 text-xs"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy ID'}
              </Button>
            )}
          </div>
        </div>

        {identityId && (
          <div className="p-6 space-y-4">
            {/* Identity details */}
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
                    className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                      <ItemIcon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="text-sm text-slate-200 font-mono text-xs">{item.value}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Documents */}
            {documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Uploaded Documents</p>
                <div className="space-y-1.5">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs text-slate-300">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.verified ? (
                          <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                        ) : doc.uploaded ? (
                          <span className="text-xs text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {verificationStatus === 'verified' && (
                <>
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    {isLoading ? 'Generating...' : 'Login (ZK Session)'}
                  </Button>
                  <Button
                    onClick={onDelete}
                    disabled={isLoading}
                    variant="outline"
                    className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Identity
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Session Verification */}
      {sessionNonce && (
        <motion.div
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Session Token</h3>
              <p className="text-sm text-slate-400">Use this token to verify your session on-chain</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg font-mono text-xs text-slate-300 truncate">
              {sessionNonce}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(sessionNonce)}
              className="border-slate-700 text-slate-400 hover:text-white shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300 block">Verify Session</label>
            <div className="flex gap-2">
              <Input
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="Paste session token..."
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-600 font-mono text-xs"
              />
              <Button
                onClick={() => onVerifySession(sessionInput)}
                disabled={isLoading || !sessionInput}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white gap-2 shrink-0"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {sessionValid === true && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Session verified successfully! Valid for 100,000 blocks.
              </motion.div>
            )}
            {sessionValid === false && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Session verification failed. Token may be expired or invalid.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Info panel */}
      <motion.div
        className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-500 space-y-1">
            <p><span className="text-indigo-400 font-medium">9 ZK Circuits</span> — submitIdentity, uploadDocument, approveIdentity, rejectIdentity, deleteIdentity, proveIdentityExists, proveField, login, verifySession</p>
            <p className="mt-1">Your data is stored as SHA256 commitments. Raw identity data never touches the ledger. <span className="text-emerald-400">Privacy by design.</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
