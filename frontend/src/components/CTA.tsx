import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import GlassCard from './GlassCard';

interface CTAProps {
  title: string;
  description: string;
  primaryText: string;
  secondaryText: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const CTA: React.FC<CTAProps> = ({
  title,
  description,
  primaryText,
  secondaryText,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 md:py-24 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full max-w-3xl mx-auto -z-10" />

      <div className="max-w-4xl mx-auto">
        <GlassCard width="100%" className="py-12 px-6 md:py-16 md:px-12 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <button
                onClick={onPrimaryClick}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.03]"
              >
                <span>{primaryText}</span>
                <ArrowRight size={13} />
              </button>

              <button
                onClick={onSecondaryClick}
                className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.03]"
              >
                <span>{secondaryText}</span>
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.section>
  );
};
export default CTA;
