import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import GlassCard from './GlassCard';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating?: number;
}

interface TestimonialsProps {
  items: Testimonial[];
}

export const Testimonials: React.FC<TestimonialsProps> = ({ items }) => {
  return (
    <div className="py-12 space-y-8 my-16">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-black text-white">
          Trusted by Industry Leaders
        </h2>
        <p className="text-[11px] text-slate-400 font-semibold max-w-md mx-auto">
          Hear how PropX is scaling operations, qualifying leads, and optimizing conversions globally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <GlassCard width="100%" className="h-full flex flex-col justify-between text-left">
              <div className="space-y-4">
                {/* Visual stars / metrics indicator */}
                <div className="flex items-center space-x-1 text-amber-400">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <span key={i} className="text-xs">★</span>
                  ))}
                  <Sparkles size={11} className="text-indigo-400 ml-2 animate-pulse" />
                </div>

                <p className="text-[11px] text-slate-300 font-semibold italic leading-relaxed">
                  "{item.quote}"
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-6 border-t border-white/5 mt-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-black text-[10px] text-white">
                  {item.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white leading-none">{item.author}</span>
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase mt-1 leading-none">
                    {item.role}, {item.company}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default Testimonials;
