import { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import type { IdentityFormData, AppStep } from './hooks/useContract';
import { WalletConnect } from './components/WalletConnect';
import { TerminalLog } from './components/TerminalLog';
import { IdentityForm } from './components/IdentityForm';
import { DocumentUpload } from './components/DocumentUpload';
import { Dashboard } from './components/Dashboard';
import { DeveloperPanel } from './components/DeveloperPanel';
import { LandingPage } from './components/LandingPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Code2, Info, X, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WIZARD_STEPS: { step: AppStep; num: number; label: string }[] = [
  { step: 'welcome', num: 1, label: 'Start' },
  { step: 'form', num: 2, label: 'Identity' },
  { step: 'documents', num: 3, label: 'Documents' },
  { step: 'verifying', num: 4, label: 'Verify' },
  { step: 'dashboard', num: 5, label: 'Dashboard' },
];

const slideFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

function App() {
  const { isInstalled, isConnected, address, balances, error: walletError, connect, connectDemo, disconnect } = useWallet();
  const {
    isLoading, isInitializing, error: contractError, isLive,
    currentStep, log, identityId, verificationStatus, documents,
    sessionNonce, sessionValid,
    submitIdentity, uploadDocument, requestVerification, deleteIdentity,
    login, verifySession, goToStep,
  } = useContract(address);
  const [showCode, setShowCode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'terminal' | 'developer'>('terminal');
  const [contractCode, setContractCode] = useState('');

  useEffect(() => {
    if (!showCode || contractCode) return;
    const abort = new AbortController();
    fetch('/midnight/shadowkey/shadowkey.compact', { signal: abort.signal })
      .then(r => r.text())
      .then(setContractCode)
      .catch(() => { if (!abort.signal.aborted) setContractCode('// Contract source not available'); });
    return () => abort.abort();
  }, [showCode, contractCode]);

  const navigateToDeveloper = useCallback(() => {
    goToStep('dashboard');
    setSidebarTab('developer');
  }, [goToStep]);

  useEffect(() => {
    if (currentStep !== 'dashboard') setSidebarTab('terminal');
  }, [currentStep]);

  useEffect(() => {
    if (window.location.hash === '#developer') {
      navigateToDeveloper();
    }
    const onHash = () => {
      if (window.location.hash === '#developer') navigateToDeveloper();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigateToDeveloper]);

  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      if (e.error && e.error.message && e.error.message.includes('Objects are not valid')) {
        setHasError(true);
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080816]">
        <div className="text-center relative">
          <motion.div
            className="absolute -inset-8 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-600/20 blur-3xl"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="relative w-14 h-14 mb-6 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]"
            animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Shield className="w-7 h-7 text-white" />
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <p className="text-[#a5b4fc] animate-pulse text-lg font-light tracking-[0.08em]">Initializing ShadowKey...</p>
          <p className="text-[#4f5b7a] text-sm mt-2">Loading zero-knowledge identity system</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#080816]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 mb-6 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#e4e4f0] mb-2 tracking-[-0.02em]">Something went wrong</h2>
          <p className="text-[#6b7a9e] text-sm mb-6">A render error occurred. Please refresh the page.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white text-sm font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] transition-all cursor-pointer">
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080816] text-[#e4e4f0] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-32 w-[30rem] h-[30rem] bg-violet-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-2/3 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <nav className="relative border-b border-white/[0.06] bg-white/[0.03] backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-[0_0_16px_rgba(99,102,241,0.3)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-[-0.03em]">ShadowKey</span>
            <Badge variant={isLive ? 'success' : 'warning'} className="text-[10px] ml-1">
              {isLive ? 'Live' : 'Demo'}
            </Badge>
            <Badge variant="default" className="text-[10px] hidden sm:inline-flex gap-1">
              <Zap className="w-2.5 h-2.5" /> ZK Identity Protocol
            </Badge>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button onClick={() => setShowInfo(true)} className="text-[#4f5b7a] hover:text-[#a5b4fc] transition-colors cursor-pointer" title="How it works">
              <Info className="w-4 h-4" />
            </button>
            <button onClick={() => setShowCode(true)} className="text-[#4f5b7a] hover:text-[#a5b4fc] transition-colors flex items-center gap-1 text-sm cursor-pointer" title="View source">
              <Code2 className="w-4 h-4" /> <span className="hidden sm:inline">Contract</span>
            </button>
            <button
              onClick={() => { window.location.hash = '#developer'; }}
              className="text-[#4f5b7a] hover:text-indigo-400 transition-colors flex items-center gap-1 text-sm cursor-pointer"
              title="Developer API"
            >
              <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden sm:inline">API</span>
            </button>
            <WalletConnect
              isInstalled={isInstalled}
              isConnected={isConnected}
              address={address}
              balances={balances}
              error={walletError}
              onConnect={connect}
              onConnectDemo={connectDemo}
              onDisconnect={disconnect}
            />
          </motion.div>
        </div>
      </nav>

      <div className={`relative z-10 ${currentStep === 'welcome' ? '' : 'max-w-7xl mx-auto px-4 py-6'}`}>
        {currentStep !== 'welcome' && (
          <motion.div
            className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-1 mb-6 max-w-3xl mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {WIZARD_STEPS.map((s, i) => {
              const stepIdx = WIZARD_STEPS.findIndex(ws => ws.step === currentStep);
              const isPast = stepIdx >= i;
              const isActive = s.step === currentStep;
              return (
                <button
                  key={s.step}
                  onClick={() => goToStep(s.step)}
                  disabled={!isPast && s.step !== 'welcome'}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.2)]'
                      : isPast
                      ? 'text-[#6b7a9e] hover:text-[#a5b4fc]'
                      : 'text-[#3d4a6b] cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white/20' : isPast ? 'bg-white/[0.04]' : 'bg-white/[0.02]'
                  }`}>{s.num}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                  {i < WIZARD_STEPS.length - 1 && <ChevronRight className="w-3 h-3 hidden sm:block opacity-40" />}
                </button>
              );
            })}
          </motion.div>
        )}

        <div className={currentStep === 'welcome' ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="wait">
              {currentStep === 'welcome' && (
                <motion.div key="welcome" {...slideFade}>
                  <LandingPage onStart={() => goToStep('form')} onDeveloper={navigateToDeveloper} />
                </motion.div>
              )}
              {currentStep === 'form' && (
                <motion.div key="form" {...slideFade}>
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
                <motion.div key="documents" {...slideFade}>
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
                <motion.div key="verifying" {...slideFade}>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                    <div className="text-center mb-6">
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.3)]"
                        animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="w-8 h-8 text-white" />
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"
                          animate={{ opacity: [0, 0.4, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.02em]">
                        ZK Proof Pipeline
                      </h2>
                      <p className="text-[#6b7a9e] text-sm mt-1">Generating zero-knowledge proofs. Watch the operations log for details.</p>
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
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
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
                            <p className="text-sm text-[#c4b5fd]">{step.label}</p>
                            <p className="text-xs text-[#6b7a9e]">{step.sub}</p>
                          </div>
                          <motion.div
                            className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden"
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
                <motion.div key="dashboard" {...slideFade}>
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

            <AnimatePresence>
              {contractError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2 backdrop-blur-xl"
                >
                  <X className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{contractError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            {currentStep === 'dashboard' ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex border-b border-white/[0.06]">
                  <button
                    onClick={() => setSidebarTab('terminal')}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      sidebarTab === 'terminal'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-[#6b7a9e] hover:text-[#a5b4fc]'
                    }`}
                  >
                    Terminal
                  </button>
                  <button
                    onClick={() => setSidebarTab('developer')}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      sidebarTab === 'developer'
                        ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-[#6b7a9e] hover:text-[#a5b4fc]'
                    }`}
                  >
                    <Code2 className="w-3 h-3 inline mr-1" /> Developer
                  </button>
                </div>
                <div className="p-3">
                  {sidebarTab === 'terminal' ? (
                    <TerminalLog log={log} />
                  ) : (
                    <DeveloperPanel sessionNonce={sessionNonce} onVerifySession={verifySession} />
                  )}
                </div>
              </div>
            ) : (
              <TerminalLog log={log} />
            )}
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
              className="rounded-2xl border border-white/[0.06] bg-[#0c0c1e] max-w-3xl w-full max-h-[85vh] overflow-auto shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06] sticky top-0 bg-[#0c0c1e] z-10">
                <h2 className="font-semibold text-white flex items-center gap-2 tracking-[-0.02em]">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  shadowkey.compact
                  <Badge variant="default" className="text-[10px] ml-2">9 Circuits</Badge>
                </h2>
                <button onClick={() => setShowCode(false)} className="text-[#6b7a9e] hover:text-white p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <pre className="p-4 text-sm font-mono text-[#c4b5fd] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                <code>{contractCode}</code>
              </pre>
              <div className="p-4 border-t border-white/[0.06] text-xs text-[#6b7a9e] space-y-1">
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
              className="rounded-2xl border border-white/[0.06] bg-[#0c0c1e] max-w-lg w-full p-6 shadow-[0_32px_64px_rgba(0,0,0,0.5)]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-white flex items-center gap-2 tracking-[-0.02em]">
                  <Info className="w-4 h-4 text-indigo-400" />
                  How ShadowKey Works
                </h2>
                <button onClick={() => setShowInfo(false)} className="text-[#6b7a9e] hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 text-sm text-[#c4b5fd]">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                  <h3 className="text-indigo-300 font-semibold mb-2 tracking-[-0.01em]">1. Identity Submission</h3>
                  <p className="text-[#6b7a9e]">Your 5 identity fields are individually hashed with SHA256. Only the field commitments are stored on-chain — raw data never leaves your browser.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                  <h3 className="text-violet-300 font-semibold mb-2 tracking-[-0.01em]">2. Document Verification</h3>
                  <p className="text-[#6b7a9e]">Upload documents (passport, license, ID card). SHA256 commitments are stored on the ledger. A verifier oracle checks authenticity via ZK circuits.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                  <h3 className="text-emerald-300 font-semibold mb-2 tracking-[-0.01em]">3. Privacy-Preserving Deletion</h3>
                  <p className="text-[#6b7a9e]">All identity commitments, documents, and status entries are erased from the ledger. A tombstone prevents re-registration while preserving your privacy.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
                  <h3 className="text-amber-300 font-semibold mb-2 tracking-[-0.01em]">4. Zero-Knowledge Login</h3>
                  <p className="text-[#6b7a9e]">Prove you're a verified identity without revealing which one. Generate session tokens with ZK proofs — all without exposing your personal data.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Analytics />
    </div>
  );
}

export default App;
