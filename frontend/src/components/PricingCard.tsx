import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import GlassCard from './GlassCard';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  onCtaClick?: () => void;
  delay?: number;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period,
  description,
  features,
  ctaText,
  isPopular = false,
  onCtaClick,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="h-full relative"
    >
      {/* Glow effect for popular plan */}
      {isPopular && (
        <div className="absolute inset-0 bg-blue-500/15 blur-[40px] rounded-[28px] -z-10" />
      )}

      <GlassCard 
        width="100%" 
        className={`h-full flex flex-col justify-between ${
          isPopular ? 'border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.15)]' : ''
        }`}
      >
        <div className="text-left space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-black text-white">{name}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{description}</p>
            </div>
            {isPopular && (
              <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                Most Popular
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline space-x-1.5 py-2 border-b border-white/5">
            <span className="text-3xl font-black text-white">{price}</span>
            <span className="text-[10px] text-slate-500 font-semibold">{period}</span>
          </div>

          {/* Features */}
          <ul className="space-y-3 pt-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start space-x-3 text-[11px] font-bold text-slate-300">
                <div className="p-0.5 rounded bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                  <Check size={10} />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="pt-8">
          <button
            onClick={onCtaClick}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs transition-all duration-300 hover:scale-[1.03] ${
              isPopular
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {ctaText}
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
};
export default PricingCard;
