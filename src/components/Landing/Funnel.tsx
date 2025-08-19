import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { MapPin, Activity, Users, Trophy, type LucideIcon, TrendingUp } from 'lucide-react';

// Configure funnel inputs: add/remove items; each can have icon + description
interface FunnelInputCfg {
  key: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
}

const FUNNEL_INPUTS: FunnelInputCfg[] = [
  { key: 'quality', label: 'Game Analytics', icon: Activity, description: 'Team strength & competitive balance calibrate Slate Scores' },
  { key: 'location', label: 'Local Market Analysis', icon: MapPin, description: 'Regional team popularity tailors Slate Scores to your venue' },
  { key: 'popularity', label: 'Fan Engagement Metrics', icon: Users, description: 'Games that your customers care about most receive Slate Score boosts' },
  { key: 'stakes', label: 'Match Stakes', icon: Trophy, description: 'Playoff implications & game narratives heavily influence Slate Scores' },
];

// Animated path with traveling orb representing data flowing.
interface PathArrowProps {
  d: string;
  color?: string;
  progress: MotionValue<number>;
  lengthPortion?: [number, number];
  orbSize?: number;
}

const PathArrow = ({ d, color = '#fff', progress, lengthPortion = [0, 1], orbSize = 10 }: PathArrowProps) => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [len, setLen] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Map global progress to local progress for this path
  const local = useTransform(progress, [0, 1], lengthPortion);
  const draw = useTransform(local, v => Math.min(1, Math.max(0, v)));
  // Opacity: fade in quickly, stay visible, then disappear right at destination
  const orbOpacity = useTransform(draw, [0, 0.03, 0.94, 0.97, 1], [0, 1, 1, 0.4, 0]);

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, []);

  useMotionValueEvent(draw, 'change', (v) => {
    if (!pathRef.current) return;
    const l = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(v * l);
    setPos({ x: point.x, y: point.y });
  });

  return (
    <g>
      {/* Faint full path for constant connection visual */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={3}
        opacity={0.4}
      />
      {/* Animated draw overlay */}
      <motion.path
        ref={pathRef}
        d={d}
        fill="transparent"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={len}
        strokeDashoffset={useTransform(draw, v => len - v * len) as any}
        initial={{ strokeDashoffset: len }}
        transition={{ ease: 'easeOut' }}
      />
      <motion.circle
        r={orbSize}
        fill={color}
        style={{ translateX: pos.x, translateY: pos.y, opacity: orbOpacity, filter: 'drop-shadow(0 0 8px rgba(155,183,255,0.9))' }}
      />
    </g>
  );
};

interface InputBoxProps { title: string; description?: string; Icon?: LucideIcon }
const InputBox = ({ title, description, Icon }: InputBoxProps) => (
  <div className="z-50 relative h-full bg-slate-deep text-white rounded-xl px-5 py-4 shadow-xl max-w-[250px] text-center border-2 border-white flex flex-col items-center gap-2">
    {Icon && <Icon className="h-6 w-6 " strokeWidth={1.5} />}
    <h4 className="font-semibold text-sm md:text-base md:leading-none">{title}</h4>
    {description && <p className="text-xs leading-snug">{description}</p>}
  </div>
);

const OutputBox = ({ boxRef }: { boxRef: React.RefObject<HTMLDivElement> }) => (
  <div ref={boxRef} className="slate-gradient text-white rounded-xl px-5 py-4 shadow-xl max-w-[300px] text-center border-2 border-white flex flex-col items-center gap-2">
    <TrendingUp className="h-8 w-8 text-white" strokeWidth={1.5} />
    <h3 className="font-semibold tracking-wide text-2xl">Slate Score</h3>
    <p className="text-sm leading-snug">The number that guarantees you're always showing the right games</p>
  </div>
);

export const Funnel = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  // Original progress spans entire section; we remap so animation finishes halfway (orbs reach output mid screen)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const midProgress = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);

  // Dynamic refs matching FUNNEL_INPUTS length
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [outputShift, setOutputShift] = useState(0); // horizontal translation for output box

  // Build smooth cubic path from bottom center of input to top center of output
  const buildPath = (from: DOMRect, to: DOMRect, container: DOMRect, shiftX: number) => {
    // Start at bottom center (slightly inset) of input
    const sx = from.left + from.width / 2 - container.left;
    const sy = from.bottom - container.top;
    // End at top center (slightly inset) of output
    const ex = to.left + to.width / 2 - container.left + shiftX; // apply shift so path ends where output will render
    const ey = to.top - container.top;
    // Control points: create gentle curve downward then center
    const dy = ey - sy;
    const cpOffsetY = Math.max(60, Math.min(200, dy * 0.55));
    const c1x = sx;
    const c1y = sy + cpOffsetY * 0.35;
    const c2x = ex;
    const c2y = sy + cpOffsetY;
    return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`;
  };

  useLayoutEffect(() => {
    const compute = () => {
      if (!svgWrapRef.current || !outputRef.current) return;
      const containerRect = svgWrapRef.current.getBoundingClientRect();
      const outRect = outputRef.current.getBoundingClientRect();
      // Determine desired center: midpoint between first and last input centers
      const first = inputRefs.current[0]?.getBoundingClientRect();
      const last = inputRefs.current[inputRefs.current.length - 1]?.getBoundingClientRect();
      let shift = 0;
      if (first && last) {
        const desiredCenter = (first.left + first.width / 2 + last.left + last.width / 2) / 2 - containerRect.left;
        const currentCenter = outRect.left + outRect.width / 2 - containerRect.left;
        shift = desiredCenter - currentCenter;
      }
      setOutputShift(shift);
      const newPaths: string[] = [];
      inputRefs.current.forEach(r => {
        if (r) newPaths.push(buildPath(r.getBoundingClientRect(), outRect, containerRect, shift));
      });
      setPaths(newPaths);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16 bg-slate-900" aria-label="Data Funnel Visualization">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-10 items-center">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-white">How We Score the Slate</h1>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-medium pb-2 sm:pb-5">Leveraging Advanced Analytics</h1>
            <p className="text-lg text-slate-200">A diverse range of heuristics is unified into a single number using models that understand the drivers behind customer engagement and retention</p>
          </div>
          <div className="relative" ref={svgWrapRef}>
            {/* Inputs Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch md:items-start justify-start gap-10 mb-40 flex-wrap">
              {FUNNEL_INPUTS.map((cfg, i) => (
                <div className="h-full" key={cfg.key} ref={(el) => (inputRefs.current[i] = el)}>
                  <InputBox title={cfg.label} description={cfg.description} Icon={cfg.icon} />
                </div>
              ))}
            </div>
            {/* Dynamic SVG paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" aria-hidden>
              {paths.map((d, i) => (
                <PathArrow
                  key={i}
                  d={d}
                  color='#6a86d1'
                  progress={midProgress}
                  lengthPortion={[0 + i * 0.02, 1]}
                  orbSize={10}
                />
              ))}
            </svg>
            {/* Output */}
            <div className="flex justify-center items-center pt-8">
              <div style={{ transform: `translateX(${outputShift}px)` }}>
                <OutputBox boxRef={outputRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Funnel;
