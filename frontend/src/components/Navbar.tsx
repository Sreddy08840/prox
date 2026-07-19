import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onLoginClick: () => void;
  isLoggingIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, isLoggingIn }) => {
  const menuItems = ['Product', 'Solutions', 'Pricing', 'Resources', 'Company'];
  const [activeSection, setActiveSection] = useState<string>('hero');
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        setActiveSection(hash);
      }
    }
  }, [location.hash]);

  // Highlight active section on scroll
  useEffect(() => {
    const sections = ['hero', 'product', 'solutions', 'pricing', 'resources', 'company', 'book-demo'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[#050B1F]/90 backdrop-blur-md px-6 lg:px-16 py-4 flex items-center justify-between"
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
      <button
        onClick={() => scrollToSection('hero')}
        className="flex items-center space-x-3 hover:opacity-90 transition-opacity text-left cursor-pointer bg-transparent border-0"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          P
        </div>
        <div className="flex flex-col text-left">
          <span className="text-lg font-black tracking-tight text-white leading-none">PropX</span>
          <span className="text-[8px] text-blue-400 font-extrabold uppercase tracking-widest mt-0.5">
            AI Intelligence for Real Estate
          </span>
        </div>
      </button>

      {/* Navigation Options */}
      <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-300">
        {menuItems.map((item) => {
          const sectionId = item.toLowerCase();
          const isActive = activeSection === sectionId;
          return (
            <button
              key={item}
              onClick={() => scrollToSection(sectionId)}
              className={`transition-colors relative group py-2 text-xs font-bold cursor-pointer bg-transparent border-0 ${
                isActive ? 'text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>{item}</span>
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center space-x-6">
        <button
          onClick={onLoginClick}
          className="text-xs font-extrabold text-slate-300 hover:text-white transition-colors py-2 px-3 relative group cursor-pointer bg-transparent border-0"
        >
          Login
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
        </button>

        <button
          onClick={() => scrollToSection('book-demo')}
          className="relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300 hover:scale-[1.05] block cursor-pointer bg-transparent border-0"
        >
          {/* Animated Glow Border */}
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-xl animate-pulse pointer-events-none" />
          <div className="relative px-5 py-2.5 rounded-[11px] bg-[#050B1F] text-white text-xs font-extrabold transition-all duration-300 group-hover:bg-transparent pointer-events-none">
            Book a Demo
          </div>
        </button>
      </div>
    </motion.header>
  );
};
export default Navbar;
