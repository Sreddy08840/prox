import React, { useState } from 'react';
import { 
  Sparkles, Users, MessageSquare, Building2, TrendingUp, 
  Sliders, ArrowRight, Building, Hammer, Network, 
  CheckCircle, Loader2 
} from 'lucide-react';
import api from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Dashboard3D from '../components/Dashboard3D';
import FeatureCard from '../components/FeatureCard';
import PricingCard from '../components/PricingCard';
import FAQ from '../components/FAQ';
import Stats from '../components/Stats';
import Timeline from '../components/Timeline';
import TeamCard from '../components/TeamCard';
import BlogCard from '../components/BlogCard';
import Newsletter from '../components/Newsletter';
import Testimonials from '../components/Testimonials';
import LoginModal from '../components/LoginModal';
import Footer from '../components/Footer';

export const Landing: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Book Demo Form State
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoForm, setDemoForm] = useState({
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
    message: ''
  });

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoLoading(true);
    setDemoError(null);
    try {
      await api.post('/auth/book-demo', demoForm);
      setDemoSubmitted(true);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setDemoError(err.response?.data?.error?.message || 'Failed to schedule demo request.');
    } finally {
      setDemoLoading(false);
    }
  };

  // Product Features Data
  const productFeatures = [
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

  // Solutions Data
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
    }
  ];

  // Pricing Data
  const starterPrice = billingCycle === 'yearly' ? '₹14,999' : '₹18,999';
  const growthPrice = billingCycle === 'yearly' ? '₹39,999' : '₹49,999';
  const enterprisePrice = 'Custom';

  const pricingPlans = [
    {
      name: "Starter Plan",
      price: starterPrice,
      period: billingCycle === 'yearly' ? '/month, billed yearly' : '/month',
      description: "Essential CRM qualification for small real estate developer teams.",
      features: [
        "Up to 2 Active Projects",
        "5 User Licenses included",
        "5,000 AI Qualification Credits",
        "Meta WhatsApp API Webhook Ingestion",
        "Workload Lead Auto-Router",
        "Basic Analytics Charts",
        "10GB Document Storage",
        "Email Support (24h turnaround)"
      ],
      ctaText: "Start Free Trial",
      isPopular: false
    },
    {
      name: "Growth Plan",
      price: growthPrice,
      period: billingCycle === 'yearly' ? '/month, billed yearly' : '/month',
      description: "Scale leads qualification, automations, and CRM integrations.",
      features: [
        "Up to 10 Active Projects",
        "20 User Licenses included",
        "25,000 AI Qualification Credits",
        "Negotiation Copilot suggestions",
        "HubSpot CRM One-way synchronizer",
        "Automated layout brochure emailing",
        "50GB Document Storage",
        "Priority Support (2h turnaround)"
      ],
      ctaText: "Book Demo",
      isPopular: true
    },
    {
      name: "Enterprise",
      price: enterprisePrice,
      period: "for custom requirements",
      description: "Tailored security, custom AI prompt configurations, and dedicated SLA APIs.",
      features: [
        "Unlimited Projects & Layouts",
        "Unlimited User Seats",
        "Custom AI Prompt personas config",
        "Custom outbound webhooks dispatch",
        "Dedicated database instance",
        "Single Sign-On (SAML/SSO)",
        "SLA Uptime Guarantee (99.9%)",
        "Dedicated Account Executive Support"
      ],
      ctaText: "Contact Sales",
      isPopular: false
    }
  ];

  const faqItems = [
    {
      question: "How do AI credits work on the platform?",
      answer: "Each message qualification and transcript parsing consumes 1 AI Credit. Growth plan includes 25,000 monthly credits. Additional credits can be purchased starting at ₹500 per 1,000 credits."
    },
    {
      question: "What is the WhatsApp Business API setup process?",
      answer: "PropX provides a guided setup wizard to verify your Meta Business Manager portfolio. We help you generate system access tokens, configure incoming webhook URLs, and get template approvals within 24-48 hours."
    },
    {
      question: "Can we integrate existing CRM tools like HubSpot?",
      answer: "Yes, our Growth and Enterprise plans include a one-click HubSpot integration to sync qualified lead details. Enterprise plan also supports customized outgoing webhooks mapping to arbitrary server endpoints."
    },
    {
      question: "Is there a limit on the number of real estate projects we can map?",
      answer: "The Starter plan includes 2 active projects, while the Growth plan includes up to 10 active projects. The Enterprise plan includes unlimited projects and floorplan visualization layers."
    }
  ];

  // Blog / Resource Articles
  const blogs = [
    {
      title: "Optimizing WhatsApp Inquiries for Higher Real Estate Conversions",
      description: "How automated lead qualifications shorten contact cycles and prevent valuable real estate deals from leaking.",
      category: "Sales Strategy",
      date: "Jul 12, 2026",
      readTime: "5 min read",
      imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80"
    },
    {
      title: "The Developer's Guide to Building Multi-Tenant schema isolation models",
      description: "A deep dive into clean application architecture layouts using Prisma client engines for PostgreSQL databases.",
      category: "AI Integration",
      date: "Jun 28, 2026",
      readTime: "12 min read",
      imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80"
    },
    {
      title: "Scaling Real Estate Conversions with Workload Lead Routing",
      description: "Why static lead assignment models fail under scaling demand and how to implement active load metrics limits.",
      category: "Sales Strategy",
      date: "Jun 14, 2026",
      readTime: "7 min read",
      imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=400&q=80"
    }
  ];

  // Company Data
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

  return (
    <div className="relative min-h-screen w-full bg-[#050B1F] text-slate-100 font-sans scroll-smooth">
      {/* Optimized GPU Background component */}
      <AnimatedBackground isLoggingIn={isLoggingIn} />

      {/* Floating Header Navigation */}
      <Navbar onLoginClick={() => setIsLoggingIn(true)} isLoggingIn={isLoggingIn} />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO SECTION (#hero) */}
      {/* ========================================================================= */}
      <section id="hero" className="relative z-20 pt-28 pb-20 max-w-7xl mx-auto px-6 lg:px-16 min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          <Hero isLoggingIn={isLoggingIn} onLoginClick={() => setIsLoggingIn(true)} />
          <Dashboard3D isLoggingIn={isLoggingIn} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: PRODUCT SECTION (#product) */}
      {/* ========================================================================= */}
      <section id="product" className="relative z-20 py-24 border-t border-white/5 bg-[#050B1F]/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Everything you need to <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                sell real estate smarter.
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              PropX combines AI, CRM, WhatsApp automation, inventory management, demand intelligence, analytics and sales automation into one powerful platform for real estate developers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productFeatures.map((feat, index) => (
              <FeatureCard key={index} {...feat} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: SOLUTIONS SECTION (#solutions) */}
      {/* ========================================================================= */}
      <section id="solutions" className="relative z-20 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Tailored Solutions
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Built for every role in <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                real estate developments.
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              Whether you are a Developer, Builder, Sales Director, Marketing Manager, or Investor—PropX scales your sales engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((sol, index) => (
              <FeatureCard key={index} {...sol} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: PRICING SECTION (#pricing) */}
      {/* ========================================================================= */}
      <section id="pricing" className="relative z-20 py-24 border-t border-white/5 bg-[#050B1F]/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-16">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Simple plans for developer <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                teams of any size.
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              Transparent tier pricing with zero hidden fees. Scale AI credits and project capacity as your developments expand.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="inline-flex items-center space-x-3 bg-white/5 p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Yearly</span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} onCtaClick={() => setIsLoggingIn(true)} />
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="pt-12">
            <h3 className="text-2xl font-black text-white text-center mb-8">Frequently Asked Questions</h3>
            <FAQ items={faqItems} />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: RESOURCES SECTION (#resources) */}
      {/* ========================================================================= */}
      <section id="resources" className="relative z-20 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Knowledge Hub
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Insights & Guides for <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                modern real estate leaders.
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              Read our technical breakdowns on AI prompt optimization, WhatsApp Business API setup, and lead routing algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <BlogCard key={index} {...blog} />
            ))}
          </div>

          <Newsletter />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: COMPANY SECTION (#company) */}
      {/* ========================================================================= */}
      <section id="company" className="relative z-20 py-24 border-t border-white/5 bg-[#050B1F]/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Our Story
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Building the future of <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                real estate AI intelligence.
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              PropX is engineered to eliminate real estate lead leakage and automate agent workflows with enterprise reliability.
            </p>
          </div>

          {/* Stats Bar */}
          <Stats items={statsItems} />

          {/* Timeline & Team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Company Milestones</h3>
              <Timeline events={timelineEvents} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Leadership Team</h3>
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <TeamCard key={index} {...member} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: BOOK DEMO SECTION (#book-demo) */}
      {/* ========================================================================= */}
      <section id="book-demo" className="relative z-20 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Schedule Live Demo
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              See PropX in action for <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                your developments.
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-semibold leading-relaxed">
              Schedule a 1-on-1 walkthrough with our platform engineering specialists to discover how PropX optimizes your lead qualifications and layout inventory maps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Column: Demo Highlights */}
            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Sparkles size={18} className="text-blue-400" />
                  <span>What to expect in your demo:</span>
                </h3>
                <ul className="space-y-4 text-xs text-slate-300 font-semibold">
                  <li className="flex items-start space-x-3">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Live walkthrough of Meta WhatsApp webhook auto-creation & AI lead scoring.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Custom interactive inventory mapping setup for your project floor plans.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>HubSpot CRM sync & automated webhook integration review.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Workload-based lead router rule configuration tailored for your sales team.</span>
                  </li>
                </ul>
              </div>

              {/* Customer Testimonials Carousel/Grid */}
              <Testimonials items={testimonialItems} />
            </div>

            {/* Right Column: Book Demo Form */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
              {demoSubmitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Demo Session Requested!</h3>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed max-w-md mx-auto">
                    Thank you! Our technical sales specialist will review your project requirements and confirm the meeting invite shortly via email.
                  </p>
                  <button
                    onClick={() => setDemoSubmitted(false)}
                    className="mt-4 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-2">Request 1-on-1 Demo</h3>

                  {demoError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                      {demoError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={demoForm.fullName}
                        onChange={(e) => setDemoForm({ ...demoForm, fullName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={demoForm.companyName}
                        onChange={(e) => setDemoForm({ ...demoForm, companyName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                        placeholder="Skyline Developers"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Business Email *</label>
                      <input
                        type="email"
                        required
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                        placeholder="john@skylinedev.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preferred Date *</label>
                      <input
                        type="date"
                        required
                        value={demoForm.preferredDate}
                        onChange={(e) => setDemoForm({ ...demoForm, preferredDate: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preferred Time *</label>
                      <input
                        type="time"
                        required
                        value={demoForm.preferredTime}
                        onChange={(e) => setDemoForm({ ...demoForm, preferredTime: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Additional Notes</label>
                    <textarea
                      rows={3}
                      value={demoForm.message}
                      onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold resize-none"
                      placeholder="Specify active project details, unit counts, or special CRM requirement needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={demoLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {demoLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <span>Confirm & Schedule Demo</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sliding Glass Login Modal */}
      <LoginModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />

      {/* Footer */}
      <Footer isLoggingIn={isLoggingIn} />
    </div>
  );
};

export default Landing;
