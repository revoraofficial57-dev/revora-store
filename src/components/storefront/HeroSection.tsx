import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowRight, Gauge, ShieldCheck, Zap } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (page: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const { settings } = useStore();
  const hero = settings.heroContent;

  return (
    <section className="relative w-full bg-black overflow-hidden border-b border-neutral-900">
      {/* Background Image with Measured Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero.heroImage}
          alt="REVORA Automotive Streetwear Campaign"
          className="w-full h-full object-cover object-center brightness-60 contrast-110"
          referrerPolicy="no-referrer"
          priority-hint="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pt-36 sm:pb-28 flex flex-col justify-end min-h-[580px] lg:min-h-[640px]">
        <div className="max-w-2xl space-y-6">
          {/* Natural editorial lead-in */}
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-400 uppercase">
            <span className="w-6 h-px bg-neutral-600" />
            <span>{hero.tagline || 'PERFORMANCE APPAREL // TRACK & STREET'}</span>
          </div>

          {/* Headline with text-wrap: balance */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase font-display leading-none text-balance">
            {hero.title || 'DRIVE YOUR STYLE.'}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed max-w-xl">
            {hero.subtitle || 'Automotive culture. Premium clothing. Built for those who live the drive.'}
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('shop')}
              className="bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg font-display"
            >
              <span>{hero.primaryButtonText || 'SHOP COLLECTION'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('designs')}
              className="bg-black/60 hover:bg-neutral-900 text-white border border-neutral-700 font-semibold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xs transition-colors cursor-pointer backdrop-blur-xs font-display"
            >
              {hero.secondaryButtonText || 'EXPLORE DESIGNS'}
            </button>
          </div>
        </div>

        {/* Brand Metric / Value Strip at Base */}
        <div className="mt-14 pt-8 border-t border-neutral-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-neutral-200" />
            <div>
              <p className="text-white font-semibold">450 GSM Heavyweight</p>
              <p className="text-[11px] text-neutral-500">Combed Fleece & Jersey</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-neutral-200" />
            <div>
              <p className="text-white font-semibold">12 Cuts / Design</p>
              <p className="text-[11px] text-neutral-500">Universal Apparel Range</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-neutral-200" />
            <div>
              <p className="text-white font-semibold">Bank & COD Options</p>
              <p className="text-[11px] text-neutral-500">Instant Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border border-neutral-600 rounded-full flex items-center justify-center text-[10px] text-neutral-200 font-bold">
              PK
            </div>
            <div>
              <p className="text-white font-semibold">Express Nationwide</p>
              <p className="text-[11px] text-neutral-500">Delivery in 1-3 Days</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
