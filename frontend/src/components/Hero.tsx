import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Sparkles, ArrowRight, Play } from 'lucide-react';

import { Link } from 'react-router-dom';

interface HeroProps {
  isLoggingIn: boolean;
  onLoginClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ isLoggingIn, onLoginClick }) => {
  return (
    <motion.div
      className="flex flex-col justify-center text-left max-w-xl z-20"
      animate={{
        x: isLoggingIn ? -150 : 0,
        opacity: isLoggingIn ? 0 : 1,
        scale: isLoggingIn ? 0.95 : 1,
      }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Tiny Header Badge */}
      <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black text-blue-400 tracking-wider uppercase mb-6 w-fit">
        <Sparkles size={11} className="animate-pulse" />
        <span>AI-Powered • Real-Time • Data-Driven</span>
      </div>

      {/* Large Hero Heading */}
      <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-white leading-[1.08] tracking-tight mb-6">
        Build Smart.<br />
        Sell Strategically.<br />
        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">
          Stay in Control.
        </span>
      </h1>

      {/* Subtitle description */}
      <p className="text-sm text-slate-400 leading-relaxed font-semibold mb-8 max-w-lg">
        PropX is the AI intelligence platform for real estate developers. Turn buyer signals into real-time decisions across pricing, demand, and sales — before and after launch.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-12">
        <Link 
          to="/book-demo"
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.03]"
        >
          <span>Book a Demo</span>
          <ArrowRight size={14} />
        </Link>

        <button 
          onClick={onLoginClick}
          className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.03]"
        >
          <span>Explore Dashboard</span>
          <Play size={12} className="text-blue-400 fill-blue-400/20" />
        </button>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-8">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <ShieldCheck size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white leading-none">Enterprise-Grade Security</span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">ISO 27001 Compliant</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Users size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white leading-none">Trusted by 100+ Developers</span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Across 8 Countries</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default Hero;
