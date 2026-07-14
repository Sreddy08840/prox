import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export const FAQ: React.FC<FAQProps> = ({ items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 text-left my-16">
      <h2 className="text-xl md:text-2xl font-black text-white text-center mb-8">
        Frequently Asked Questions
      </h2>

      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden"
          >
            <button
              onClick={() => toggleItem(idx)}
              className="w-full flex items-center justify-between p-5 text-xs font-black text-white focus:outline-none"
            >
              <span>{item.question}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-blue-400' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="p-5 pt-0 border-t border-white/5 text-[11px] leading-relaxed text-slate-400 font-semibold">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
export default FAQ;
