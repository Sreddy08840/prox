import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Shield, Cpu } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import Stats from '../components/Stats';
import Timeline from '../components/Timeline';
import TeamCard from '../components/TeamCard';
import CTA from '../components/CTA';
import GlassCard from '../components/GlassCard';

export const Company: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const statsItems = [
    { value: "100+", label: "Developer Orgs" },
    { value: "10M+", label: "Leads Processed" },
    { value: "250+", label: "Mapped Projects" },
    { value: "20+", label: "Active Countries" }
  ];

  const timelineEvents = [
    {
      year: "2024",
      title: "Platform Conception",
      description: "PropX is founded to address manual qualification lag within real estate sales pipelines."
    },
    {
      year: "2025",
      title: "AI Pipeline Release",
      description: "We released the real-time WhatsApp webhook ingestion and Anthropic Claude-driven lead scoring engines."
    },
    {
      year: "2026",
      title: "Global Enterprise Scale",
      description: "PropX expands to over 100 developer organizations across 20 countries, processing millions of inquiries."
    }
  ];

  const teamMembers = [
    {
      name: "Siddharth Reddy",
      role: "Founder & CEO",
      bio: "Formerly product lead building scaling developer tools and real estate CRM abstractions.",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "Emma Sterling",
      role: "Head of AI Engineering",
      bio: "Specialist in LLM agent pipelines, structured parameter inferences, and prompt optimizations.",
      imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
    },
    {
      name: "Rajesh Malhotra",
      role: "Head of Platform Architecture",
      bio: "Database administrator designing scaling multi-tenant layouts and event queue integrations.",
      imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80"
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
              Building the future of AI<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                real estate intelligence.
              </span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              We empower real estate developers, builders, and sales agencies with contextual AI automation pipelines to convert clients, trace inventories, and scale.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => setIsLoggingIn(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
              >
                <span>Read Our Story</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Large Office Visual */}
          <div className="relative h-64 lg:h-[360px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80" 
              alt="PropX Office Environment"
              className="w-full h-full object-cover brightness-75"
            />
            {/* Ambient Overlay Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050B1F] via-transparent to-transparent opacity-65" />
          </div>
        </div>

        {/* Stats segment */}
        <Stats items={statsItems} />

        {/* Mission, Vision, and Values grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {[
            {
              title: "Our Mission",
              desc: "To replace friction in real estate transactions by delivering immediate, automated lead qualifications.",
              icon: Cpu
            },
            {
              title: "Our Vision",
              desc: "A unified real-time spatial inventory catalog that matches buyers instantly using semantic intent algorithms.",
              icon: Sparkles
            },
            {
              title: "Core Values",
              desc: "Deep security isolations, operational integrity, and high-performance engineering blueprints.",
              icon: Shield
            }
          ].map((item, i) => (
            <GlassCard key={i} width="100%" className="text-left space-y-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <item.icon size={16} />
              </div>
              <h3 className="text-sm font-black text-white">{item.title}</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">{item.desc}</p>
            </GlassCard>
          ))}
        </div>

        {/* Timeline Event Tracker */}
        <div className="space-y-8 pt-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">Our Journey</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1.5">How we got to processing millions of sales tickets</p>
          </div>
          <Timeline events={timelineEvents} />
        </div>

        {/* Leadership Team Grid */}
        <div className="space-y-12 pt-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Leadership Team</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
              Meet the product architects and engineering specialists behind the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMembers.map((member, idx) => (
              <TeamCard
                key={idx}
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageUrl={member.imageUrl}
                delay={idx * 0.1}
              />
            ))}
          </div>
        </div>

        {/* CTA careers link banner */}
        <CTA
          title="Interested in building the future of SaaS?"
          description="We are constantly hiring scaling engineering leads, AI prompt design specialists, and customer success coordinators."
          primaryText="View Open Positions"
          secondaryText="Partner with Us"
          onPrimaryClick={() => setIsLoggingIn(true)}
        />
      </main>

      <LoginModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />
      <Footer isLoggingIn={isLoggingIn} />
    </motion.div>
  );
};
export default Company;
