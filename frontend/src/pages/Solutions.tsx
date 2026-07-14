import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, Hammer, Users, Sparkles, Network, 
  TrendingUp, Globe, ArrowRight 
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import FeatureCard from '../components/FeatureCard';
import CTA from '../components/CTA';

export const Solutions: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const solutions = [
    {
      title: "Developers",
      description: "Optimize land planning feasibility, layout configurations, and track project sales conversion pipelines.",
      icon: Building,
      benefits: ["Feasibility mix optimization", "Pricing recommendation engines", "Project telemetry tracking"]
    },
    {
      title: "Builders",
      description: "Manage unit construction progress schedules, inventory releases, and block reservations.",
      icon: Hammer,
      benefits: ["Interactive unit mappings", "Real-time block updates", "Spatial coordinate designs"]
    },
    {
      title: "Sales Teams",
      description: "Empower agents with AI lead qualifications, objection handlers, and auto-routing rules.",
      icon: Users,
      benefits: ["Intelligent lead router", "Negotiation draft assistant", "SLA follow-up reminders"]
    },
    {
      title: "Marketing Teams",
      description: "Track campaign source conversions (website, WhatsApp ads, referrals) and qualify inbound buyer intent.",
      icon: Sparkles,
      benefits: ["WhatsApp campaign links", "Inbound lead qualifications", "Conversion analytics dashboard"]
    },
    {
      title: "Broker Networks",
      description: "Coordinate external broker registrations, commission splits, and layout inventory brochure deliveries.",
      icon: Network,
      benefits: ["Broker portal integrations", "PDF brochure automated emailer", "External commission trackers"]
    },
    {
      title: "Investors",
      description: "Monitor project ROI metrics, lease collections, portfolio assets, and asset utilization details.",
      icon: TrendingUp,
      benefits: ["ROI aggregate reporting", "Leasing agreement schedules", "Historical data telemetry"]
    },
    {
      title: "Enterprise Settings",
      description: "Tailor custom CRM webhooks, HubSpot syncing endpoints, and Multi-tenant organization roles.",
      icon: Globe,
      benefits: ["HubSpot contact synchronizer", "Outbound webhooks configuration", "Multi-tenant scheme isolations"]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen w-full bg-[#050B1F] text-slate-100 overflow-hidden font-sans flex flex-col justify-between"
    >
      <AnimatedBackground isLoggingIn={isLoggingIn} />
      <Navbar onLoginClick={() => setIsLoggingIn(true)} isLoggingIn={isLoggingIn} />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 lg:px-16 pt-32 pb-24 space-y-24 z-20">
        {/* Hero Banner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Solutions built for every<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                real estate team.
              </span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              Whether you're a Developer, Builder, Sales Team, Marketing Team or Investor—PropX helps you build smarter and sell faster.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => setIsLoggingIn(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
              >
                <span>Find Your Solution</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Large Visual AI Illustration */}
          <div className="relative flex justify-center items-center h-[320px] md:h-[400px]">
            {/* Ambient glows behind */}
            <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full" />
            <motion.div
              initial={{ rotateY: -10, y: 15 }}
              animate={{ rotateY: 10, y: -15 }}
              transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="relative p-8 rounded-3xl border border-white/10 bg-[#070E27]/50 backdrop-blur-xl shadow-2xl max-w-sm w-full text-left space-y-4"
              style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sparkles size={18} className="animate-spin" />
              </div>
              <h3 className="text-sm font-black text-white">AI-Powered Integrations</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                PropX maps client communication streams to structured databases, dynamically updating CRM records, routing deals, and optimizing sales conversions.
              </p>
              {/* Graphic Nodes */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <span>Inbound WhatsApp</span>
                <ArrowRight size={10} className="text-indigo-400" />
                <span>Structured Leads</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Solutions Grid */}
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Tailored Profiles</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
              Select your organization type to explore custom real-time blueprints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((sol, idx) => (
              <FeatureCard
                key={idx}
                title={sol.title}
                description={sol.description}
                icon={sol.icon}
                benefits={sol.benefits}
                delay={idx * 0.08}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <CTA
          title="Align your organization today"
          description="Scale your sales workflows, organize layout tracking, and automate leads qualification with PropX."
          primaryText="Start Free Trial"
          secondaryText="Read Documentation"
          onPrimaryClick={() => setIsLoggingIn(true)}
        />
      </main>

      <LoginModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />
      <Footer isLoggingIn={isLoggingIn} />
    </motion.div>
  );
};
export default Solutions;
