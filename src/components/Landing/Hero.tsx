import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Static score implementation (hardcoded for now)
const STATIC_SLATE_SCORE = 92;

const Gauge = ({ score }: { score: number | null }) => {
  const circumference = 2 * Math.PI * 90; // r 90
  const pct = score !== null ? score / 100 : 0;
  const strokeDash = circumference * pct;
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (score === null) return;
    const start = performance.now();
    const from = 0;
    const to = score;
    const dur = 900;
    const tick = (t: number) => {
      const e = Math.min(1, (t - start) / dur);
      setDisplayScore(Math.round(from + (to - from) * e));
      if (e < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);
  return (
    <div className="relative w-full max-w-[520px] mx-auto flex flex-col items-center">
      <h2 className="mb-4 text-4xl tracking-wide text-slate-deep font-bold">
        Slate&apos;s Pick of the Day
      </h2>
      <div className="relative w-full aspect-square">
        <svg viewBox="0 0 220 220" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6a86d1" />
              <stop offset="100%" stopColor="#244396" />
            </linearGradient>
          </defs>
          <motion.circle
            cx={110}
            cy={110}
            r={90}
            stroke="url(#gaugeGradient)"
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDash}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 8 }}
            transition={{ duration: 1 }}
            className="text-slate-deep font-bold tracking-tight"
          >
            {displayScore}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const Hero = () => {
  return (
    <section role="banner" aria-label="Slates Hero" className="relative min-h-[90vh] flex items-center">
      <div className="absolute inset-0 pointer-events-none" />
      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-12 items-center">
          {/* Text Block */}
          <div className="" data-loc="hero-text">
            <h1 className="text-5xl font-bold text-slate-deep">Make Gamedays Simple</h1>
            <h1 className="text-5xl font-bold text-white">with Slates Sports Guides</h1>
            <p className="mt-5 text-lg text-slate-200">Use data-driven insights to show the right games at the right time. Increase customer engagement and boost your revenue with our advanced sports game ranking algorithm</p>
            <div className="mt-8 flex flex-wrap items-center gap-4" data-loc="hero-ctas">
              <button className="px-6 py-3 rounded-md bg-white text-black font-semibold text-lg hover:bg-slate-medium hover:text-white border-2 border-transparent hover:border-white transition shadow" data-cta="view-today-slate">View Today’s Slate</button>
              <button className="px-6 py-3 rounded-md bg-slate-deep text-white font-semibold text-lg hover:bg-slate-medium hover:text-white border-2 border-transparent hover:border-white transition shadow" data-cta="view-today-slate">Request a Demo</button>
            </div>
          </div>
          {/* Visualization */}
          <div className="relative" data-loc="hero-visual">
            <Gauge score={STATIC_SLATE_SCORE} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
