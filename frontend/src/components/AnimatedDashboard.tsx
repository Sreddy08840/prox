import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Building, Sparkles, Bell, 
  Settings, MessageSquare, ShieldAlert
} from 'lucide-react';

interface AnimatedDashboardProps {
  isLoggingIn: boolean;
}

export const AnimatedDashboard: React.FC<AnimatedDashboardProps> = ({ isLoggingIn }) => {
  // Live states for changing numbers
  const [totalLeads, setTotalLeads] = useState(2340);
  const [qualifiedLeads, setQualifiedLeads] = useState(812);
  const [salesVal, setSalesVal] = useState(24.8);
  const [unitsSold, setUnitsSold] = useState(156);
  const [aiActive, setAiActive] = useState(true);

  // Slow update rate (SaaS "living dashboard" feel with minimal rendering overhead)
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalLeads(prev => prev + (Math.random() > 0.45 ? 1 : 0));
      if (Math.random() > 0.75) {
        setQualifiedLeads(prev => prev + 1);
        setSalesVal(prev => parseFloat((prev + 0.1).toFixed(1)));
      }
      if (Math.random() > 0.92) {
        setUnitsSold(prev => prev + 1);
      }
    }, 6000); // 6s timer is much more battery/CPU efficient

    return () => clearInterval(timer);
  }, []);

  // Set local state overrides on login transition
  const rotateX = isLoggingIn ? '15deg' : 'var(--dash-rx, 6deg)';
  const rotateY = isLoggingIn ? '-35deg' : 'var(--dash-ry, -12deg)';
  const translateZ = isLoggingIn ? '-100px' : '0px';
  const scale = isLoggingIn ? 0.85 : 1;

  // Mock list items
  const projects = [
    { name: 'Skyline Residences', location: 'Bangalore', value: '12.4 Cr', growth: '+ 16.4%' },
    { name: 'Greenfield Apartments', location: 'Hyderabad', value: '8.7 Cr', growth: '+ 11.7%' },
    { name: 'Oceanview Towers', location: 'Mumbai', value: '3.7 Cr', growth: '+ 9.2%' },
  ];

  return (
    <div 
      className="hidden lg:block w-full h-[640px] z-20 select-none"
      style={{ perspective: '1200px' }}
    >
      <div
        className="w-full h-full rounded-2xl border border-white/10 bg-[#070E27]/70 backdrop-blur-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] text-slate-200 overflow-hidden flex flex-col"
        style={{
          transform: `rotateX(${rotateX}) rotateY(${rotateY}) translateZ(${translateZ}) scale(${scale})`,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
          transition: isLoggingIn 
            ? 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.85s'
            : 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s',
          contain: 'layout paint',
        }}
      >
        {/* Top Navbar */}
        <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
              P
            </div>
            <span className="text-xs font-black tracking-tight">PropX Overview</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full">
              Live Feed
            </span>
            <div className="relative cursor-pointer">
              <Bell size={13} className="text-slate-400 hover:text-white" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            </div>
            <Settings size={13} className="text-slate-400 hover:text-white cursor-pointer" />
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white border border-white/10">
              AD
            </div>
          </div>
        </div>

        {/* Outer Layout Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 border-r border-white/5 bg-[#04091A]/60 p-2.5 flex flex-col space-y-1 text-left shrink-0">
            <div className="px-2 py-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">
              Navigation
            </div>
            {[
              { label: 'Overview', icon: Building, active: true },
              { label: 'Projects', icon: Building },
              { label: 'Leads', icon: Users },
              { label: 'AI Copilot', icon: Sparkles, glow: true },
              { label: 'Reports', icon: TrendingUp },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                  item.active 
                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border border-blue-500/20 text-white font-black' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={11} className={item.glow ? 'text-indigo-400' : ''} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-left scrollbar-none bg-[#050C22]/30">
            {/* Page title */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Operational Metrics</h3>
                <span className="text-[9px] text-slate-500 font-semibold">Real-time developer telemetry</span>
              </div>
              <div className="text-[9px] text-slate-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded font-bold">
                May 20 – Jun 20, 2026
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { title: 'Total Leads', val: totalLeads.toLocaleString(), pct: '+18.5%', color: 'text-blue-400' },
                { title: 'Qualified Leads', val: qualifiedLeads.toLocaleString(), pct: '+24.6%', color: 'text-indigo-400' },
                { title: 'Sales Pipeline', val: `₹${salesVal} Cr`, pct: '+12.4%', color: 'text-cyan-400' },
                { title: 'Units Sold', val: unitsSold.toString(), pct: '+15.3%', color: 'text-emerald-400' },
              ].map((c, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-white/10">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase block">{c.title}</span>
                  <div className="text-xs font-black text-white mt-1">{c.val}</div>
                  <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded block w-fit mt-1">
                    {c.pct}
                  </span>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Lead Trend Line Graphic */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-black block">Lead Inquiries Trend</span>
                  <span className="text-[8px] text-slate-500 font-semibold">Daily ticket distribution volume</span>
                </div>
                {/* Custom SVG Line Chart */}
                <div className="h-20 w-full mt-3">
                  <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,70 Q30,40 60,65 T120,30 T180,10 L200,35"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0,70 Q30,40 60,65 T120,30 T180,10 L200,35 L200,80 L0,80 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Pulsing Dot */}
                    <circle cx="180" cy="10" r="3.5" fill="#a5b4fc" className="animate-pulse" />
                    <circle cx="180" cy="10" r="2" fill="#4f46e5" />
                  </svg>
                </div>
              </div>

              {/* Lead Intent Donut */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-black block">AI Lead Intent scoring</span>
                  <span className="text-[8px] text-slate-500 font-semibold font-semibold">Inquiries temperature segments</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="w-14 h-14 relative shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      {/* Hot: 45% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="45 100" strokeDashoffset="0" />
                      {/* Warm: 35% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="35 100" strokeDashoffset="-45" />
                      {/* Cold: 20% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-80" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white">
                      AI Triage
                    </div>
                  </div>
                  <div className="space-y-1 text-[8px] font-black text-slate-400 pl-4 w-full">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" /> HOT</span>
                      <span className="text-white">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" /> WARM</span>
                      <span className="text-white">35%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" /> COLD</span>
                      <span className="text-white">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Grid Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Project Performance Table */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <span className="text-[9px] text-slate-400 font-black block mb-2">Launch Performance</span>
                <div className="space-y-1.5">
                  {projects.map((proj, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px] border-b border-white/5 pb-1.5 last:border-0 last:pb-0 font-extrabold text-slate-300">
                      <div>
                        <span className="block text-white font-black">{proj.name}</span>
                        <span className="text-[7px] text-slate-500">{proj.location}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-white font-black">₹{proj.value}</span>
                        <span className="text-[7px] text-emerald-400 font-bold">{proj.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights Checklist */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5">
                <span className="text-[9px] text-slate-400 font-black block mb-2">Automated AI Insights</span>
                {[
                  { text: 'High demand for 2BHK units in North Bangalore', status: 'success' },
                  { text: 'Price sensitivity increasing in 80L-1Cr range', status: 'warning' },
                  { text: 'Optimal client conversion timing: 7PM - 10PM', status: 'info' }
                ].map((ins, i) => (
                  <div key={i} className="flex items-start space-x-2 text-[9px] font-extrabold text-slate-300">
                    <div className="mt-0.5 shrink-0">
                      {ins.status === 'success' && <Sparkles size={9} className="text-emerald-400" />}
                      {ins.status === 'warning' && <ShieldAlert size={9} className="text-amber-400" />}
                      {ins.status === 'info' && <MessageSquare size={9} className="text-blue-400" />}
                    </div>
                    <span>{ins.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Small Floating AI Assistant Widget inside Dashboard */}
        <AnimatePresence>
          {aiActive && (
            <motion.div
              className="absolute bottom-4 right-4 z-30 p-2.5 rounded-xl border border-blue-500/30 bg-[#0A122E] shadow-xl w-48 text-left"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: "spring", stiffness: 100 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <div className="flex items-center space-x-1.5 text-[8px] font-black text-indigo-400 uppercase">
                  <Sparkles size={10} />
                  <span>Copilot Core</span>
                </div>
                <button 
                  onClick={() => setAiActive(false)}
                  className="text-[8px] text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-[8px] text-slate-300 font-semibold mt-1.5 leading-normal">
                "Lead <span className="text-white font-bold">Rashid Al-Mansoori</span> has scheduled a site visit for Skyline block A-302."
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default AnimatedDashboard;
