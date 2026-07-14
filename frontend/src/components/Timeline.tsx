import React from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="relative max-w-2xl mx-auto py-12 text-left space-y-12">
      {/* Central glowing vertical line */}
      <div className="absolute left-[15px] sm:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500 via-indigo-500 to-transparent opacity-30" />

      {events.map((event, idx) => {
        const isEven = idx % 2 === 0;
        return (
          <div key={idx} className="relative flex flex-col sm:flex-row items-start sm:items-center w-full">
            {/* Pulsing indicator node */}
            <div className="absolute left-[12px] sm:left-1/2 -translate-x-[3px] sm:-translate-x-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#050B1F] shadow-[0_0_12px_#3b82f6] z-10" />

            <div className={`w-full sm:w-1/2 pl-10 sm:pl-0 ${isEven ? 'sm:pr-10 sm:text-right' : 'sm:pl-10 sm:order-last'}`}>
              <motion.div
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all hover:border-white/10"
              >
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                  {event.year}
                </span>
                <h4 className="text-xs font-black text-white mb-1.5">{event.title}</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  {event.description}
                </p>
              </motion.div>
            </div>

            {/* Spacer for symmetrical layouts */}
            <div className="hidden sm:block w-1/2" />
          </div>
        );
      })}
    </div>
  );
};
export default Timeline;
