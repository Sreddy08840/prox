import React, { useRef, useEffect } from 'react';
import Background3D from './Background3D';
import Particles from './Particles';

interface AnimatedBackgroundProps {
  isLoggingIn: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ isLoggingIn }) => {
  const bgWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth < 1024) return;
    let frameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!bgWrapperRef.current) return;
      
      // Throttle with requestAnimationFrame to lock to display refresh rate
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        
        const wrapper = bgWrapperRef.current;
        if (wrapper) {
          wrapper.style.setProperty('--bg-x', `${x * 20}px`);
          wrapper.style.setProperty('--bg-y', `${y * 20}px`);
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div ref={bgWrapperRef} className="absolute inset-0 pointer-events-none select-none z-0">
      <Background3D isLoggingIn={isLoggingIn} />
      <Particles isLoggingIn={isLoggingIn} />
    </div>
  );
};
export default AnimatedBackground;
