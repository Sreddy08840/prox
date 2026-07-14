import React from 'react';
import { motion } from 'framer-motion';

interface Background3DProps {
  isLoggingIn: boolean;
}

export const Background3D: React.FC<Background3DProps> = ({ isLoggingIn }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* City Skyline Background with Parallax and Zoom via CSS variables */}
      <div
        className="absolute inset-0 bg-cover bg-center select-none"
        style={{
          backgroundImage: 'url("/luxury_skyline.png")',
          transform: 'translate3d(var(--bg-x, 0px), var(--bg-y, 0px), 0px) scale(var(--bg-scale, 1.02))',
          ['--bg-scale' as any]: isLoggingIn ? 1.08 : 1.02,
          willChange: 'transform',
          transition: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s',
          // Avoid LCP-delaying filter animations. Animate opacity instead.
          opacity: isLoggingIn ? 0.25 : 0.45,
          contain: 'layout paint',
        }}
      />

      {/* Dark Luxury Navy Overlay (#050B1F) */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, #050B1F, rgba(5, 11, 31, 0.85))' }}
        animate={{
          opacity: isLoggingIn ? 0.95 : 0.85,
        }}
        transition={{ duration: 0.85 }}
      />

      {/* Single Optimized Aurora Glow (GPU Composited) */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] rounded-full bg-blue-500/15 blur-[100px]"
          animate={{
            transform: [
              'translate3d(0px, 0px, 0) scale(1)',
              'translate3d(15px, -20px, 0) scale(1.08)',
              'translate3d(-10px, 10px, 0) scale(0.95)',
              'translate3d(0px, 0px, 0) scale(1)'
            ]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            willChange: 'transform',
            contain: 'layout paint',
          }}
        />
      </div>

      {/* Animated 3D Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '85px 85px',
          perspective: '1000px',
          transform: 'rotateX(60deg) translateY(-200px) translateZ(0)',
          transformOrigin: 'top center',
          contain: 'layout paint',
        }}
      />

      {/* Fog Overlay */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#050B1F] via-[#050B1F]/30 to-transparent opacity-80"
        animate={{
          opacity: isLoggingIn ? 0.95 : 0.8,
        }}
        transition={{ duration: 0.85 }}
      />

      {/* Noise Texture Overlay for high-end cinematic feel */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
export default Background3D;
