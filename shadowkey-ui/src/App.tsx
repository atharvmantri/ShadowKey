import { useState, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import type { IdentityFormData, AppStep } from './hooks/useContract';
import { WalletConnect } from './components/WalletConnect';
import { TerminalLog } from './components/TerminalLog';
import { IdentityForm } from './components/IdentityForm';
import { DocumentUpload } from './components/DocumentUpload';
import { Dashboard } from './components/Dashboard';
import { Shield, Zap, Code2, Info, X, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const WIZARD_STEPS: { step: AppStep; num: number; label: string }[] = [
  { step: 'welcome', num: 1, label: 'Start' },
  { step: 'form', num: 2, label: 'Identity' },
  { step: 'documents', num: 3, label: 'Documents' },
  { step: 'verifying', num: 4, label: 'Verify' },
  { step: 'dashboard', num: 5, label: 'Dashboard' },
];

function App() {
  const { isInstalled, isConnected, address, balances, error: walletError, connect, disconnect } = useWallet();
  const {
    isLoading, isInitializing, error: contractError, isLive,
    currentStep, log, identityId, verificationStatus, documents,
    sessionNonce, sessionValid,
    submitIdentity, uploadDocument, requestVerification, deleteIdentity,
    login, verifySession, goToStep,
  } = useContract(address);
  const [showCode, setShowCode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [contractCode, setContractCode] = useState('');

  useEffect(() => {
    if (showCode && !contractCode) {
      fetch('/midnight/shadowkey/shadowkey.compact')
        .then(r => r.text())
        .then(setContractCode)
        .catch(() => setContractCode('// Contract source not available in dev mode'));
    }
  }, [showCode, contractCode]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="w-14 h-14 mb-6 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25"
            animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Shield className="w-7 h-7 text-white" />
          </motion.div>
          <p className="text-slate-400 animate-pulse text-lg font-light tracking-wide">Initializing ShadowKey...</p>
          <p className="text-slate-600 text-sm mt-2">Loading zero-knowledge identity system</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-32 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-2/3 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ShadowKey</span>
            <Badge variant="outline" className={`text-xs ml-2 ${isLive ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'}`}>
              {isLive ? 'Live' : 'Demo'}
            </Badge>
            <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400 hidden sm:inline-flex gap-1">
              <Zap className="w-3 h-3" /> ZK Identity Protocol
            </Badge>
          </motion.div>
          <motion.div className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button onClick={() => setShowInfo(true)} className="text-slate-500 hover:text-slate-300 transition-colors" title="How it works">
              <Info className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCode(true)} className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 text-sm" title="View source">
              <Code2 className="w-4 h-4" /> <span className="hidden sm:inline">Contract</span>
            </button>
            <WalletConnect
              isInstalled={isInstalled}
              isConnected={isConnected}
              address={address}
              balances={balances}
              error={walletError}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          </motion.div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-4 py-6 z-10">
        {/* Step Wizard Indicator */}
        {currentStep !== 'welcome' && (
          <motion.div
            className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-1 mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {WIZARD_STEPS.map((s, i) => {
              const stepIdx = WIZARD_STEPS.findIndex(ws => ws.step === currentStep);
              const isActive = s.step === currentStep;
              const isPast = stepIdx >= i;
              return (
                <button
                  key={s.step}
                  onClick={() => goToStep(s.step)}
                  disabled={!isPast && s.step !== 'welcome'}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                      : isPast
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-700 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white/20' : isPast ? 'bg-slate-800' : 'bg-slate-900'
                  }`}>{s.num}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                  {i < WIZARD_STEPS.length - 1 && <ChevronRight className="w-3 h-3 hidden sm:block opacity-40" />}
                </button>
              );
            })}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {currentStep === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Hero */}
                  <div className="text-center py-6">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Shield className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      ShadowKey
                    </h1>
                    <p className="text-xl text-slate-300 mb-2 font-light">Authentication Without Exposure</p>
                    <p className="text-slate-500 max-w-xl mx-auto mb-8">
                      Prove your identity with zero-knowledge proofs on Midnight Network.
                      No passwords. No data leaks. Just pure cryptography.
                    </p>
                    <div className="flex items-center justify-center gap-6 mb-10 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Client-side proofs</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-indigo-400" /> No trusted setup</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span>Groth16 + SHA256</span>
                    </div>
                    <motion.div
                      className="flex flex-col items-center gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        onClick={() => goToStep('form')}
                        size="lg"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-xl shadow-xl shadow-indigo-500/20 group"
                      >
                        Start Identity Verification
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <p className="text-xs text-slate-600">No wallet required — runs in demo mode</p>
                    </motion.div>
                  </div>

                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    {[
                      { title: '1. Fill Identity Form', desc: '5 identity fields → SHA256 hashed → committed to ledger', icon: Sparkles, color: 'indigo' },
                      { title: '2. Upload Documents', desc: 'Drag & drop docs → document commitments stored on-chain', icon: Zap, color: 'purple' },
                      { title: '3. Auto-Verify & Login', desc: 'ZK proofs verified → session token minted → verify on-chain', icon: Shield, color: 'emerald' },
                    ].map((feature, i) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={feature.title}
                          className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-${feature.color}-500/10 border border-${feature.color}-500/20 flex items-center justify-center mb-2`}>
                            <Icon className={`w-4 h-4 text-${feature.color}-400`} />
                          </div>
                          <h3 className="font-semibold text-sm text-slate-200">{feature.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {currentStep === 'form' && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <IdentityForm
                    isLoading={isLoading}
                    onSubmit={async (data: IdentityFormData) => {
                      const ok = await submitIdentity(data);
                      if (ok) goToStep('documents');
                    }}
                    onBack={() => goToStep('welcome')}
                  />
                </motion.div>
              )}

              {currentStep === 'documents' && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <DocumentUpload
                    isLoading={isLoading}
                    documents={documents}
                    onUpload={uploadDocument}
                    onContinue={async () => {
                      goToStep('verifying');
                      await requestVerification();
                    }}
                    onBack={() => goToStep('form')}
                  />
                </motion.div>
              )}

              {currentStep === 'verifying' && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                    <div className="text-center mb-6">
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25"
                        animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="w-8 h-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        ZK Proof Pipeline
                      </h2>
                      <p className="text-slate-500 text-sm mt-1">Generating zero-knowledge proofs. Watch the operations log for details.</p>
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                      {[
                        { label: 'Document hash verification', sub: 'SHA256 commitment check' },
                        { label: 'Identity field matching', sub: 'Field × 5 hash comparison' },
                        { label: 'Circuit: approveIdentity (k=13)', sub: '7168 rows, 234 constraints' },
                        { label: 'Groth16 proof generation', sub: 'Multi-scalar multiplication' },
                        { label: 'On-chain submission', sub: 'ledger.insert(identityStatus)' },
                      ].map((step, i) => (
                        <motion.div
                          key={step.label}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.3 }}
                        >
                          <motion.div
                            className="w-5 h-5 rounded-full border-2 border-indigo-400/50 flex items-center justify-center shrink-0"
                            animate={{ borderColor: ['rgba(99,102,241,0.5)', 'rgba(52,211,153,0.8)', 'rgba(99,102,241,0.5)'] }}
                            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                          >
                            <motion.div
                              className="w-2 h-2 rounded-full bg-indigo-400"
                              animate={{ scale: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                            />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200">{step.label}</p>
                            <p className="text-xs text-slate-500">{step.sub}</p>
                          </div>
                          <motion.div
                            className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.3 + 0.2 }}
                          >
                            <motion.div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                              animate={{ width: ['0%', '100%'] }}
                              transition={{ duration: 2, delay: i * 0.3 + 0.3, ease: 'easeInOut' }}
                            />
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Dashboard
                    identityId={identityId}
                    verificationStatus={verificationStatus}
                    documents={documents}
                    sessionNonce={sessionNonce}
                    sessionValid={sessionValid}
                    isLoading={isLoading}
                    onLogin={login}
                    onVerifySession={verifySession}
                    onDelete={deleteIdentity}
                    onRestart={() => goToStep('welcome')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {contractError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-start gap-2"
                >
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{contractError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Terminal + Steps */}
          <div className="space-y-4">
            <TerminalLog log={log} />
          </div>
        </div>
      </div>

      {/* Code Modal */}
      <AnimatePresence>
        {showCode && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCode(false)}
          >
            <motion.div
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  shadowkey.compact
                  <Badge variant="outline" className="text-xs border-indigo-500/30 text-indigo-400 ml-2">9 Circuits</Badge>
                </h2>
                <button onClick={() => setShowCode(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <pre className="p-4 text-sm font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                <code>{contractCode}</code>
              </pre>
              <div className="p-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
                <p>Compiled against Compact 0.31.0 — 9 circuits with identity commitments (submitIdentity), document verification (uploadDocument, approveIdentity, rejectIdentity), ZK field proofs (proveField, proveIdentityExists), and privacy-preserving auto-deletion (deleteIdentity).</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  How ShadowKey Works
                </h2>
                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-indigo-300 font-semibold mb-2">1. Identity Submission</h3>
                  <p className="text-slate-400">Your 5 identity fields (name, DOB, nationality, address, ID number) are individually hashed with SHA256. Only the field commitments are stored on-chain — raw data never leaves your browser.</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-purple-300 font-semibold mb-2">2. Document Verification</h3>
                  <p className="text-slate-400">Upload documents (passport, license, ID card). SHA256 commitments are stored on the ledger. A verifier oracle checks authenticity and approves/rejects via ZK circuits.</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-emerald-300 font-semibold mb-2">3. Privacy-Preserving Deletion</h3>
                  <p className="text-slate-400">When you choose to delete, all identity commitments, documents, and status entries are erased from the ledger. A tombstone prevents re-registration while preserving your privacy.</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <h3 className="text-amber-300 font-semibold mb-2">4. Zero-Knowledge Login</h3>
                  <p className="text-slate-400">Prove you're a verified identity without revealing which one. Generate session tokens with ZK proofs. Verify sessions on-chain — all without exposing your personal data.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
