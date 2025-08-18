import { Check, X } from 'lucide-react';
import React, { useState } from 'react';

interface Tier {
  key: string;
  name: string;
  // For static/contact tiers, leave priceMonthly undefined and use `price` fallback
  price: string; // fallback (e.g. "Talk to Us") or legacy usage
  priceMonthly?: number; // numeric monthly USD amount
  priceAnnual?: number;  // numeric annual USD amount (after discount)
  tagline: string;
  cta: string;
  features: { label: string; included: boolean }[];
}

const TIERS: Tier[] = [
  {
    key: 'pro',
    name: '',
    price: '$19', // fallback monthly text
    priceMonthly: 20,
    priceAnnual: 200, // e.g. ~2 months free vs 19*12=228
    tagline: 'Everything you need for one location',
    cta: 'Start Pro Trial',
    features: [
      { label: 'Unlimited ranked slates', included: true },
      { label: 'Full matchup insights & narratives', included: true },
      { label: 'Auto daily + gameday emails', included: true },
      { label: 'Market-tailored recommendations', included: true },
      { label: 'Slate performance analytics (beta)', included: true },
      { label: 'Priority support', included: true },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19', // fallback monthly text
    priceMonthly: 20,
    priceAnnual: 200, // e.g. ~2 months free vs 19*12=228
    tagline: 'Everything you need for one location',
    cta: 'Start Pro Trial',
    features: [
      { label: 'Unlimited ranked slates', included: true },
      { label: 'Full matchup insights & narratives', included: true },
      { label: 'Auto daily + gameday emails', included: true },
      { label: 'Market-tailored recommendations', included: true },
      { label: 'Slate performance analytics (beta)', included: true },
      { label: 'Priority support', included: true },
    ],
  },
  {
    key: 'multi',
    name: 'Multi‑Location',
    price: 'Talk to Us',
    tagline: 'Custom pricing for groups & chains',
    cta: 'Contact Sales',
    features: [
      { label: 'All Pro features', included: true },
      { label: 'Multi‑location management', included: true },
      { label: 'Centralized preference templates', included: true },
      { label: 'API / data export access', included: true },
      { label: 'Dedicated success manager', included: true },
      { label: 'Custom integrations', included: true },
    ],
  },
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
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const renderPrice = (tier: Tier) => {
    if (tier.priceMonthly === undefined || tier.priceAnnual === undefined) {
      return (
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-white">{tier.price}</span>
        </div>
      );
    }
    const amount = billing === 'monthly' ? tier.priceMonthly : tier.priceAnnual;
    const isFree = amount === 0;
    const main = isFree ? 'Free' : `$${amount}`;
    const suffix = billing === 'monthly' ? '/mo' : '/yr';
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold text-white">{main}</span>
          {!isFree && <span className="text-slate-400 mb-1 text-xs">{suffix}</span>}
        </div>
      </div>
    );
  };

  return (
    <section className="relative py-28 overflow-hidden" aria-labelledby="pricing-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-light via-slate-medium to-slate-900 pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 flex flex-col gap-16">
        <header className="text-center max-w-4xl mx-auto flex flex-col gap-5">
          <h2 id="pricing-heading" className="text-4xl md:text-5xl font-bold text-white leading-tight">Simple, Transparent Pricing</h2>
          <p className="text-lg text-slate-200">Start free for one month. Upgrade when you're ready to automate and scale your gameday operations.</p>
          {/* Billing Toggle */}
          <div className="mt-4 flex items-center justify-center">
            <div role="radiogroup" aria-label="Billing Period" className="inline-flex rounded-full p-1 bg-slate-800/70 backdrop-blur border border-slate-600/50 shadow-inner">
              {(['monthly','annual'] as const).map(opt => {
                const active = billing === opt;
                return (
                  <button
                    key={opt}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setBilling(opt)}
                    className={`relative px-5 py-2 text-sm font-medium rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${active ? 'text-white' : 'text-slate-300 hover:text-white'}`}
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      {opt === 'monthly' ? 'Monthly' : 'Annual'}
                      {opt === 'annual' && <span className="text-[10px] font-semibold text-green-300 bg-green-500/10 px-1.5 py-0.5 rounded">Save</span>}
                    </span>
                    {active && <span className="absolute inset-0 rounded-full slate-gradient shadow" />}
                  </button>
                );
              })}
            </div>
          </div>
        </header>
        <div className="grid gap-8 md:grid-cols-3">
          {TIERS.map(tier => (
            <div
              key={tier.key}
              className="relative flex flex-col rounded-2xl border bg-slate-800/60 border-slate-600/40 shadow-lg"
            >
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">{tier.name}</h3>
                  <p className="text-sm text-slate-300 mt-1">{tier.tagline}</p>
                </div>
                {renderPrice(tier)}
                <ul className="flex flex-col gap-3 mt-4">
                  {tier.features.map(f => <Feature key={f.label} included={f.included}>{f.label}</Feature>)}
                </ul>
                <div className="flex-1" />
              </div>
              <div className="p-6 pt-0">
                <button className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition shadow bg-white text-slate-deep hover:bg-slate-medium hover:text-white`}>
                  {tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
