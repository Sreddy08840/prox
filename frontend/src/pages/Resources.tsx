import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import BlogCard from '../components/BlogCard';
import Newsletter from '../components/Newsletter';
import GlassCard from '../components/GlassCard';

export const Resources: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'AI Integration', 'Sales Strategy', 'Guides & Manuals', 'Case Studies'];

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
    },
    {
      title: "Case Study: How Skyline Properties reduced lead response time by 91%",
      description: "Skyline Properties integrated automated Meta WhatsApp webhooks to achieve sub-minute response SLA checkmarks.",
      category: "Case Studies",
      date: "May 29, 2026",
      readTime: "9 min read",
      imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"
    }
  ];

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          blog.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || blog.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 lg:px-16 pt-32 pb-24 space-y-16 z-20">
        {/* Header Hero Section */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Insights, guides and tools for<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              modern real estate teams.
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            Read professional analyses on qualification algorithms, WhatsApp webhook workflows, and CRM setup strategies.
          </p>

          {/* Search bar & Categories filter */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 max-w-xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-4 top-3.5 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Search articles, guides, case studies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2.5 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                activeCategory === cat
                  ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Large Featured Article */}
        {searchQuery === '' && activeCategory === 'All' && (
          <div className="pt-6">
            <GlassCard width="100%" className="overflow-hidden p-0 group">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-7 h-64 lg:h-96 relative border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
                    alt="Featured Article Banner"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 brightness-75"
                  />
                  <span className="absolute top-4 left-4 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg">
                    Featured Blueprint
                  </span>
                </div>
                <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between text-left space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-[9px] text-slate-500 font-bold">
                      <span>Jul 14, 2026</span>
                      <span>•</span>
                      <span>15 min read</span>
                    </div>

                    <h2 className="text-lg md:text-xl font-black text-white leading-snug group-hover:text-blue-400 transition-colors">
                      Unveiling the PropX AI Qualification Engine: Architecture & Inferences
                    </h2>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      An in-depth architectural teardown of how we parse Meta Graph WhatsApp messaging JSON trees, trigger custom Anthropic Claude 3.5 prompts, extract parameters (budget, timeline, intent), and update schema entities transactionally.
                    </p>
                  </div>

                  <button 
                    onClick={() => setIsLoggingIn(true)}
                    className="flex items-center space-x-2.5 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-all w-fit"
                  >
                    <span>Read Blueprint Article</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Resources Cards Grid */}
        <div className="space-y-8 pt-8">
          <div className="text-left border-b border-white/5 pb-4">
            <h2 className="text-base font-black text-white uppercase tracking-wider">Blueprints & Articles</h2>
          </div>

          {filteredBlogs.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-white/10 text-xs text-slate-500 font-semibold">
              No resources found matching the query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBlogs.map((blog, idx) => (
                <BlogCard
                  key={idx}
                  title={blog.title}
                  description={blog.description}
                  category={blog.category}
                  date={blog.date}
                  readTime={blog.readTime}
                  imageUrl={blog.imageUrl}
                  delay={idx * 0.08}
                />
              ))}
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <Newsletter />
      </main>

      <LoginModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />
      <Footer isLoggingIn={isLoggingIn} />
    </motion.div>
  );
};
export default Resources;
