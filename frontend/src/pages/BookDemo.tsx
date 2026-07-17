import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, ArrowRight, ShieldCheck, Sparkles, 
  MessageSquare, Sliders, Globe, Calendar, Clock, Loader2, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import Dashboard3D from '../components/Dashboard3D';
import GlassCard from '../components/GlassCard';
import FAQ from '../components/FAQ';
import Testimonials from '../components/Testimonials';

// Validation Schema with Zod
const schema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  companyName: z.string().min(1, 'Company Name is required'),
  email: z.string().email('Invalid business email address'),
  phone: z.string().min(1, 'Phone Number is required'),
  country: z.string().min(1, 'Country is required'),
  orgSize: z.string().min(1, 'Organization Size is required'),
  role: z.string().min(1, 'Role/Designation is required'),
  projects: z.string().min(1, 'Please specify the project count'),
  preferredDate: z.string().min(1, 'Preferred Date is required'),
  preferredTime: z.string().min(1, 'Preferred Time is required'),
  message: z.string().optional(),
  agreed: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Privacy Policy'
  })
});

type FormData = z.infer<typeof schema>;

export const BookDemo: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      companyName: '',
      email: '',
      phone: '',
      country: '',
      orgSize: '10-50 employees',
      role: 'Sales Director',
      projects: '1-5 projects',
      preferredDate: '',
      preferredTime: '',
      message: '',
      agreed: undefined
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/book-demo', data);
      setFormSubmitted(true);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.response?.data?.error?.message || 'Failed to schedule demo request. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  const testimonialItems = [
    {
      quote: "PropX completely transformed our layout tracking. We mapped our coordinates in minutes, and the AI qualification immediately prioritized our buyers.",
      author: "Aditya Hegde",
      role: "Sales Director",
      company: "Skyline Properties",
      rating: 5
    },
    {
      quote: "Integrating our inbound Meta WhatsApp business API directly into PropX workflows reduced our agent response times from hours to under 2 minutes.",
      author: "Sarah Sterling",
      role: "Head of Marketing",
      company: "Prestige Estates",
      rating: 5
    },
    {
      quote: "The workload-based auto-routing balances leads between our agents organically, ensuring zero inquiry leakage under high volumes.",
      author: "Rajesh Malhotra",
      role: "CEO & Founder",
      company: "DLF Premium Builders",
      rating: 5
    }
  ];

  const faqItems = [
    {
      question: "How long is the personalized demo?",
      answer: "A standard PropX demo runs for 30 minutes. We tailor the session to focus on your specific operational requirements: layout mapping, WhatsApp webhook automation, or HubSpot synchronizations."
    },
    {
      question: "Is there a free trial option available?",
      answer: "Yes! After the initial product walk-through consultation, we can provision a 14-day fully featured sandbox instance for your organization to test workflows locally."
    },
    {
      question: "Can I invite my sales team members to the demo?",
      answer: "Absolutely! We encourage you to invite your sales managers, marketing leads, and database administrators so we can address cross-functional questions."
    },
    {
      question: "Does the platform integrate with Salesforce or HubSpot?",
      answer: "Yes, PropX supports a native one-way integration with HubSpot CRM. Custom Salesforce and enterprise API webhook dispatches are fully configured on our Enterprise tier."
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
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black text-blue-400 tracking-wider uppercase w-fit">
              <Sparkles size={11} className="animate-pulse" />
              <span>Interactive Telemetry</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              See PropX in<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                action.
              </span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-semibold">
              Book a personalized demo and discover how AI can help your real estate business qualify leads, automate sales workflows, optimize inventory, and increase conversions.
            </p>
            
            {/* Benefits checks list */}
            <div className="space-y-3 pt-2">
              {[
                "Deploy AI conversational qualification blueprints",
                "Integrate Meta WhatsApp webhooks within 24 hours",
                "Automate workload assignments and CRM synchronization",
                "Inspect visual real-time heat maps of unit reservations"
              ].map((ben, i) => (
                <div key={i} className="flex items-center space-x-2.5 text-xs font-semibold text-slate-300">
                  <CheckCircle size={14} className="text-blue-400 shrink-0" />
                  <span>{ben}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <a 
                href="#demo-form"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
              >
                <span>Book Demo Now</span>
                <ArrowRight size={13} />
              </a>
              <button 
                onClick={() => setIsLoggingIn(true)}
                className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all"
              >
                <span>Watch Product Video</span>
                <Play size={10} className="text-blue-400 fill-blue-400/20" />
              </button>
            </div>
          </div>

          <Dashboard3D />
        </div>

        {/* Brand Logos Slider */}
        <div className="space-y-6 py-6 border-y border-white/5 bg-white/[0.01] backdrop-blur-[5px] rounded-3xl text-center select-none overflow-hidden relative">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">
            Trusted by Leading Developers & Builders
          </span>
          <div className="flex justify-center items-center gap-12 flex-wrap opacity-50 grayscale hover:opacity-75 transition-opacity">
            <span className="text-xs font-black tracking-tight text-white">SKYLINE GROUP</span>
            <span className="text-xs font-black tracking-tight text-white">PRESTIGE ESTATES</span>
            <span className="text-xs font-black tracking-tight text-white">DLF HOMES</span>
            <span className="text-xs font-black tracking-tight text-white">SOBHA DEVELOPERS</span>
            <span className="text-xs font-black tracking-tight text-white">LODHA GROUP</span>
          </div>
        </div>

        {/* Core Layout Split: Form & Right Dashboard Info */}
        <div id="demo-form" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-6">
          
          {/* Form left Column */}
          <div className="lg:col-span-7">
            <GlassCard width="100%" className="relative">
              <h2 className="text-base font-black text-white text-left mb-1">Request a Consultation</h2>
              <p className="text-[10px] text-slate-400 font-semibold text-left mb-6">
                Fill out the specifications below to schedule your personalized live demo.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
                {error && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-400 text-xs font-semibold">
                    {error}
                  </div>
                )}
                {/* 2-column fields row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      {...register('fullName')}
                      className={`w-full px-4 py-3 rounded-xl border bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold ${
                        errors.fullName ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.fullName && (
                      <span className="text-[9px] text-rose-400 font-bold block mt-1">{errors.fullName.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      {...register('companyName')}
                      className={`w-full px-4 py-3 rounded-xl border bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold ${
                        errors.companyName ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10'
                      }`}
                      placeholder="Skyline Group"
                    />
                    {errors.companyName && (
                      <span className="text-[9px] text-rose-400 font-bold block mt-1">{errors.companyName.message}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Business Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full px-4 py-3 rounded-xl border bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold ${
                        errors.email ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10'
                      }`}
                      placeholder="john@company.com"
                    />
                    {errors.email && (
                      <span className="text-[9px] text-rose-400 font-bold block mt-1">{errors.email.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      {...register('phone')}
                      className={`w-full px-4 py-3 rounded-xl border bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold ${
                        errors.phone ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10'
                      }`}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && (
                      <span className="text-[9px] text-rose-400 font-bold block mt-1">{errors.phone.message}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      {...register('country')}
                      className={`w-full px-4 py-3 rounded-xl border bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold ${
                        errors.country ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10'
                      }`}
                      placeholder="India"
                    />
                    {errors.country && (
                      <span className="text-[9px] text-rose-400 font-bold block mt-1">{errors.country.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Organization Size
                    </label>
                    <select
                      {...register('orgSize')}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    >
                      <option>1-10 employees</option>
                      <option>10-50 employees</option>
                      <option>50-250 employees</option>
                      <option>250+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Role / Designation
                    </label>
                    <select
                      {...register('role')}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    >
                      <option>Founder / CEO</option>
                      <option>Sales Director</option>
                      <option>Sales Manager / Agent</option>
                      <option>Marketing Director</option>
                      <option>Investor / Consultant</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      How many active projects do you manage?
                    </label>
                    <select
                      {...register('projects')}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    >
                      <option>1-5 active projects</option>
                      <option>5-15 active projects</option>
                      <option>15+ active projects</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Preferred Demo Date
                    </label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-4 top-3.5 text-slate-500" />
                      <input
                        type="date"
                        {...register('preferredDate')}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-semibold ${
                          errors.preferredDate ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10'
                        }`}
                      />
                    </div>
                    {errors.preferredDate && (
                      <span className="text-[9px] text-rose-400 font-bold block mt-1">{errors.preferredDate.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Preferred Time Slot
                    </label>
                    <div className="relative">
                      <Clock size={13} className="absolute left-4 top-3.5 text-slate-500" />
                      <input
                        type="time"
                        {...register('preferredTime')}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-semibold ${
                          errors.preferredTime ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10'
                        }`}
                      />
                    </div>
                    {errors.preferredTime && (
                      <span className="text-[9px] text-rose-400 font-bold block mt-1">{errors.preferredTime.message}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Special Message or Request
                  </label>
                  <textarea
                    {...register('message')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold resize-none"
                    placeholder="Describe specific layout tracking or integrations you are looking to address..."
                  />
                </div>

                {/* Agreement Checkbox */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 py-1 select-none">
                    <input
                      type="checkbox"
                      id="agreed"
                      {...register('agreed')}
                      className="w-3.5 h-3.5 accent-blue-500 rounded border-white/10 bg-white/5 cursor-pointer"
                    />
                    <label htmlFor="agreed" className="text-[10px] font-bold text-slate-300 cursor-pointer">
                      I agree to the Privacy Policy and terms of data storage.
                    </label>
                  </div>
                  {errors.agreed && (
                    <span className="text-[9px] text-rose-400 font-bold block">{errors.agreed.message}</span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse" />
                  <div className="relative px-5 py-3.5 rounded-[11px] bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-extrabold text-center transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                    {loading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="animate-spin" size={13} />
                        <span>Scheduling Consultation...</span>
                      </span>
                    ) : (
                      'Book My Demo'
                    )}
                  </div>
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Right info Column */}
          <div className="lg:col-span-5 text-left space-y-6">
            <GlassCard width="100%" className="space-y-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Sparkles size={14} className="animate-pulse" />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Floating AI Analytics</h3>
              <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                PropX is equipped with live analytical pipelines that trace lead metrics, revenue aggregations, and layout configurations.
              </p>
              
              <div className="border-t border-white/5 pt-4 space-y-3 text-[10px] font-bold text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Structured Inquiries processed today</span>
                  <span className="text-blue-400 font-extrabold">+1,240</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>AI Sentiment Score accuracy</span>
                  <span className="text-indigo-400 font-extrabold">98.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SLA Response threshold lag</span>
                  <span className="text-cyan-400 font-extrabold">&lt; 2 mins</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard width="100%" className="space-y-4 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShieldCheck size={14} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Enterprise Security</h3>
              <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                All customer data telemetry is isolated at the database layer using secure multi-tenant PostgreSQL schemes.
              </p>
            </GlassCard>
          </div>

        </div>

        {/* Why Book A Demo - 4 premium cards */}
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Why Schedule a Consultation?</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
              Our integration engineers will build a custom blueprint tailored to your active real estate projects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "AI Lead Qualification", desc: "Extract budget brackets, timelines, and intent segment targets contextually.", icon: Sparkles },
              { title: "WhatsApp Automation", desc: "Ingest client threads straight from WhatsApp Graph API webhook triggers.", icon: MessageSquare },
              { title: "CRM Integration", desc: "Sync qualified pipeline metrics directly into HubSpot or Salesforce systems.", icon: Sliders },
              { title: "Live Analytics", desc: "Analyze campaign conversions, response lags, and reservations listings.", icon: Globe }
            ].map((card, i) => (
              <GlassCard key={i} width="100%" className="text-left space-y-4 hover:border-white/20 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                  <card.icon size={15} />
                </div>
                <h3 className="text-xs font-black text-white">{card.title}</h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{card.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Client Testimonials */}
        <Testimonials items={testimonialItems} />

        {/* Accordion FAQs */}
        <FAQ items={faqItems} />

      </main>

      {/* Success Popup Modal */}
      <AnimatePresence>
        {formSubmitted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-md pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative pointer-events-auto"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <GlassCard width="440px" className="text-center p-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce mb-2">
                    <CheckCircle size={28} />
                  </div>

                  <h3 className="text-lg font-black text-white">Thank you!</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Our team will contact you within 24 hours to confirm your personalized demo slot.
                  </p>

                  <div className="flex gap-4 w-full pt-4">
                    <Link
                      to="/login"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg text-center hover:scale-[1.02] transition-transform"
                    >
                      Back to Home
                    </Link>
                    <Link
                      to="/product"
                      className="flex-1 bg-white/5 border border-white/10 text-white font-extrabold text-xs py-3 rounded-xl text-center hover:bg-white/10 transition-colors"
                    >
                      Explore Product
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LoginModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />
      <Footer isLoggingIn={isLoggingIn} />
    </motion.div>
  );
};
export default BookDemo;
