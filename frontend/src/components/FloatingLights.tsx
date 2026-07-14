import React from 'react';
import { motion } from 'framer-motion';

export const FloatingLights: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Light Streak 1 */}
      <motion.div
        className="absolute -top-[10%] left-[20%] w-[30%] h-[120%] bg-gradient-to-b from-blue-500/5 via-cyan-400/5 to-transparent blur-[80px]"
        style={{ rotate: -35 }}
        animate={{
          x: [-100, 200],
          opacity: [0.1, 0.4, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Light Streak 2 */}
      <motion.div
        className="absolute -top-[10%] left-[60%] w-[20%] h-[120%] bg-gradient-to-b from-indigo-500/5 via-purple-400/3 to-transparent blur-[70px]"
        style={{ rotate: -25 }}
        animate={{
          x: [100, -200],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};
export default FloatingLights;
