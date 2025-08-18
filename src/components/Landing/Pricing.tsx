import React, { useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';

const FEATURES: { label: string; included: boolean }[] = [
  { label: 'Tailored Daily Slates Dashboard', included: true },
  { label: 'Printable Slate with TV Channel Guide', included: true },
  { label: 'Daily emails to 5 members of your organization', included: true },
  { label: 'Slates Summaries and Analytics', included: true },
  { label: 'Priority support', included: true }
];

const Feature = ({ included, children }: { included: boolean; children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-sm">
    <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${included ? 'bg-green-500/10 border-green-400 text-green-300' : 'bg-slate-700/40 border-slate-600 text-slate-400'}`}> 
      {included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
    </span>
    <span className={`leading-snug ${included ? 'text-slate-100' : 'text-slate-400 line-through decoration-slate-600'} `}>{children}</span>
  </li>
);

export const Pricing = () => {
  const [venues, setVenues] = useState(1);
  const BASE_PRICE = 20;
  const computedPrice = useMemo(() => {
    if (venues >= 10) return null; // contact sales threshold
    const p = BASE_PRICE - (venues - 1); // decrement $1 per additional venue
    return p < 1 ? 1 : p;
  }, [venues]);

  return (
    <section className="relative py-28 overflow-hidden" aria-labelledby="pricing-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-light via-slate-medium to-slate-900 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 flex flex-col gap-16">
        <header className="text-center flex flex-col gap-5">
          <h2 id="pricing-heading" className="text-4xl md:text-5xl font-bold text-white leading-tight">Simple Pricing that Scales</h2>
          <p className="text-lg text-slate-200">Same powerful feature set, sized to your operation's needs</p>
        </header>
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex flex-col gap-2">
              {/* <label htmlFor="venue-slider" className="text-sm font-medium tracking-wide text-slate-300 uppercase">Number of Venues</label> */}
              <div className="flex items-baseline gap-3">
                <span className="text-xl font-bold text-white tabular-nums">Venues</span>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <div className="relative w-full">
              <input
                id="venue-slider"
                type="range"
                min={1}
                max={10}
                value={venues}
                onChange={e => setVenues(Number(e.target.value))}
                className="w-full appearance-none bg-transparent cursor-pointer"
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={venues}
                aria-label="Number of venues"
              />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full slate-gradient transition-all"
                  style={{ width: `${(Math.min(venues,10)-1)/9 * 100}%` }}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[10px] font-medium tracking-wider">
              {[1,2,3,4,5,6,7,8,9,'10+'].map(mark => (
                <span key={mark as string | number} className={`text-xl ${mark===venues || (mark==='10+' && venues===10) ? 'text-white' : 'text-slate-400'}`}>{mark}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="relative flex flex-col rounded-2xl border bg-slate-800/60 border-slate-600/40 shadow-xl overflow-hidden">
          <div className="p-8 flex flex-col md:flex-row gap-10 md:gap-16">
            <div className="flex-1 flex flex-col gap-3">
                <h3 className="text-2xl font-semibold text-white tracking-tight">What's Included</h3>
                <ul className="flex flex-col gap-2">
                    {FEATURES.map(f => (
                    <Feature key={f.label} included={f.included}>{f.label}</Feature>
                    ))}
                </ul>
            </div>
            <div className="w-px bg-slate-700 hidden md:block" />
            <div className="flex flex-col gap-6 md:w-60">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium tracking-wide text-slate-300 uppercase">Your Plan</span>
                {computedPrice !== null ? (
                  <>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-white tabular-nums">${computedPrice}</span>
                      <span className="text-slate-400 mb-1 text-xs">/mo</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">Contact Sales</span>
                )}
              </div>
              <button
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition shadow ${computedPrice === null ? 'slate-gradient text-white hover:brightness-110' : 'bg-white text-slate-deep hover:bg-slate-medium hover:text-white'}`}
              >
                {computedPrice === null ? 'Talk to Us' : 'Start Free Trial'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
