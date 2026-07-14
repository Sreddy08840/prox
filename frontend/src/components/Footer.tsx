import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Mail, Send, Loader2, 
  ChevronDown, Heart, Play
} from 'lucide-react';
import { 
  FaLinkedin, FaGithub, FaInstagram, FaYoutube, FaTwitter 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GlassCard from './GlassCard';

interface FooterProps {
  isLoggingIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isLoggingIn }) => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleToggleAccordion = (title: string) => {
    setActiveAccordion(activeAccordion === title ? null : title);
  };

  const handleSubscribeNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    setTimeout(() => {
      setNewsletterLoading(false);
      setNewsletterSuccess(true);
      setNewsletterEmail('');
    }, 1200);
  };

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "AI Lead Qualification", to: "/product" },
        { label: "CRM", to: "/" },
        { label: "Sales Automation", to: "/product" },
        { label: "WhatsApp", to: "/product" },
        { label: "Demand Intelligence", to: "/solutions" },
        { label: "Portfolio Dashboard", to: "/product" },
        { label: "Pricing Intelligence", to: "/pricing" },
        { label: "Inventory Management", to: "/product" },
        { label: "Analytics", to: "/product" }
      ]
    },
    {
      title: "Solutions",
      links: [
        { label: "For Developers", to: "/solutions" },
        { label: "For Builders", to: "/solutions" },
        { label: "For Brokerages", to: "/solutions" },
        { label: "For Investors", to: "/solutions" },
        { label: "Enterprise", to: "/solutions" },
        { label: "Marketing Teams", to: "/solutions" },
        { label: "Sales Teams", to: "/solutions" },
        { label: "PropTech", to: "/solutions" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", to: "/resources" },
        { label: "API Reference", to: "/resources" },
        { label: "Blog & Blueprints", to: "/resources" },
        { label: "Help Center", to: "/resources" },
        { label: "Case Studies", to: "/resources" },
        { label: "Webinars", to: "/resources" },
        { label: "Release Notes", to: "/resources" },
        { label: "Community", to: "/resources" },
        { label: "System Status", to: "/resources" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", to: "/company" },
        { label: "Careers & Jobs", to: "/company" },
        { label: "Partners", to: "/company" },
        { label: "Contact Sales", to: "/book-demo" },
        { label: "Press Room", to: "/company" },
        { label: "Privacy Policy", to: "/company" },
        { label: "Terms of Use", to: "/company" },
        { label: "Security Schema", to: "/company" },
        { label: "Cookie Policy", to: "/company" }
      ]
    }
  ];

  return (
    <motion.footer
      className="relative z-30 bg-[#050B1F] border-t border-white/5 pt-16 pb-8 px-6 lg:px-16 overflow-hidden w-full select-none"
      animate={{
        opacity: isLoggingIn ? 0 : 1,
        y: isLoggingIn ? 80 : 0,
        height: isLoggingIn ? 0 : 'auto',
      }}
      transition={{
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Background visual components */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft blue glow bottom-center */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[250px] rounded-full bg-blue-600/10 blur-[130px]" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Cinematic noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 space-y-16">
        
        {/* 1. TOP CTA SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard width="100%" className="py-10 px-6 md:py-12 md:px-10 text-center">
            <div className="max-w-2xl mx-auto space-y-5">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Ready to transform your real estate business?
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                See how PropX helps developers qualify leads, automate sales, and maximize revenue using AI.
              </p>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3.5 justify-center pt-3">
                <Link
                  to="/book-demo"
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all hover:scale-[1.02]"
                >
                  <span>Book a Demo</span>
                  <ArrowRight size={12} />
                </Link>

                <Link
                  to="/pricing"
                  className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all hover:scale-[1.02]"
                >
                  <span>Start Free Trial</span>
                </Link>

                <Link
                  to="/product"
                  className="flex items-center space-x-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all hover:scale-[1.02]"
                >
                  <Play size={10} className="text-blue-400 fill-blue-400/20 mr-1" />
                  <span>Watch Demo</span>
                </Link>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* 2. MAIN FOOTER COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-8 pt-6">
          
          {/* Brand Info Column */}
          <div className="lg:col-span-4 text-left space-y-4 md:pr-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white">
                P
              </div>
              <span className="text-base font-black text-white tracking-tight">PropX</span>
            </div>

            <p className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest leading-none">
              AI-Native Real Estate Intelligence
            </p>

            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Build Smarter.<br />
              Sell Strategically.<br />
              Stay in Control.
            </p>

            {/* Social Icons row */}
            <div className="flex items-center space-x-4 pt-2">
              {[
                { icon: FaLinkedin, url: "https://linkedin.com", color: "hover:text-[#0A66C2]" },
                { icon: FaTwitter, url: "https://twitter.com", color: "hover:text-[#1DA1F2]" },
                { icon: FaYoutube, url: "https://youtube.com", color: "hover:text-[#FF0000]" },
                { icon: FaInstagram, url: "https://instagram.com", color: "hover:text-[#E1306C]" },
                { icon: FaGithub, url: "https://github.com", color: "hover:text-[#F0F6FC]" }
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-slate-500 transition-all duration-300 transform hover:scale-115 ${item.color}`}
                >
                  <item.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns (Responsive Grid & Accordion) */}
          <div className="md:col-span-2 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {footerLinks.map((col, idx) => (
              <div key={idx} className="space-y-3.5">
                
                {/* Desktop Header */}
                <h3 className="hidden sm:block text-[10px] font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">
                  {col.title}
                </h3>

                {/* Mobile Accordion Header */}
                <button
                  onClick={() => handleToggleAccordion(col.title)}
                  className="sm:hidden w-full flex items-center justify-between py-2.5 border-b border-white/5 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none"
                >
                  <span>{col.title}</span>
                  <ChevronDown 
                    size={12} 
                    className={`text-slate-500 transition-transform ${
                      activeAccordion === col.title ? 'rotate-180 text-blue-400' : ''
                    }`} 
                  />
                </button>

                {/* Desktop Link list / Mobile Collapsible */}
                <div className={`sm:block ${activeAccordion === col.title ? 'block' : 'hidden'}`}>
                  <ul className="space-y-2 pt-1.5 sm:pt-0">
                    {col.links.map((link, i) => (
                      <li key={i}>
                        <Link
                          to={link.to}
                          className="text-[10px] font-bold text-slate-400 hover:text-blue-400 transition-colors block py-0.5"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* 3. NEWSLETTER SECTION */}
        <div className="pt-6">
          <GlassCard width="100%" className="py-6 px-6 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              <div className="space-y-1.5">
                <span className="flex items-center space-x-1.5 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  <Mail size={11} className="animate-pulse" />
                  <span>Stay Updated</span>
                </span>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Get weekly AI insights, product updates, and developer blueprints delivered straight to your inbox.
                </p>
              </div>

              {/* Input Form */}
              <div className="w-full md:w-fit shrink-0">
                {newsletterSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-xl text-center"
                  >
                    ✓ Newsletter subscription completed! Thank you.
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribeNewsletter} className="flex gap-2 w-full md:w-80">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={e => setNewsletterEmail(e.target.value)}
                      placeholder="Enter work email"
                      className="w-full px-3.5 py-2 rounded-lg border border-white/10 bg-white/5 text-[10px] text-white focus:outline-none focus:border-blue-500 transition-all font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={newsletterLoading}
                      className="flex items-center justify-center space-x-1.5 bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-[10px] px-4 py-2 rounded-lg transition-all hover:scale-[1.02] shrink-0 disabled:opacity-50"
                    >
                      {newsletterLoading ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <Send size={9} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 4. BOTTOM BAR */}
        <div className="pt-8 border-t border-white/5 text-slate-500 text-[9px] font-bold">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <span>© 2026 PropX. All Rights Reserved.</span>

            {/* Credit */}
            <span className="flex items-center">
              Made with <Heart size={10} className="text-rose-500 mx-1 fill-rose-500 animate-pulse" /> in India
            </span>

            {/* Secondary footer links */}
            <div className="flex space-x-3 pointer-events-auto">
              <Link to="/company" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link to="/company" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link to="/company" className="hover:text-slate-300 transition-colors">Cookies</Link>
              <Link to="/company" className="hover:text-slate-300 transition-colors">Security</Link>
              <Link to="/resources" className="hover:text-slate-300 transition-colors">Status</Link>
            </div>
            
          </div>
        </div>

      </div>
    </motion.footer>
  );
};
export default Footer;
