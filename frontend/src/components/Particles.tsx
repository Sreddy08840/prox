import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface ParticlesProps {
  isLoggingIn: boolean;
}

export const Particles: React.FC<ParticlesProps> = ({ isLoggingIn: _isLoggingIn }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate only 15 random particles (limit CPU overhead)
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      size: Math.random() * 3 + 1.5, // 1.5px to 4.5px
      duration: Math.random() * 20 + 15, // 15s to 35s (slower speed)
      delay: Math.random() * -30, // negative delay so they start scattered
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 hidden md:block select-none">
      {/* Inline styles for CSS keyframe animation to bypass JS main thread updates */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          10% {
            opacity: 0.35;
          }
          90% {
            opacity: 0.35;
          }
          100% {
            transform: translate3d(var(--drift-x), -350px, 0);
            opacity: 0;
          }
        }
        .gpu-particle {
          will-change: transform, opacity;
          animation: floatUp var(--duration) linear infinite;
          animation-delay: var(--delay);
          contain: layout paint;
        }
      `}</style>
      {particles.map((p) => {
        const driftX = `${(Math.random() - 0.5) * 60}px`;
        return (
          <div
            key={p.id}
            className="gpu-particle absolute rounded-full bg-blue-400/20 shadow-[0_0_6px_rgba(96,165,250,0.3)]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              // Pass custom variables to keyframe
              '--duration': `${p.duration}s`,
              '--delay': `${p.delay}s`,
              '--drift-x': driftX,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};
export default Particles;
