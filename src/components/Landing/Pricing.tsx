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

interface PricingProps { maxVenues?: number }

export const Pricing = ({ maxVenues = 6 }: PricingProps) => {
  const [venues, setVenues] = useState(1);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const BASE_PRICE = 20;
  const monthlyPrice = useMemo(() => {
    if (venues >= maxVenues) return null; // contact sales threshold
    const p = BASE_PRICE - (venues - 1); // decrement $1 per additional venue
    return p < 1 ? 1 : p;
  }, [venues, maxVenues]);
  const annualTotal = monthlyPrice !== null ? monthlyPrice * 10 : null; // simple annual total (no discount) adjust as needed

  return (
    <section className="relative py-28 overflow-hidden" aria-labelledby="pricing-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-light via-slate-medium to-slate-900 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 flex flex-col gap-16">
        <header className="text-center flex flex-col gap-5">
          <h2 id="pricing-heading" className="text-4xl md:text-5xl font-bold text-white leading-tight">Simple Pricing that Scales</h2>
          <p className="text-lg text-slate-200">Same powerful feature set, sized to your operation's needs</p>
        </header>
        <div className="w-full flex flex-col">
            <span className="text-xl font-semibold text-white tabular-nums">Venues</span>
          <div>
            <div className="relative w-full">
              <input
                type="range"
                min={1}
                max={maxVenues}
                value={venues}
                onChange={e => setVenues(Number(e.target.value))}
                className="px-3 h-2 w-full appearance-none cursor-pointer accent-slate-deep bg-slate-300/20 rounded-full"
                aria-valuemin={1}
                aria-valuemax={maxVenues}
                aria-valuenow={venues}
                aria-label="Number of venues"
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-medium tracking-wider">
              {Array.from({ length: maxVenues }, (_, i) => i + 1).map(v => {
                const isLast = v === maxVenues;
                const label: string | number = isLast ? `${maxVenues}+` : v;
                const active = (isLast && venues === maxVenues) || venues === v;
                return (
                  <span key={label} className={`w-10 text-center min text-2xl ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
                );
              })}
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
                {/* Billing Toggle */}
                <div className="self-start mb-1">
                  <div role="radiogroup" aria-label="Billing Period" className="inline-flex rounded-full p-1 bg-slate-700/60 border border-slate-600/60 shadow-inner">
                    {(['monthly','annual'] as const).map(opt => {
                      const active = billing === opt;
                      return (
                        <button
                          key={opt}
                          role="radio"
                          aria-checked={active}
                          onClick={() => setBilling(opt)}
                          className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${active ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            {opt === 'monthly' ? 'Monthly' : 'Annual'}
                            {opt === 'annual' && <span className="hidden md:inline text-[9px] font-semibold text-green-300 bg-green-500/10 px-1 py-0.5 rounded">2 months free</span>}
                          </span>
                          {active && <span className="absolute inset-0 rounded-full slate-gradient" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <span className="text-sm font-medium tracking-wide text-slate-300 uppercase">Your Plan</span>
                <div className='h-10 flex flex-col justify-center'>
                    {monthlyPrice !== null ? (
                    <>
                        <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-white tabular-nums">
                            {billing === 'monthly' ? `$${monthlyPrice}` : `$${annualTotal}`}
                        </span>
                        <span className="text-slate-400 mb-1 text-xs">per {billing === 'monthly' ? 'month' : 'year'} per venue</span>
                        </div>
                    </>
                    ) : (
                    <span className="text-xl font-semibold text-slate-light">Contact Sales</span>
                    )}
                </div>
              </div>
              <button
                className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition shadow ${monthlyPrice === null ? 'slate-gradient text-white hover:brightness-110' : 'bg-white text-slate-deep hover:bg-slate-medium hover:text-white'}`}
              >
                {monthlyPrice === null ? 'Talk to Us' : 'Start Free Trial'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
