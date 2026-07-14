import React from 'react';
import { motion } from 'framer-motion';

export const Aurora: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute top-1/4 left-1/4 w-[80%] h-[60%] rounded-full bg-gradient-to-tr from-blue-600/10 via-indigo-600/5 to-cyan-500/10 blur-[150px]"
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 40, 0],
          rotate: [0, 90, 180, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};
export default Aurora;
