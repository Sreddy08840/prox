import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import GlassCard from './GlassCard';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  benefits?: string[];
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  benefits = [],
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <GlassCard width="100%" className="h-full flex flex-col justify-between">
        <div className="space-y-4 text-left">
          {/* Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Icon size={18} className="transition-transform group-hover:scale-110 duration-300" />
          </div>

          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            {description}
          </p>

          {benefits.length > 0 && (
            <ul className="space-y-2.5 pt-2">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center space-x-2.5 text-[11px] font-bold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
export default FeatureCard;
