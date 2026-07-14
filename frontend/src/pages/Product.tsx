import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Users, MessageSquare, Building2, TrendingUp, 
  Sliders, ArrowRight, Play 
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import Dashboard3D from '../components/Dashboard3D';
import FeatureCard from '../components/FeatureCard';
import CTA from '../components/CTA';

export const Product: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const features = [
    {
      title: "AI Lead Qualification",
      description: "Automatically qualify client intent and financial timelines from inbound WhatsApp transcripts.",
      icon: Sparkles,
      benefits: ["Intent categorization (HOT/WARM/COLD)", "Budget bracket inference", "Financing readiness check"]
    },
    {
      title: "AI Negotiation Copilot",
      description: "Real-time suggestion agent contextually drafting follow-ups and addressing client objections.",
      icon: Sliders,
      benefits: ["Auto-generated reply suggestions", "Objection handling blueprints", "Active sentiment analysis"]
    },
    {
      title: "WhatsApp API Ingestion",
      description: "Direct API hook syncing Meta Business messages to centralized lead timelines without manual entries.",
      icon: MessageSquare,
      benefits: ["Live thread synchronizations", "Outbound automation queues", "Failed message delivery retries"]
    },
    {
      title: "CRM Lead Routing",
      description: "Distribute hot qualified inquiries instantly to active agents based on custom workload algorithms.",
      icon: Users,
      benefits: ["Workload limit balancing", "Auto-routing event notifications", "Detailed lead assignment logs"]
    },
    {
      title: "Interactive Inventory Mapping",
      description: "Map spatial layout configurations, pricing grids, and real-time status of your projects visual coordinates.",
      icon: Building2,
      benefits: ["Spatial coordinate markings", "Status sync (Sold, Reserved, Rent)", "Unit brochure email links"]
    },
    {
      title: "Predictive Analytics",
      description: "Aggregate inquiry statistics, budget distribution ratios, and response speed SLA dashboards.",
      icon: TrendingUp,
      benefits: ["Interactive Recharts layouts", "Daily admin metric deliveries", "Detailed conversion timelines"]
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
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Everything you need to<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                sell smarter.
              </span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              PropX combines AI, CRM, WhatsApp automation, inventory management, demand intelligence, analytics and sales automation into one powerful platform for real estate developers.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => setIsLoggingIn(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
              >
                <span>Book Demo</span>
                <ArrowRight size={13} />
              </button>
              <a 
                href="#features"
                className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all"
              >
                <span>Explore Platform</span>
                <Play size={10} className="text-blue-400 fill-blue-400/20" />
              </a>
            </div>
          </div>

          <Dashboard3D />
        </div>

        {/* Features Grid Section */}
        <div id="features" className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Platform Capabilities</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
              Every feature is built into a premium glass ecosystem designed to scale your developer workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <FeatureCard
                key={idx}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                benefits={feature.benefits}
                delay={idx * 0.08}
              />
            ))}
          </div>
        </div>

        {/* Action CTA Section */}
        <CTA
          title="Ready to transform your real estate operations?"
          description="Join active real estate developer networks using PropX to qualifiy sales leads, optimize conversions, and manage inventories in real-time."
          primaryText="Schedule Demo"
          secondaryText="View Pricing Plans"
          onPrimaryClick={() => setIsLoggingIn(true)}
        />
      </main>

      <LoginModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />
      <Footer isLoggingIn={isLoggingIn} />
    </motion.div>
  );
};
export default Product;
