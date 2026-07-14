import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

interface TeamCardProps {
  name: string;
  role: string;
  imageUrl?: string;
  bio?: string;
  delay?: number;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  name,
  role,
  imageUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  bio,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <GlassCard width="100%" className="h-full flex flex-col items-center text-center p-6 group">
        {/* Profile Avatar Image */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 border border-white/10 group-hover:scale-[1.05] transition-transform duration-500 shadow-xl">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover brightness-95"
          />
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-black text-white">{name}</h4>
          <p className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">{role}</p>
        </div>

        {bio && (
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-4 border-t border-white/5 pt-4">
            {bio}
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
};
export default TeamCard;
