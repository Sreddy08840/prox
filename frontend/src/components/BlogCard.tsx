import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

interface BlogCardProps {
  title: string;
  description: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  delay?: number;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  description,
  category,
  date,
  readTime,
  imageUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80",
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
      <GlassCard width="100%" className="h-full flex flex-col justify-between p-0 overflow-hidden group">
        <div className="text-left space-y-4">
          {/* Card Banner Image */}
          <div className="h-44 w-full overflow-hidden relative border-b border-white/5">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
            />
            {/* Category tag */}
            <span className="absolute top-3 left-3 bg-[#0A1633]/90 backdrop-blur-md border border-white/10 text-blue-400 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-lg">
              {category}
            </span>
          </div>

          <div className="p-6 space-y-3">
            <div className="flex items-center space-x-3 text-[9px] text-slate-500 font-bold">
              <span>{date}</span>
              <span>•</span>
              <span>{readTime}</span>
            </div>

            <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors leading-snug">
              {title}
            </h3>

            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
export default BlogCard;
