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

function random(a: number, b: number) { return Math.random() * (b - a) + a; }

const PARTICLE_COUNT = 40;
function Particle({ i }: { i: number }) {
  const size = random(2, 5);
  const [pos] = useState(() => ({ x: random(0, 100), y: random(0, 100) }));
  const [delay] = useState(() => random(0, 5));
  const [duration] = useState(() => random(8, 20));
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: `${pos.x}%`, top: `${pos.y}%` }}
      animate={{
        y: [0, -120, 0],
        x: [0, random(-40, 40), 0],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration, repeat: Infinity, delay,
        ease: 'easeInOut',
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(99,102,241,0.6), rgba(168,85,247,0.2))`,
          boxShadow: `0 0 ${size * 2}px rgba(99,102,241,0.3)`,
        }}
      />
    </motion.div>
  );
}

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
    <motion.div
      ref={ref} onMouseMove={onMove} onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
      style={{ rotateX: rx, rotateY: ry, perspective: 1000, transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MagnetBtn({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 15 });
  const sy = useSpring(y, { stiffness: 300, damping: 15 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.15);
        y.set((e.clientY - r.top - r.height / 2) * 0.15);
      }}
      onMouseLeave={() => { animate(x, 0); animate(y, 0); }}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Section({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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

const WORDS = ['identity verification', 'passwordless auth', 'privacy layer', 'KYC alternative', 'ZK authentication'];
function Typewriter() {
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [del, setDel] = useState(false);
  const [pause, setPause] = useState(false);
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
  return (
    <span>
      {text}
      <motion.span
        className="inline-block w-[2px] h-4 bg-indigo-400 ml-0.5 align-middle"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.7, repeat: Infinity }}
      />
    </span>
  );
}

function StatCard({ num, label, suffix = '' }: { num: number; label: string; suffix?: string }) {
  return (
    <div className="text-center p-6">
      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.03em]">
        <AnimatedNumber to={num} suffix={suffix} />
      </div>
      <div className="text-sm text-[#6b7a9e] mt-1">{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <TiltCard>
      <motion.div
        className="group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden cursor-default hover:border-indigo-500/30 transition-colors h-full shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <motion.div
          className="absolute -inset-2 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_12px_rgba(99,102,241,0.1)]">
            <Icon className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-[#e4e4f0] mb-2 group-hover:text-white transition-colors tracking-[-0.02em]">{title}</h3>
          <p className="text-sm text-[#6b7a9e] group-hover:text-[#a5b4fc] transition-colors leading-relaxed">{desc}</p>
        </div>
      </motion.div>
    </TiltCard>
  );
}

function StepItem({ num, title, desc, icon: Icon }: { num: number; title: string; desc: string; icon: any }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const colors = ['from-indigo-500 to-violet-500', 'from-violet-500 to-purple-500', 'from-emerald-500 to-teal-500', 'from-cyan-500 to-blue-500', 'from-rose-500 to-pink-500'];
  return (
    <motion.div
      ref={ref}
      className="flex gap-5 items-start"
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut', delay: num * 0.15 }}
    >
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[num % colors.length]}/10 border border-white/[0.08] flex items-center justify-center shrink-0 backdrop-blur-xl shadow-[0_0_12px_rgba(99,102,241,0.1)]`}>
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        {num < 5 && <div className="w-px flex-1 min-h-[60px] bg-gradient-to-b from-white/[0.06] to-transparent my-2" />}
      </div>
      <div className="pt-1.5">
        <h4 className="font-semibold text-[#e4e4f0] text-sm tracking-[-0.02em]">{title}</h4>
        <p className="text-xs text-[#6b7a9e] mt-1 leading-relaxed max-w-md">{desc}</p>
      </div>
    </motion.div>
  );
}

function ArchBlock({ title, items, color, side }: { title: string; items: string[]; color: string; side: 'left' | 'right' | 'center' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const dir = side === 'left' ? -30 : side === 'right' ? 30 : 0;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: dir, y: side === 'center' ? 30 : 0 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${side === 'center' ? 'text-center' : ''}`}
    >
      <div className="text-xs font-semibold text-indigo-400 uppercase tracking-[0.12em] mb-2">{title}</div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item} className="text-xs text-[#6b7a9e] font-mono">{item}</div>
        ))}
      </div>
    </motion.div>
  );
}

export function LandingPage({ onStart, onDeveloper }: { onStart: () => void; onDeveloper?: () => void }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroParallax = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const [particles] = useState(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i));

  const features = [
    { icon: Shield, title: 'Zero-Knowledge Proofs', desc: 'Prove you are verified without revealing your identity. Groth16 proofs over BLS12-381 keep your data private.' },
    { icon: Lock, title: 'No PII Storage', desc: 'Identity fields are SHA256-hashed in your browser before touching the network. We never see your raw data.' },
    { icon: EyeOff, title: 'Privacy-Preserving Deletion', desc: 'Erase all on-chain data with one click. Identity commitments, documents, session tokens all gone.' },
    { icon: Layers, title: '9 ZK Circuits', desc: 'Full identity pipeline: submitIdentity, uploadDocument, approveIdentity, rejectIdentity, deleteIdentity, proveIdentityExists, proveField, login, verifySession.' },
    { icon: Cpu, title: 'Groth16 on Midnight', desc: 'Industry-standard pairing-based ZK proofs. Compact 0.31.0 with domain-bound hashing for security.' },
    { icon: Wallet, title: 'Lace Wallet Ready', desc: 'Connect Lace Wallet (Midnight Preview) for live testnet transactions. Or run in demo mode instantly.' },
  ];

  const steps = [
    { num: 1, title: 'Fill Identity Form', desc: 'Enter 5 identity fields. Each field is individually SHA256-hashed with domain separation in your browser.', icon: Sparkles },
    { num: 2, title: 'Upload Documents', desc: 'Drag-and-drop passport, license, ID card, bill, or statement. Documents committed via SHA256 hashes.', icon: Zap },
    { num: 3, title: 'Verifier Approval', desc: 'A trusted verifier reviews documents and calls approveIdentity via ZK circuits. Status changes to verified.', icon: CheckCircle2 },
    { num: 4, title: 'ZK Login & Session', desc: 'Generate a session nonce by proving verified membership without revealing your identity. Deterministic nonce stored on-chain.', icon: Lock },
    { num: 5, title: 'Privacy Erasure', desc: 'Call deleteIdentity to remove every trace from the ledger. A tombstone prevents re-registration.', icon: Trash2 },
  ];

  return (
    <div className="relative">
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 z-[60] origin-left"
        style={{ scaleX: useSpring(scrollYProgress, { stiffness: 200, damping: 30 }), transformOrigin: '0% 0%' }}
      />

      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200 * 0.3]) }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </motion.div>

      <motion.div className="fixed top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="fixed bottom-1/3 -right-32 w-[30rem] h-[30rem] bg-violet-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="fixed top-2/3 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="fixed top-1/3 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"
        animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 pointer-events-none">{particles.map(i => <Particle key={i} i={i} />)}</div>
        <motion.div style={{ y: heroParallax, opacity }} className="relative z-10 text-center px-4 w-full max-w-5xl mx-auto">
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3),0_0_80px_rgba(99,102,241,0.1)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-10 h-10 text-white" />
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 leading-none tracking-[-0.04em]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">ShadowKey</span>
          </motion.h1>

          <motion.p
            className="text-xl sm:text-2xl text-[#c4b5fd] font-light mb-3 tracking-[-0.02em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Authentication Without Exposure
          </motion.p>

          <motion.div
            className="mb-6 h-8 text-sm sm:text-base text-[#6b7a9e] font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            The future of <span className="text-indigo-400 font-semibold"><Typewriter /></span>
          </motion.div>

          <motion.p
            className="text-[#6b7a9e] max-w-xl mx-auto mb-8 text-sm sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Prove your identity with zero-knowledge proofs on Midnight Network. No passwords. No data leaks. Just pure cryptography.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3 sm:gap-4 mb-10 flex-wrap text-xs sm:text-sm text-[#6b7a9e]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {['Client-side proofs', 'No trusted setup', 'Groth16 + SHA256', '9 ZK Circuits'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-xl">{tag}</span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
            <MagnetBtn>
              <Button onClick={onStart} size="lg"
                className="relative text-white px-10 py-7 text-lg rounded-xl shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] group overflow-hidden cursor-pointer bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{ backgroundSize: '200% 100%' }}
                  animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Start Identity Verification <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </MagnetBtn>
            <p className="text-xs text-[#4f5b7a] mt-3">No wallet required — runs in demo mode</p>
          </motion.div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <span className="text-xs text-[#4f5b7a]">Scroll to explore</span>
            <motion.div className="w-5 h-8 rounded-full border border-white/[0.08] flex items-start justify-center p-1.5"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div className="w-1 h-2 rounded-full bg-indigo-400"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <StatCard num={9} label="ZK Circuits" />
              <StatCard num={5} label="Identity Fields" />
              <StatCard num={202} label="Lines of Compact" />
              <StatCard num={8} label="Ledger Maps" />
            </div>
          </Section>
        </div>
      </section>

      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.03em]">
                Why ShadowKey?
              </h2>
              <p className="text-[#6b7a9e] max-w-2xl mx-auto">
                Identity verification infrastructure designed for privacy, built on Midnight Network.
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

      <section className="relative py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.03em]">
                How It Works
              </h2>
              <p className="text-[#6b7a9e] max-w-2xl mx-auto">
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
            <div className="mt-12 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-center backdrop-blur-xl">
              <p className="text-sm text-indigo-300 font-mono">
                All proof generation happens client-side. No trusted servers. No data collection. No tracking.
              </p>
            </div>
          </Section>
        </div>
      </section>

      <section className="relative py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.03em]">
                Architecture
              </h2>
              <p className="text-[#6b7a9e] max-w-2xl mx-auto">
                Three-layer architecture: browser, ZK proof system, and Midnight ledger.
              </p>
            </div>
          </Section>
          <div className="space-y-4">
            <Section delay={0.1}>
              <ArchBlock title="Browser (React + Lace Wallet)" items={[
                'IdentityForm 5-field input with SHA256 hashing',
                'DocumentUpload Drag-and-drop file commitment',
                'Dashboard Login, verify, delete controls',
                'TerminalLog Live cryptographic operations log',
                'Witness getIdentitySecret() from localStorage',
              ]} color="indigo" side="left" />
            </Section>
            <Section delay={0.2}>
              <ArchBlock title="Midnight Network (Compact Contract)" items={[
                'identityCommits: Map<Bytes<32>, IdentityCommit>',
                'identityStatuses: Map<Bytes<32>, Field> (0-4)',
                'documentCommits: Map<Bytes<32>, DocumentRecord>',
                'verifiedIdentities: Map<Bytes<32>, Boolean>',
                'activeSessions: Map<Bytes<32>, Boolean>',
              ]} color="violet" side="center" />
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

      <section className="relative py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.03em]">
                Security Model
              </h2>
              <p className="text-[#6b7a9e] max-w-2xl mx-auto">
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
                <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl h-full shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                  <h3 className="font-semibold text-[#e4e4f0] mb-3 text-sm tracking-[-0.02em]">{sec.title}</h3>
                  <ul className="space-y-2">
                    {sec.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-[#6b7a9e]">
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

      <section className="relative py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.03em]">
                For Developers
              </h2>
              <p className="text-[#6b7a9e] max-w-2xl mx-auto">
                Integrate ShadowKey verification into your dApp in under 5 minutes. No complex SDK. No data liability.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section delay={0.1}>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 h-full shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-[#e4e4f0] tracking-[-0.02em]">1. User gets verified in ShadowKey</h3>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 font-mono text-xs leading-relaxed">
                  <div className="text-[#4f5b7a]">// User submits identity → uploads docs → approved</div>
                  <div className="text-emerald-400">const sessionNonce = await shadowkey.login();</div>
                  <div className="text-[#4f5b7a]">// Returns: "0x7a3b...c9f2"</div>
                  <div className="text-[#3d4a6b] mt-1">// User passes this nonce to your app</div>
                </div>
              </div>
            </Section>
            <Section delay={0.2}>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 h-full shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-[#e4e4f0] tracking-[-0.02em]">2. Your app verifies the nonce</h3>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 font-mono text-xs leading-relaxed">
                  <div className="text-[#4f5b7a]">// One query to Midnight. No user data exposed.</div>
                  <div className="text-violet-400">const result = await contract</div>
                  <div className="text-violet-400">  .verifySession(nonce);</div>
                  <div className="text-[#4f5b7a]">// Returns: true | false</div>
                  <div className="text-emerald-400 mt-1">if (result) grantAccess();</div>
                </div>
              </div>
            </Section>
          </div>

          <Section delay={0.3}>
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-2 mb-4">
                <Github className="w-4 h-4 text-[#6b7a9e]" />
                <h3 className="text-sm font-semibold text-[#e4e4f0] tracking-[-0.02em]">Full Integration Example</h3>
                <span className="text-xs text-[#4f5b7a] ml-auto">TypeScript · Midnight SDK</span>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <pre className="text-[#c4b5fd]">{`import { ShadowKeyContract } from '@shadowkey/contract';
import { createSandboxWallet } from '@midnight-ntwrk/midnight-js-wallet';

const contract = await ShadowKeyContract.deploy(
  createSandboxWallet(mnemonic),
  { address: '0x...' }
);

async function checkAccess(sessionNonce: string): Promise<boolean> {
  const isValid = await contract.verifySession(sessionNonce);
  return isValid;
}

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
                { title: 'One Query', desc: 'A single verifySession() call is all you need. Returns boolean.' },
                { title: 'Self-Sovereign', desc: 'Users control their data. They register once, use everywhere.' },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center backdrop-blur-xl">
                  <h4 className="text-sm font-semibold text-[#e4e4f0] mb-1 tracking-[-0.02em]">{item.title}</h4>
                  <p className="text-xs text-[#6b7a9e]">{item.desc}</p>
                </div>
              ))}
            </div>
            {onDeveloper && (
              <div className="mt-6 text-center">
                <Button onClick={onDeveloper} size="lg"
                  className="gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_32px_rgba(99,102,241,0.4)] px-8 py-3 rounded-xl cursor-pointer">
                  <ExternalLink className="w-4 h-4" /> Open Developer API Panel
                </Button>
              </div>
            )}
          </Section>
        </div>
      </section>

      <section className="relative py-28 border-t border-white/[0.06] overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ y: useTransform(scrollYProgress, [0.7, 1], [0, -100]) }}
        >
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <Section>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent tracking-[-0.03em]">
              Ready to Verify Without Exposing?
            </h2>
            <p className="text-[#6b7a9e] mb-8 max-w-xl mx-auto">
              Experience the future of privacy-preserving identity verification. No signup. No data collection. Just pure ZK cryptography.
            </p>
            <MagnetBtn>
              <Button onClick={onStart} size="lg"
                className="relative text-white px-10 py-7 text-lg rounded-xl shadow-[0_0_24px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] group overflow-hidden cursor-pointer bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{ backgroundSize: '200% 100%' }}
                  animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  Start Identity Verification <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </MagnetBtn>
          </Section>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.06] bg-white/[0.01] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-[#6b7a9e]">ShadowKey</span>
              <span className="text-xs text-[#4f5b7a]">MLH Midnight Hackathon 2026</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#4f5b7a]">
              <a href="https://compact-by-example.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#a5b4fc] transition-colors">Compact by Example</a>
              <a href="https://docs.midnight.network" target="_blank" rel="noopener noreferrer" className="hover:text-[#a5b4fc] transition-colors">Midnight Docs</a>
              <span className="flex items-center gap-1"><Github className="w-3 h-3" /> ShadowKey</span>
            </div>
          </div>
          <div className="mt-6 text-center text-xs text-[#3d4a6b]">
            Built with zero-knowledge proofs and extreme prejudice for privacy. No user data was harmed in the making of this demo.
          </div>
        </div>
      </footer>
    </div>
  );
}
