import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Shield, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeHeroProps {
  onStart: () => void;
}

const PARTICLE_COUNT = 30;
const TYPING_WORDS = [
  'identity verification',
  'passwordless auth',
  'privacy layer',
  'KYC alternative',
  'ZK authentication',
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function Particle({ index }: { index: number }) {
  const size = randomBetween(2, 5);
  const x = randomBetween(0, 100);
  const y = randomBetween(0, 100);
  const delay = randomBetween(0, 5);
  const duration = randomBetween(8, 20);
  const anim = [`particle-float`, `particle-float-2`, `particle-float-3`][index % 3];

  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, rgba(99,102,241,0.6), rgba(168,85,247,0.2))`,
        animation: `${anim} ${duration}s ease-in-out ${delay}s infinite`,
        boxShadow: `0 0 ${size * 2}px rgba(99,102,241,0.3)`,
      }}
    />
  );
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const handleMouse = useCallback((e: MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);
  useEffect(() => {
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [handleMouse]);
  return pos;
}

function useTypewriter() {
  const [text, setText] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const word = TYPING_WORDS[wordIdx];

    if (isPaused) {
      const t = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(t);
    }

    const speed = isDeleting ? 40 : 80;

    const t = setTimeout(() => {
      if (!isDeleting) {
        if (text.length < word.length) {
          setText(word.slice(0, text.length + 1));
        } else {
          setIsPaused(true);
        }
      } else {
        if (text.length > 0) {
          setText(text.slice(0, -1));
        } else {
          setIsDeleting(false);
          setWordIdx((prev) => (prev + 1) % TYPING_WORDS.length);
        }
      }
    }, speed);

    return () => clearTimeout(t);
  }, [text, wordIdx, isDeleting, isPaused]);

  return text;
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });
  const glowX = useSpring(useTransform(mouseX, [0, 1], [0, 100]), { stiffness: 200, damping: 20 });
  const glowY = useSpring(useTransform(mouseY, [0, 1], [0, 100]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, perspective: 1000 }}
      className={className}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, rgba(99,102,241,0.12), transparent 60%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 15 });
  const springY = useSpring(y, { stiffness: 300, damping: 15 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    x.set(dx * 0.15);
    y.set(dy * 0.15);
  };

  const handleLeave = () => {
    animate(x, 0, { type: 'spring', stiffness: 200, damping: 15 });
    animate(y, 0, { type: 'spring', stiffness: 200, damping: 15 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FloatingOrb({ index, className }: { index: number; className?: string }) {
  const xRange = [0, 60, -40, 30];
  const yRange = [0, -40, 30, -50];
  const duration = [8, 10, 12][index % 3];
  const delay = index * 2;

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        x: xRange,
        y: yRange,
        scale: [1, 1.15, 0.9, 1.05, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

function GridLine({ index }: { index: number }) {
  const isHorizontal = index % 2 === 0;
  const size = isHorizontal ? 'w-full h-px' : 'w-px h-full';
  const offset = randomBetween(-40, 40);

  return (
    <motion.div
      className={`absolute ${size} bg-gradient-to-r ${
        isHorizontal
          ? 'from-transparent via-indigo-500/10 to-transparent'
          : 'from-transparent via-purple-500/10 to-transparent'
      }`}
      style={{
        [isHorizontal ? 'top' : 'left']: `${(index / 8) * 100}%`,
      }}
      animate={{
        [isHorizontal ? 'x' : 'y']: [offset, -offset, offset],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: randomBetween(4, 8),
        repeat: Infinity,
        ease: 'easeInOut',
        delay: randomBetween(0, 3),
      }}
    />
  );
}

export function WelcomeHero({ onStart }: WelcomeHeroProps) {
  const mouse = useMousePosition();
  const typingText = useTypewriter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseNormalized, setMouseNormalized] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMouseNormalized({
      x: (mouse.x - rect.left) / rect.width,
      y: (mouse.y - rect.top) / rect.height,
    });
  }, [mouse]);

  const gridX = useTransform(
    useSpring(mouseNormalized.x * 20, { stiffness: 100, damping: 30 }),
    [-10, 30],
    [-5, 5]
  );

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => i);

  const features = [
    { title: 'Fill Identity Form', desc: '5 fields → SHA256 hashed → committed to ledger', icon: Sparkles, color: 'indigo' },
    { title: 'Upload Documents', desc: 'Drag & drop docs → document commitments on-chain', icon: Zap, color: 'purple' },
    { title: 'Auto-Verify & Login', desc: 'ZK proofs verified → session token minted', icon: Shield, color: 'emerald' },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Particles layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((i) => (
          <Particle key={i} index={i} />
        ))}
      </div>

      {/* Animated grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <GridLine key={i} index={i} />
        ))}
      </div>

      {/* Floating gradient orbs */}
      <FloatingOrb index={0} className="top-1/4 -left-32 w-96 h-96 bg-indigo-500/10" />
      <FloatingOrb index={1} className="bottom-1/3 -right-32 w-[30rem] h-[30rem] bg-purple-500/10" />
      <FloatingOrb index={2} className="top-2/3 left-1/3 w-64 h-64 bg-emerald-500/5" />

      {/* Main content */}
      <div className="relative z-10 text-center py-12">
        {/* 3D Tilt Shield */}
        <TiltCard className="group inline-block mb-8">
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl cursor-default"
            style={{
              boxShadow: '0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(99,102,241,0.1)',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-10 h-10 text-white" />
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-transparent"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </TiltCard>

        {/* Title with gradient */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ShadowKey
          </span>
        </motion.h1>

        {/* Typewriter subtitle */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-xl sm:text-2xl text-slate-300 font-light">
            Authentication Without Exposure
          </span>
        </motion.div>

        {/* Typing animation */}
        <motion.div
          className="mb-6 h-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-sm sm:text-base text-slate-400 font-mono">
            The future of{' '}
            <span className="text-indigo-400 font-semibold">
              {typingText}
              <motion.span
                className="inline-block w-[2px] h-4 bg-indigo-400 ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            </span>
          </span>
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-slate-500 max-w-xl mx-auto mb-8 text-sm sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Prove your identity with zero-knowledge proofs on Midnight Network.
          No passwords. No data leaks. Just pure cryptography.
        </motion.p>

        {/* Bubbles */}
        <motion.div
          className="flex items-center justify-center gap-4 sm:gap-6 mb-8 text-xs sm:text-sm text-slate-500"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Client-side proofs
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block" />
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> No trusted setup
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block" />
          <span className="px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10">
            Groth16 + SHA256
          </span>
        </motion.div>

        {/* Magnetic CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <MagneticButton>
            <Button
              onClick={onStart}
              size="lg"
              className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-lg rounded-xl shadow-2xl shadow-indigo-500/25 group overflow-hidden cursor-pointer"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ backgroundSize: '200% 100%' }}
                animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Start Identity Verification
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </MagneticButton>
          <p className="text-xs text-slate-600 mt-3">No wallet required runs in demo mode</p>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 relative z-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 1.4 } },
        }}
      >
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
              }}
            >
              <TiltCard>
                <motion.div
                  className="group relative p-5 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden cursor-default transition-colors hover:border-indigo-500/30"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  {/* Hover glow */}
                  <motion.div
                    className="absolute -inset-2 bg-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                  />
                  <div className="relative z-10">
                    <motion.div
                      className={`w-10 h-10 rounded-lg bg-${feature.color}-500/10 border border-${feature.color}-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-5 h-5 text-${feature.color}-400`} />
                    </motion.div>
                    <h3 className="font-semibold text-sm text-slate-200 group-hover:text-white transition-colors">
                      {i + 1}. {feature.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
