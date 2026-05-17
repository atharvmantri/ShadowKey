import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion, useScroll, useTransform, useSpring, useMotionValue,
  useInView, animate, AnimatePresence,
} from 'framer-motion';
import {
  Shield, Zap, Code2, Info, ArrowRight, Sparkles, CheckCircle2,
  Cpu, Lock, EyeOff, Trash2, Wallet, Layers, Github, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Particle ───
function random(a: number, b: number) { return Math.random() * (b - a) + a; }

const PARTICLE_COUNT = 40;
function Particle({ i }: { i: number }) {
  const size = random(2, 5);
  const anim = [`particle-float`, `particle-float-2`, `particle-float-3`][i % 3];
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size,
        left: `${random(0, 100)}%`, top: `${random(0, 100)}%`,
        background: `radial-gradient(circle, rgba(99,102,241,0.6), rgba(168,85,247,0.2))`,
        animation: `${anim} ${random(8, 20)}s ease-in-out ${random(0, 5)}s infinite`,
        boxShadow: `0 0 ${size * 2}px rgba(99,102,241,0.3)`,
      }}
    />
  );
}

// ─── 3D Tilt Card ───
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(mx, [0, 1], [-5, 5]), { stiffness: 150, damping: 15 });
  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
      style={{ rotateX: rx, rotateY: ry, perspective: 1000 }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Magnetic Button ───
function MagnetBtn({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 15 });
  const sy = useSpring(y, { stiffness: 300, damping: 15 });
  return (
    <motion.div ref={ref} onMouseMove={(e) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      x.set((e.clientX - r.left - r.width / 2) * 0.15);
      y.set((e.clientY - r.top - r.height / 2) * 0.15);
    }} onMouseLeave={() => { animate(x, 0); animate(y, 0); }}
      style={{ x: sx, y: sy }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Section Wrapper (scroll reveal) ───
function Section({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut', delay }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Animated Counter ───
function AnimatedNumber({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState('0');
  const inView = useInView(ref, { once: true });
  const val = useMotionValue(0);
  useEffect(() => {
    const unsub = val.on('change', (v) => setDisplay(`${Math.round(v)}${suffix}`));
    return unsub;
  }, [val, suffix]);
  useEffect(() => {
    if (inView) animate(val, to, { duration: 2, ease: 'easeOut' });
  }, [inView, val, to]);
  return <span ref={ref}>{display}</span>;
}

// ─── Typewriter ───
const WORDS = ['identity verification', 'passwordless auth', 'privacy layer', 'KYC alternative', 'ZK authentication'];
function Typewriter() {
  const [text, setText] = useState(''); const [idx, setIdx] = useState(0); const [del, setDel] = useState(false); const [pause, setPause] = useState(false);
  useEffect(() => {
    if (pause) { const t = setTimeout(() => { setPause(false); setDel(true); }, 2000); return () => clearTimeout(t); }
    const speed = del ? 40 : 80;
    const t = setTimeout(() => {
      if (!del) {
        if (text.length < WORDS[idx].length) setText(WORDS[idx].slice(0, text.length + 1));
        else setPause(true);
      } else {
        if (text.length > 0) setText(text.slice(0, -1));
        else { setDel(false); setIdx((p) => (p + 1) % WORDS.length); }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [text, idx, del, pause]);
  return <span>{text}<motion.span className="inline-block w-[2px] h-4 bg-indigo-400 ml-0.5 align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }} /></span>;
}

// ─── Floating Orb ───
function Orb({ index, className }: { index: number; className?: string }) {
  const x = [0, 60, -40, 30]; const y = [0, -40, 30, -50];
  return <motion.div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{ x, y, scale: [1, 1.15, 0.9, 1.05, 1] }}
    transition={{ duration: [8, 10, 12][index % 3], repeat: Infinity, ease: 'easeInOut', delay: index * 2 }} />;
}

// ─── Parallax Grid ───
function ParallaxGrid({ speed = 1 }: { speed?: number }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200 * speed]);
  return (
    <motion.div className="fixed inset-0 pointer-events-none" style={{ y }}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </motion.div>
  );
}

// ─── Scroll Progress Bar ───
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const sx = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[60]" style={{ scaleX: sx, transformOrigin: '0% 0%' }} />
  );
}

// ─── Stats Card ───
function StatCard({ num, label, suffix = '' }: { num: number; label: string; suffix?: string }) {
  return (
    <div className="text-center p-6">
      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        <AnimatedNumber to={num} suffix={suffix} />
      </div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

// ─── Feature Card ───
function FeatureCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <TiltCard>
      <motion.div className="group relative p-6 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden cursor-default hover:border-indigo-500/30 transition-colors h-full"
        whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
        <motion.div className="absolute -inset-2 bg-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          <h3 className="font-semibold text-slate-200 mb-2 group-hover:text-white transition-colors">{title}</h3>
          <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors leading-relaxed">{desc}</p>
        </div>
      </motion.div>
    </TiltCard>
  );
}

// ─── Step Timeline ───
function StepItem({ num, title, desc, icon: Icon, color }: { num: number; title: string; desc: string; icon: any; color: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className="flex gap-5 items-start"
      initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut', delay: num * 0.15 }}>
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        {num < 5 && <div className="w-px flex-1 min-h-[60px] bg-gradient-to-b from-slate-700 to-transparent my-2" />}
      </div>
      <div className="pt-1.5">
        <h4 className="font-semibold text-slate-200 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Architecture Block ───
function ArchBlock({ title, items, color, side }: { title: string; items: string[]; color: string; side: 'left' | 'right' | 'center' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const dir = side === 'left' ? -30 : side === 'right' ? 30 : 0;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, x: dir, y: side === 'center' ? 30 : 0 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`p-4 bg-slate-900/80 border border-slate-800 rounded-xl ${side === 'center' ? 'text-center' : ''}`}>
      <div className={`text-xs font-semibold text-${color}-400 uppercase tracking-wider mb-2`}>{title}</div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item} className="text-xs text-slate-400 font-mono">{item}</div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───
export function LandingPage({ onStart, onDeveloper }: { onStart: () => void; onDeveloper?: () => void }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const [particles] = useState(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i));

  const features = [
    { icon: Shield, title: 'Zero-Knowledge Proofs', desc: 'Prove you are verified without revealing your name, address, or any identity field. Your data stays hashed and private.', color: 'indigo' },
    { icon: Lock, title: 'No PII Storage', desc: 'Identity fields are SHA256-hashed in your browser before touching the network. We never see your raw data. Neither does anyone else.', color: 'purple' },
    { icon: EyeOff, title: 'Privacy-Preserving Deletion', desc: 'Erase all your on-chain data with one click. Identity commitments, document records, session tokens — all gone. A tombstone prevents re-registration.', color: 'emerald' },
    { icon: Layers, title: '9 ZK Circuits', desc: 'submitIdentity, uploadDocument, approveIdentity, rejectIdentity, deleteIdentity, proveIdentityExists, proveField, login, verifySession — full identity pipeline.', color: 'cyan' },
    { icon: Cpu, title: 'Groth16 on Midnight', desc: 'Industry-standard pairing-based ZK proofs. Compact 0.31.0 with witness-derived keypairs and domain-bound hashing for security.', color: 'amber' },
    { icon: Wallet, title: 'Lace Wallet Ready', desc: 'Connect Lace Wallet (Midnight Preview) for live testnet transactions. UUID key iteration detects your wallet automatically.', color: 'rose' },
  ];

  const steps = [
    { num: 1, title: 'Fill Identity Form', desc: 'Enter 5 identity fields — Full Name, Date of Birth, Nationality, Residential Address, ID Number. Each field is individually SHA256-hashed with domain separation in your browser.', icon: Sparkles, color: 'indigo' },
    { num: 2, title: 'Upload Documents', desc: 'Drag-and-drop passport, driver\'s license, national ID card, utility bill, or bank statement. Documents are committed to the ledger via SHA256 hashes. Raw files never leave your device.', icon: Zap, color: 'purple' },
    { num: 3, title: 'Verifier Approval', desc: 'A trusted verifier oracle inspects the actual documents (out of band) and calls approveIdentity or rejectIdentity via ZK circuits. Status changes from pending to verified or rejected.', icon: CheckCircle2, color: 'emerald' },
    { num: 4, title: 'ZK Login & Session', desc: 'Generate a session nonce by proving you are a verified member — without revealing which one. The login circuit mints a deterministic nonce stored in activeSessions.', icon: Lock, color: 'cyan' },
    { num: 5, title: 'Privacy Erasure', desc: 'Call deleteIdentity to remove every trace of your data from the ledger — field commitments, document records, verification status, and session tokens. A tombstone prevents re-registration.', icon: Trash2, color: 'rose' },
  ];

  return (
    <div className="relative">
      <ScrollProgress />
      <ParallaxGrid speed={0.3} />

      {/* Floating orbs */}
      <Orb index={0} className="fixed top-1/4 -left-32 w-96 h-96 bg-indigo-500/10" />
      <Orb index={1} className="fixed bottom-1/3 -right-32 w-[30rem] h-[30rem] bg-purple-500/10" />
      <Orb index={2} className="fixed top-2/3 left-1/3 w-64 h-64 bg-emerald-500/5" />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none">{particles.map(i => <Particle key={i} i={i} />)}</div>
        <motion.div style={{ y: heroParallax, opacity }} className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto">
          <motion.div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
            style={{ boxShadow: '0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(99,102,241,0.1)' }}
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Shield className="w-10 h-10 text-white" />
            <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-transparent"
              animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </motion.div>

          <motion.h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 leading-none"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">ShadowKey</span>
          </motion.h1>

          <motion.p className="text-xl sm:text-2xl text-slate-300 font-light mb-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Authentication Without Exposure
          </motion.p>

          <motion.div className="mb-6 h-8 text-sm sm:text-base text-slate-400 font-mono"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            The future of <span className="text-indigo-400 font-semibold"><Typewriter /></span>
          </motion.div>

          <motion.p className="text-slate-500 max-w-xl mx-auto mb-8 text-sm sm:text-base"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            Prove your identity with zero-knowledge proofs on Midnight Network. No passwords. No data leaks. Just pure cryptography.
          </motion.p>

          <motion.div className="flex items-center justify-center gap-3 sm:gap-4 mb-10 flex-wrap text-xs sm:text-sm text-slate-500"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
            {['Client-side proofs', 'No trusted setup', 'Groth16 + SHA256', '9 ZK Circuits'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10">{tag}</span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
            <MagnetBtn>
              <Button onClick={onStart} size="lg"
                className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-7 text-lg rounded-xl shadow-2xl shadow-indigo-500/25 group overflow-hidden cursor-pointer">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ backgroundSize: '200% 100%' }}
                  animate={{ backgroundPosition: ['-200% 0', '200% 0'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                <span className="relative z-10 flex items-center gap-2">
                  Start Identity Verification <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </MagnetBtn>
            <p className="text-xs text-slate-600 mt-3">No wallet required — runs in demo mode</p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
            <span className="text-xs text-slate-600">Scroll to explore</span>
            <motion.div className="w-5 h-8 rounded-full border border-slate-700 flex items-start justify-center p-1.5"
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
              <motion.div className="w-1 h-2 rounded-full bg-indigo-400"
                animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative py-20 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <StatCard num={9} label="ZK Circuits" suffix="" />
              <StatCard num={5} label="Identity Fields" suffix="" />
              <StatCard num={202} label="Lines of Compact" suffix="" />
              <StatCard num={8} label="Ledger Maps" suffix="" />
            </div>
          </Section>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Why ShadowKey?
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Identity verification infrastructure designed for privacy, built on Midnight Network's zero-knowledge smart contracts.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Section key={f.title} delay={i * 0.08}>
                <FeatureCard {...f} />
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-20 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Five steps from identity submission to privacy-preserving erasure. All powered by 9 zero-knowledge circuits.
              </p>
            </div>
          </Section>

          <div className="max-w-xl mx-auto pl-2 space-y-1">
            {steps.map((s) => (
              <StepItem key={s.num} {...s} />
            ))}
          </div>

          <Section delay={0.6}>
            <div className="mt-12 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center">
              <p className="text-sm text-indigo-300 font-mono">
                All proof generation happens client-side. No trusted servers. No data collection. No tracking.
              </p>
            </div>
          </Section>
        </div>
      </section>

      {/* ─── ARCHITECTURE ─── */}
      <section className="relative py-20 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Architecture
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Three-layer architecture: browser, ZK proof server, and Midnight ledger.
              </p>
            </div>
          </Section>

          <div className="space-y-4">
            <Section delay={0.1}>
              <ArchBlock title="Browser (React + Lace Wallet)" items={[
                'IdentityForm — 5-field input with SHA256 hashing',
                'DocumentUpload — Drag-and-drop file commitment',
                'Dashboard — Login, verify, delete controls',
                'TerminalLog — Live cryptographic operations log',
                'Witness — getIdentitySecret() from localStorage',
              ]} color="indigo" side="left" />
            </Section>

            <Section delay={0.2}>
              <ArchBlock title="Midnight Network (Compact Contract)" items={[
                'identityCommits: Map<Bytes<32>, IdentityCommit>',
                'identityStatuses: Map<Bytes<32>, Field> (0-4)',
                'documentCommits: Map<Bytes<32>, DocumentRecord>',
                'verifiedIdentities: Map<Bytes<32>, Boolean>',
                'activeSessions: Map<Bytes<32>, Boolean>',
              ]} color="purple" side="center" />
            </Section>

            <Section delay={0.3}>
              <ArchBlock title="9 ZK Circuits" items={[
                'submitIdentity | uploadDocument | approveIdentity',
                'rejectIdentity | deleteIdentity | proveIdentityExists',
                'proveField | login | verifySession',
              ]} color="emerald" side="right" />
            </Section>
          </div>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section className="relative py-20 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Security Model
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Zero-knowledge guarantees, domain-bound hashing, and the witness pattern ensure your data stays private.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: 'ZK Guarantees', items: ['Zero-Knowledge: Proof reveals only the statement\'s truth', 'Soundness: No false proofs possible (Groth16)', 'Completeness: Honest users always generate valid proofs'] },
              { title: 'Domain Separation', items: ['hashField: H("field:v1" || input)', 'hashDocument: H("doc:v1" || input)', 'identityId: H("identity:v1" || secret)', 'sessionNonce: H("session:v1" || id)'] },
              { title: 'Witness Pattern', items: ['Secret generated in browser', 'Used in ZK circuit, never transmitted', 'Only derived identity reaches ledger', 'Production: wallet-derived secrets'] },
            ].map((sec, i) => (
              <Section key={sec.title} delay={i * 0.1}>
                <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl h-full">
                  <h3 className="font-semibold text-slate-200 mb-3 text-sm">{sec.title}</h3>
                  <ul className="space-y-2">
                    {sec.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR DEVELOPERS ─── */}
      <section className="relative py-20 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                For Developers
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Integrate ShadowKey verification into your dApp in under 5 minutes. No complex SDK. No data liability.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section delay={0.1}>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-200">1. User gets verified in ShadowKey</h3>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs leading-relaxed">
                  <div className="text-slate-500">// User submits identity → uploads docs → approved</div>
                  <div className="text-emerald-400">const sessionNonce = await shadowkey.login();</div>
                  <div className="text-slate-500">// Returns: "0x7a3b...c9f2"</div>
                  <div className="text-slate-600 mt-1">// User passes this nonce to your app</div>
                </div>
              </div>
            </Section>

            <Section delay={0.2}>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-slate-200">2. Your app verifies the nonce</h3>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs leading-relaxed">
                  <div className="text-slate-500">// One query to Midnight. No user data exposed.</div>
                  <div className="text-purple-400">const result = await contract</div>
                  <div className="text-purple-400">  .verifySession(nonce);</div>
                  <div className="text-slate-500">// Returns: true | false</div>
                  <div className="text-emerald-400 mt-1">if (result) grantAccess();</div>
                </div>
              </div>
            </Section>
          </div>

          <Section delay={0.3}>
            <div className="mt-6 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Github className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Full Integration Example</h3>
                <span className="text-xs text-slate-600 ml-auto">TypeScript · Midnight SDK</span>
              </div>
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <pre className="text-slate-300">{`import { ShadowKeyContract } from '@shadowkey/contract';
import { createSandboxWallet } from '@midnight-ntwrk/midnight-js-wallet';

// 1. Connect to the deployed contract
const contract = await ShadowKeyContract.deploy(
  createSandboxWallet(mnemonic),
  { address: '0x...' }  // deployed contract address
);

// 2. Verify a user's session (public query — no ZK needed)
async function checkAccess(sessionNonce: string): Promise<boolean> {
  const isValid = await contract.verifySession(sessionNonce);
  return isValid; // true = verified user
}

// 3. Use it in your API route
app.post('/api/verify', async (req, res) => {
  const { sessionNonce } = req.body;
  const allowed = await checkAccess(sessionNonce);
  res.json({ authorized: allowed });
});`}</pre>
              </div>
            </div>
          </Section>

          <Section delay={0.4}>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'No PII Ever', desc: 'You verify sessions, not identities. No KYC data flows through your servers.' },
                { title: 'One Query', desc: 'A single verifySession() call is all you need. Returns boolean. Zero complexity.' },
                { title: 'Self-Sovereign', desc: 'Users control their data. They register once, use everywhere. No re-KYC.' },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg text-center">
                  <h4 className="text-sm font-semibold text-slate-200 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
            {onDeveloper && (
              <div className="mt-6 text-center">
                <Button onClick={onDeveloper} size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer">
                  <ExternalLink className="w-4 h-4" /> Open Developer API Panel
                </Button>
              </div>
            )}
          </Section>
        </div>
      </section>
      <section className="relative py-28 border-t border-slate-800/50 overflow-hidden">
        {/* Parallax background orbs */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ y: useTransform(scrollYProgress, [0.7, 1], [0, -100]) }}>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <Section>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ready to Verify Without Exposing?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Experience the future of privacy-preserving identity verification. No signup. No data collection. Just pure ZK cryptography.
            </p>
            <MagnetBtn>
              <Button onClick={onStart} size="lg"
                className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-7 text-lg rounded-xl shadow-2xl shadow-indigo-500/25 group overflow-hidden cursor-pointer">
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ backgroundSize: '200% 100%' }}
                  animate={{ backgroundPosition: ['-200% 0', '200% 0'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                <span className="relative z-10 flex items-center gap-2">
                  Start Identity Verification <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </MagnetBtn>
          </Section>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative border-t border-slate-800 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-400">ShadowKey</span>
              <span className="text-xs text-slate-600">— MLH Midnight Hackathon 2026</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <a href="https://compact-by-example.org" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Compact by Example</a>
              <a href="https://docs.midnight.network" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Midnight Docs</a>
              <span className="flex items-center gap-1"><Github className="w-3 h-3" /> ShadowKey</span>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-slate-700">
            Built with zero-knowledge proofs and extreme prejudice for privacy. No user data was harmed in the making of this demo.
          </div>
        </div>
      </footer>
    </div>
  );
}
