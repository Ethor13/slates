import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Gauge = ({game}: {game: any}) => {
  const circumference = 2 * Math.PI * 90;
  const score = game?.slateScore ? game?.slateScore * 100 : 0;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const strokeDash = circumference * pct;
  const [displayScore, setDisplayScore] = useState<number | null>(null);
  const rafRef = useRef(0);
  
  useEffect(() => {
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

  if (game) {
    const formattedDate = (new Date(game.date)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
      <div className="w-full h-[20rem] flex flex-row">
        <div className='relative aspect-square flex items-center justify-center'>
          {/* Slate Score Circle */}
          <svg viewBox="0 0 220 220" className="w-[17rem] h-[17rem]">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6a86d1" />
                <stop offset="100%" stopColor="#244396" />
              </linearGradient>
            </defs>
            <circle
              cx={110}
              cy={110}
              r={90}
              stroke="#e2e8f0"
              strokeWidth={14}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={0}
            />
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

          {/* Slate Score Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 6 }}
                transition={{ duration: 1 }}
                className="text-slate-deep font-bold tracking-tight"
              >
                {displayScore}
              </motion.div>
          </div>
        </div>

        <div className="flex flex-col gap-6 justify-center items-center flex-1 px-2">
            {/* Away Team */}
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="flex flex-col items-center w-full">
                <h3
                  style={{ backgroundColor: `#${game.away.colors.primary}`, color: `#${game.away.colors.alternate}` }}
                  className="text-3xl font-bold rounded-full px-5 py-3 flex flex-col items-center justify-center w-full"
                >
                  <div>{game.away.shortName}</div>
                  <p className="text-sm font-medium">{game.away.record}</p>
                </h3>
              </div>

            {/* Game Info */}
            <div className="flex flex-col items-center justify-center">
              <span className="uppercase text-base font-semibold text-slate-500">{game.sport} | {formattedDate}</span>
            </div>

            {/* Home Team */}
            <div className="flex flex-col items-center w-full">
              <h3
                style={{ backgroundColor: `#${game.home.colors.primary}`, color: `#${game.home.colors.alternate}` }}
                className="text-3xl font-bold rounded-full px-5 py-3 flex flex-col items-center justify-center w-full"
              >
                <div>{game.home.shortName}</div>
                <p className="text-sm font-medium">{game.home.record}</p>
              </h3>
            </div>
            </div>
          </div>
      </div>
    );
  } else {
    return <div className='h-[20rem]'></div>;
  }
};

export const Hero = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<any | null>(null); // raw doc
  const [noGames, setNoGames] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ref = doc(db, 'sports', 'today');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setGame(data);
          setNoGames(false);
        } else {
          setNoGames(true);
        }
      } catch (e: any) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section role="banner" aria-label="Slates Hero" className="relative min-h-[calc(100vh-5rem)] flex items-center">
      <div className="absolute inset-0 pointer-events-none" />
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-20 items-center">
          {/* Text Block */}
          <div className="" data-loc="hero-text">
            <h1 className="text-5xl font-bold text-slate-deep">Make Gamedays Simple</h1>
            <h1 className="text-5xl font-bold text-white">with Slates Sports Guides</h1>
            <p className="mt-5 text-lg text-slate-200">Use data-driven insights to show the right games at the right time. Increase customer engagement and boost your revenue with our advanced sports game ranking algorithm</p>
            <div className="mt-8 flex flex-wrap items-center gap-4" data-loc="hero-ctas">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-md bg-white text-black font-semibold text-lg hover:bg-slate-medium hover:text-white border-2 border-transparent hover:border-white transition shadow"
                data-cta="view-today-slate"
              >
                View Today’s Slate
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('contact');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    // fallback: navigate home then attempt scroll after paint
                    navigate('/', { replace: false });
                    setTimeout(() => {
                      const contactEl = document.getElementById('contact');
                      if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }
                }}
                className="px-6 py-3 rounded-md bg-slate-deep text-white font-semibold text-lg hover:bg-slate-medium hover:text-white border-2 border-transparent hover:border-white transition shadow"
                data-cta="request-demo"
              >
                Request a Demo
              </button>
            </div>
          </div>
          {/* Visualization */}
          <div className="relative flex items-center justify-center h-full rounded-[2rem] bg-white p-4" data-loc="hero-visual">
            <div className="flex flex-col items-center w-full">
              {/* Title */}
              <div className="w-full flex items-center gap-2">
                <img src="/assets/logos/slates_white_outline.svg" alt="Slates Logo" className="h-8 w-8" />
                <h2 className="text-xl tracking-wide text-slate-deep font-bold">Tonight&apos;s Top Game</h2>
              </div>
              {noGames && !loading ? (
                <div className="flex flex-col items-center justify-center h-64 w-full">
                  <p className="text-slate-500 font-medium text-lg">No games on the slate</p>
                </div>
              ) : (
                <Gauge game={game} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
