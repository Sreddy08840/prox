import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import GlassCard from './GlassCard';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setEmail('');
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-2xl mx-auto my-16"
    >
      <GlassCard width="100%" className="p-8 md:p-10 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-base font-black text-white">Subscribe to PropX Insights</h3>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            Get weekly enterprise CRM qualification blueprints, developer updates, and AI tactics delivered straight to your inbox.
          </p>

          {success ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-xl text-center"
            >
              ✓ Subscription completed successfully! Thank you.
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-grow px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300 hover:scale-[1.02] shrink-0 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send size={11} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
export default Newsletter;
