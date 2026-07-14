import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import PricingCard from '../components/PricingCard';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';

export const Pricing: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Pricing rates
  const starterPrice = billingCycle === 'yearly' ? '₹14,999' : '₹18,999';
  const growthPrice = billingCycle === 'yearly' ? '₹39,999' : '₹49,999';
  const enterprisePrice = 'Custom';

  const faqItems = [
    {
      question: "How do AI credits work on the platform?",
      answer: "Each message qualification and transcript parsing consumes 1 AI Credit. Growth plan includes 25,000 monthly credits. Additional credits can be purchased as add-ons starting at ₹500 per 1,000 credits."
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

  const plans = [
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

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 lg:px-16 pt-32 pb-24 space-y-20 z-20">
        {/* Header Hero Section */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Simple pricing that scales<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              with your business.
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Choose a plan that matches your real estate team's pipeline volume. Save 20% with annual billing.
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="flex items-center justify-center pt-4">
            <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-full p-1 w-64 select-none">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  billingCycle === 'monthly' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all relative ${
                  billingCycle === 'yearly' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Yearly</span>
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-normal">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 items-stretch">
          {plans.map((plan, idx) => (
            <PricingCard
              key={idx}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              ctaText={plan.ctaText}
              isPopular={plan.isPopular}
              onCtaClick={() => setIsLoggingIn(true)}
              delay={idx * 0.08}
            />
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="pt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-black text-white">Compare Plan Specifications</h2>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Detailed feature breakdown across plan Tiers</p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-md">
            <table className="w-full text-left border-collapse text-[10px] font-bold text-slate-300">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4.5 font-black text-white uppercase tracking-wider">Features</th>
                  <th className="p-4.5 font-black text-white uppercase tracking-wider text-center">Starter</th>
                  <th className="p-4.5 font-black text-white uppercase tracking-wider text-center">Growth</th>
                  <th className="p-4.5 font-black text-white uppercase tracking-wider text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Active Projects Mapping", starter: "Up to 2", growth: "Up to 10", enterprise: "Unlimited" },
                  { name: "Included User Licenses", starter: "5 seats", growth: "20 seats", enterprise: "Unlimited" },
                  { name: "Monthly AI Credits", starter: "5,000", growth: "25,000", enterprise: "Custom Allocation" },
                  { name: "Negotiation Copilot Suggestions", starter: "✕", growth: "✓", enterprise: "✓" },
                  { name: "HubSpot CRM Integration", starter: "✕", growth: "✓", enterprise: "✓" },
                  { name: "Custom Outbound Webhooks", starter: "✕", growth: "✕", enterprise: "✓" },
                  { name: "SSO / SAML Security Login", starter: "✕", growth: "✕", enterprise: "✓" },
                  { name: "Support Channels", starter: "Email (24h)", growth: "Priority Chat (2h)", enterprise: "Dedicated Manager" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4.5 font-black text-white">{row.name}</td>
                    <td className="p-4.5 text-center">{row.starter}</td>
                    <td className="p-4.5 text-center text-blue-400 font-extrabold">{row.growth}</td>
                    <td className="p-4.5 text-center">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <FAQ items={faqItems} />

        {/* Action CTA Section */}
        <CTA
          title="Looking for tailored capabilities?"
          description="We work with large real estate development firms globally to support SAML/SSO setups, dedicated DB architectures, and custom workflows."
          primaryText="Schedule Consultation"
          secondaryText="View Feature Blueprints"
          onPrimaryClick={() => setIsLoggingIn(true)}
        />
      </main>

      <LoginModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />
      <Footer isLoggingIn={isLoggingIn} />
    </motion.div>
  );
};
export default Pricing;
