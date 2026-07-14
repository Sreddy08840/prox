import React from 'react';
import { motion } from 'framer-motion';

interface StatItem {
  value: string;
  label: string;
}

interface StatsProps {
  items: StatItem[];
}

export const Stats: React.FC<StatsProps> = ({ items }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 border-y border-white/5 bg-white/[0.01] backdrop-blur-[5px] rounded-3xl px-8 my-16">
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-1.5"
        >
          <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {item.value}
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
export default Stats;
