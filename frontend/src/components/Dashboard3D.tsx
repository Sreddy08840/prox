import React, { useRef, useEffect } from 'react';
import AnimatedDashboard from './AnimatedDashboard';

interface Dashboard3DProps {
  isLoggingIn?: boolean;
}

export const Dashboard3D: React.FC<Dashboard3DProps> = ({ isLoggingIn = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth < 1024) return;
    let frameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Throttle event with requestAnimationFrame
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        
        const container = containerRef.current;
        if (container) {
          container.style.setProperty('--dash-rx', `${y * 10 + 4}deg`);
          container.style.setProperty('--dash-ry', `${x * -12 - 8}deg`);
        }
      });
    };

    // Use passive listener for smooth scrolling and touch performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full flex items-center justify-center"
      style={{
        perspective: '1200px',
      }}
    >
      <AnimatedDashboard isLoggingIn={isLoggingIn} />
    </div>
  );
};
export default Dashboard3D;
