import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onLoginClick: () => void;
  isLoggingIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, isLoggingIn }) => {
  const menuItems = ['Product', 'Solutions', 'Pricing', 'Resources', 'Company'];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#050B1F]/30 backdrop-blur-md px-6 lg:px-16 py-4 flex items-center justify-between"
      animate={{
        y: isLoggingIn ? -100 : 0,
        opacity: isLoggingIn ? 0 : 1,
      }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Brand Logo */}
      <Link to="/login" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          P
        </div>
        <div className="flex flex-col text-left">
          <span className="text-lg font-black tracking-tight text-white leading-none">PropX</span>
          <span className="text-[8px] text-blue-400 font-extrabold uppercase tracking-widest mt-0.5">
            AI Intelligence for Real Estate
          </span>
        </div>
      </Link>

      {/* Navigation Options */}
      <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-300">
        {menuItems.map((item) => (
          <Link
            key={item}
            to={`/${item.toLowerCase()}`}
            className="hover:text-white transition-colors relative group py-2"
          >
            <span>{item}</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 group-hover:w-full" />
          </Link>
        ))}
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center space-x-6">
        <button
          onClick={onLoginClick}
          className="text-xs font-extrabold text-slate-300 hover:text-white transition-colors py-2 px-3 relative group"
        >
          Login
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
        </button>

        <Link to="/book-demo" className="relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300 hover:scale-[1.05] block">
          {/* Animated Glow Border */}
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-xl animate-pulse" />
          <div className="relative px-5 py-2.5 rounded-[11px] bg-[#050B1F] text-white text-xs font-extrabold transition-all duration-300 group-hover:bg-transparent">
            Book a Demo
          </div>
        </Link>
      </div>
    </motion.header>
  );
};
export default Navbar;
