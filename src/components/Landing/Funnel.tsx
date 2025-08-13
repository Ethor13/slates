import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';

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

const InputBox = ({ title }: { title: string; description?: string }) => (
  <div className="relative bg-slate-deep rounded-xl py-3 shadow-2xl min-w-[200px] text-center">
    <h4 className="text-white font-semibold tracking-wide">{title}</h4>
  </div>
);

const OutputBox = ({ boxRef }: { boxRef: React.RefObject<HTMLDivElement> }) => (
  <div ref={boxRef} className="relative rounded-xl slate-gradient border-2 border-white py-3 text-center shadow-xl min-w-[200px]">
    <h4 className="text-white text-2xl font-bold tracking-wide">Slate Score</h4>
  </div>
);

export const Funnel = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  // Original progress spans entire section; we remap so animation finishes halfway (orbs reach output mid screen)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const midProgress = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  const inputRefs = [useRef<HTMLDivElement | null>(null), useRef<HTMLDivElement | null>(null), useRef<HTMLDivElement | null>(null)];
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
      const first = inputRefs[0].current?.getBoundingClientRect();
      const last = inputRefs[2].current?.getBoundingClientRect();
      let shift = 0;
      if (first && last) {
        const desiredCenter = (first.left + first.width / 2 + last.left + last.width / 2) / 2 - containerRect.left;
        const currentCenter = outRect.left + outRect.width / 2 - containerRect.left;
        shift = desiredCenter - currentCenter;
      }
      setOutputShift(shift);
      const newPaths: string[] = [];
      inputRefs.forEach(r => {
        if (r.current) {
          newPaths.push(buildPath(r.current.getBoundingClientRect(), outRect, containerRect, shift));
        }
      });
      setPaths(newPaths);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16" aria-label="Data Funnel Visualization">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-row gap-20 items-center">
          {/* Funnel Visualization Left */}
          <div className="relative" ref={svgWrapRef}>
            {/* Inputs Row */}
            <div className="flex flex-row items-stretch md:items-start justify-start gap-10 mb-40">
              <div ref={inputRefs[0]}><InputBox title="Location" /></div>
              <div ref={inputRefs[1]}><InputBox title="Game Quality" /></div>
              <div ref={inputRefs[2]}><InputBox title="Popularity" /></div>
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
            <div className="flex justify-center pt-8">
              <div style={{ transform: `translateX(${outputShift}px)` }}>
                <OutputBox boxRef={outputRef} />
              </div>
            </div>
          </div>
          {/* Text Right */}
          <div className="md:pl-4 md:text-right flex flex-col items-start md:items-end gap-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">How We Score the Slate</h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Funnel;
