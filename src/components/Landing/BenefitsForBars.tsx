import { Clock, DollarSign, ThumbsUp, Trophy, BarChart3 } from 'lucide-react';
import React from 'react';

interface BenefitItem {
  key: string;
  title: string;
  blurb: string;
  icon: React.ComponentType<any>;
}

const BENEFITS: BenefitItem[] = [
  {
    key: 'automation',
    title: 'Hands-Off Scheduling',
    blurb: "No more laboring over long text messages that your staff doesn't even read. Printable slates make it easy to keep up with the games throughout the day",
    icon: Clock,
  },
  {
    key: 'revenue',
    title: 'Higher Gameday Revenue',
    blurb: 'Optimize screen real estate around peak engagement windows that drive longer stays & larger tabs',
    icon: DollarSign,
  },
  {
    key: 'experience',
    title: 'Better Guest Experience',
    blurb: 'Fans see the games they came for and compelling matchups they didn\'t know they wanted—fewer complaints, more compliments',
    icon: ThumbsUp,
  },
  {
    key: 'advantage',
    title: 'Competitive Edge',
    blurb: 'Never lose another customer to the bar next door because you don\'t have the right game on',
    icon: Trophy,
  }
];

export const BenefitsForBars = () => {
  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-900 via-70% via-slate-medium to-slate-light" aria-labelledby="benefits-heading">
      <div className="relative mx-auto max-w-7xl px-6 flex flex-col gap-16">
        <header className="text-center max-w-5xl mx-auto flex flex-col gap-5">
            <h2 id="benefits-heading" className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Benefits for Venue Owners and Operators
            </h2>
            <p className="text-lg text-slate-200">
                Automated game curation ensures your venue can focus on the important things
            </p>
        </header>
        <div className='flex flex-row'>
            <div className="mt-20 flex-1">
                <div className="relative mx-8">
                    <div className="absolute inset-0 bg-blue-100 rounded-3xl transform -rotate-6" />
                    <div className="relative bg-white p-8 rounded-3xl shadow-xl">
                        <div className="space-y-4">
                            <div className="h-2 bg-blue-600 rounded-full w-3/4" />
                            <div className="h-2 bg-blue-400 rounded-full w-1/2" />
                            <div className="h-2 bg-blue-300 rounded-full w-5/6" />
                            <div className="h-2 bg-blue-200 rounded-full w-2/3" />
                        </div>
                        <div className="mt-8 space-y-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <BarChart3 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="h-2 bg-gray-200 rounded-full" />
                                    <div className="mt-2 h-2 bg-gray-100 rounded-full w-5/6" />
                                </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <ul className="grid grid-cols-1 gap-4 flex-1 ml-8" >
            {BENEFITS.map(b => {
                const Icon = b.icon;
                return (
                <li
                    key={b.key}
                    className="relative group bg-slate-800/60 backdrop-blur rounded-2xl border-0 border-white hover:border-slate-medium/60 transition p-6 flex flex-col gap-4 shadow-lg"
                >
                    <div className='flex flex-row gap-4 items-center'>
                        <span className="aspect-square inline-flex items-center justify-center rounded-lg h-12 w-12 slate-gradient text-white shadow-md group-hover:scale-110 transition-transform">
                            <Icon className="h-6 w-6" />
                        </span>
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-lg text-white leading-snug">{b.title}</h3>
                            <p className="text-sm text-slate-300 flex-1 ">{b.blurb}</p>
                        </div>
                    </div>
                </li>
                );
            })}
            </ul>
        </div>
      </div>
    </section>
  );
};

export default BenefitsForBars;
