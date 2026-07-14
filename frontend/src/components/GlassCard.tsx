import React, { useRef } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  width?: string;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  width = "460px",
  className = "" 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || window.innerWidth < 1024) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Relative coordinates within the card (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Use direct DOM CSS variable modification to avoid virtual DOM diffing lags
    card.style.setProperty('--rx', `${-y * 10}deg`);
    card.style.setProperty('--ry', `${x * 10}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <div 
      style={{ perspective: '1000px' }}
      className={`w-full max-w-[${width}] flex items-center justify-center`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`bg-white/[0.03] border border-white/10 rounded-[28px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-[20px] flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-white/20 ${className}`}
        style={{
          width,
          transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0)',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          // Hardware accelerate animation transitions using will-change
          willChange: 'transform',
          transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s, shadow 0.3s',
          contain: 'layout paint',
        }}
      >
        {/* Subtle glass reflection light streak */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />

        {/* Ambient subtle card glow */}
        <div className="absolute -inset-px rounded-[28px] bg-gradient-to-tr from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
export default GlassCard;
