import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Users,
  Flame,
  Award,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Activity,
  FileText,
  Building2,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface KPIStats {
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  conversionRate: number;
  responseTimeMin: number;
}

interface TrendData {
  date: string;
  leads: number;
}

interface FunnelData {
  stage: string;
  count: number;
}

interface SourceData {
  source: string;
  count: number;
}

interface HeatmapData {
  name: string;
  count: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  leadName: string;
  leadId: string;
}

interface DashboardData {
  kpis: KPIStats;
  alerts?: { warning: boolean; message: string | null };
  leadTrend: TrendData[];
  leadFunnel: FunnelData[];
  leadSources: SourceData[];
  demandHeatmap: HeatmapData[];
  recentActivities: RecentActivity[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Weekly Export Report States
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportReport = async () => {
    setExporting(true);
    setExportSuccess(null);
    setExportError(null);
    try {
      const res = await api.post('/dashboard/export-report');
      if (res.data.success) {
        setExportSuccess(res.data.message);
      }
    } catch (err) {
      setExportError('Failed to trigger weekly summary report export.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/dashboard');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error?.message || 'Failed to load dashboard metrics');
        } else {
          setError('Failed to load dashboard metrics');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm max-w-md mx-auto my-10">
        <AlertCircle className="shrink-0 mt-0.5" size={18} />
        <span>{error || 'Unable to retrieve dashboard stats.'}</span>
      </div>
    );
  }

  const { kpis, leadTrend, leadFunnel, recentActivities, alerts } = data;

  // Dynamic Pipeline Health Score Calculations
  const calculatePipelineHealth = () => {
    const { totalLeads, qualifiedLeads, hotLeads, conversionRate } = kpis;
    if (totalLeads === 0) {
      return { score: 100, status: 'Excellent', description: 'No pipeline leaks detected. Add new leads to qualify intent.', color: '#10b981' };
    }

    const qualifiedRatio = qualifiedLeads / totalLeads;
    const hotRatio = hotLeads / totalLeads;
    
    // Formula weighting conversion rate, qualified and hot leads
    let scoreVal = Math.round(50 + (conversionRate * 0.3) + (hotRatio * 30) + (qualifiedRatio * 20));
    scoreVal = Math.max(10, Math.min(100, scoreVal));

    let status = 'Fair';
    let description = 'Performance lag warnings. Follow up on contacts and schedule verification site visits.';
    let color = '#f59e0b'; // Amber

    if (scoreVal >= 85) {
      status = 'Excellent';
      description = 'Your pipeline is in pristine condition! High conversion rate and optimal lead follow-up lags.';
      color = '#10b981'; // Emerald
    } else if (scoreVal >= 60) {
      status = 'Good';
      description = 'Your pipeline is healthy! Keep up the good work and follow up on hot stage qualification leads.';
      color = '#10b981'; // Emerald
    } else if (scoreVal >= 40) {
      status = 'Fair';
      description = 'Performance lag warnings. Follow up on contacts and schedule verification site visits.';
      color = '#f59e0b'; // Amber
    } else {
      status = 'Needs Attention';
      description = 'Critical priority breach warnings! High response times and low lead-to-won conversion rates.';
      color = '#ef4444'; // Red
    }

    return { score: scoreVal, status, description, color };
  };

  const health = calculatePipelineHealth();

  // Chart Color Palettes
  const FUNNEL_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#ef4444'];

  const getActivityIcon = (typeStr: string) => {
    switch (typeStr) {
      case 'NOTE':
        return <FileText size={13} />;
      case 'CALL':
        return <Phone size={13} />;
      case 'EMAIL':
        return <Mail size={13} />;
      case 'MEETING':
        return <Calendar size={13} />;
      case 'STATUS_CHANGE':
        return <Activity size={13} className="text-primary" />;
      default:
        return <Sparkles size={13} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SLA Alert banner */}
      {alerts?.warning && (
        <div className="rounded-2xl border border-rose-500/10 bg-gradient-to-r from-rose-500/5 to-rose-500/10 p-5 text-rose-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <div className="flex items-start space-x-3.5 text-sm">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 mt-0.5">
              <AlertCircle size={18} className="animate-pulse" />
            </div>
            <div>
              <strong className="block text-xs uppercase tracking-wider text-rose-800 font-extrabold mb-1">Critical SLA Breach</strong>
              <p className="font-semibold text-xs text-rose-700/90 leading-relaxed">{alerts.message}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/leads')}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 transition-all shadow-sm shrink-0 self-end md:self-center"
          >
            Review Pipeline
          </button>
        </div>
      )}

      {/* Export Success/Error Banner */}
      {exportSuccess && (
        <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 p-4 text-emerald-700 flex items-center space-x-3 text-sm">
          <Sparkles className="shrink-0 text-emerald-500" size={18} />
          <span className="font-bold text-xs">{exportSuccess}</span>
        </div>
      )}
      {exportError && (
        <div className="rounded-2xl border border-destructive/15 bg-gradient-to-r from-destructive/5 to-destructive/10 p-4 text-destructive flex items-center space-x-3 text-sm">
          <AlertCircle className="shrink-0 text-destructive animate-bounce" size={18} />
          <span className="font-bold text-xs">{exportError}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <Sparkles className="text-primary animate-pulse" size={26} />
            <span>Executive Analytics</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Real-time pipeline analytics, conversation insights, and AI qualification metrics.
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            disabled={exporting}
            onClick={handleExportReport}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 rounded-xl border border-input bg-card px-4 py-2.5 text-xs font-bold hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            {exporting ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
            <span>Export Summary Report</span>
          </button>
          <button
            onClick={() => navigate('/leads')}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground hover:bg-primary/95 hover:scale-[1.02] transition-all shadow-md shrink-0"
          >
            <span>Manage Pipeline</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Leads */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">Total Inquiries</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{kpis.totalLeads}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Leads in database</p>
            </div>
            {/* Custom Sparkline SVG */}
            <div className="w-16 h-8 text-blue-500 opacity-80 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 100 30" className="w-full h-full" fill="none">
                <path d="M0,25 Q15,5 30,20 T60,10 T90,5 L100,8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[10px]">
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+12.4%</span>
            <span className="text-muted-foreground font-semibold">vs last month</span>
          </div>
        </div>

        {/* Qualified Stage */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-primary" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">Qualified Stage</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
              <Award size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{kpis.qualifiedLeads}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Verified requirements</p>
            </div>
            <div className="w-16 h-8 text-violet-500 opacity-80 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 100 30" className="w-full h-full" fill="none">
                <path d="M0,20 Q20,10 40,25 T70,5 T100,12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[10px]">
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+8.2%</span>
            <span className="text-muted-foreground font-semibold">vs last month</span>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">AI Hot Leads</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <Flame size={15} className="animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{kpis.hotLeads}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Immediate buyers</p>
            </div>
            <div className="w-16 h-8 text-rose-500 opacity-80 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 100 30" className="w-full h-full" fill="none">
                <path d="M0,10 Q25,25 50,8 T80,22 T100,5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[10px]">
            <span className="text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">-2.1%</span>
            <span className="text-muted-foreground font-semibold">vs last week</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{kpis.conversionRate}%</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Won / total leads</p>
            </div>
            <div className="w-16 h-8 text-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 100 30" className="w-full h-full" fill="none">
                <path d="M0,22 Q30,12 60,18 T100,5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[10px]">
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+4.5%</span>
            <span className="text-muted-foreground font-semibold">vs last month</span>
          </div>
        </div>

        {/* Response Time */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">Response Time</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-foreground">{kpis.responseTimeMin}m</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Average reply lag</p>
            </div>
            <div className="w-16 h-8 text-amber-500 opacity-80 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 100 30" className="w-full h-full" fill="none">
                <path d="M0,5 Q20,25 40,12 T80,18 T100,10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[10px]">
            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">-14.2%</span>
            <span className="text-muted-foreground font-semibold">improvement</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trend AreaChart */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-300 lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">Leads Generation Trend</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Daily customer inquiries volume over the last 30 days.</p>
          </div>
          <div className="h-64 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6D5EF5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6D5EF5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#6D5EF5" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all duration-300 lg:col-span-1">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-foreground flex items-center space-x-2">
                <Sparkles size={16} className="text-primary animate-pulse" />
                <span>AI Insights</span>
              </h3>
              <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer">View all</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Real-time pipeline analysis logs.</p>
          </div>

          <div className="space-y-2.5 my-1">
            {/* Item 1 */}
            <div className="flex items-start justify-between p-2.5 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                  <Users size={14} />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-[11px] text-foreground block leading-tight">AI detected 12 high-intent buyers</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">Ready for immediate follow-up.</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Item 2 */}
            <div className="flex items-start justify-between p-2.5 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                  <TrendingUp size={14} />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-[11px] text-foreground block leading-tight">Response time improved</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">24% faster than yesterday.</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Item 3 */}
            <div className="flex items-start justify-between p-2.5 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                  <Building2 size={14} />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-[11px] text-foreground block leading-tight">Luxury apartments demand</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">is rising in Project Skyline.</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>

            {/* Item 4 */}
            <div className="flex items-start justify-between p-2.5 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-[11px] text-foreground block leading-tight">Project Green Valley metrics</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">may require price corrections (-3% to -5%).</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Sales Funnel & Pipeline Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Funnel BarChart */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-300 lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">Sales Funnel Conversion</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Volume of leads currently in each pipeline phase.</p>
          </div>
          <div className="h-64 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadFunnel} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="stage" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px' }}
                  cursor={{ fill: 'rgba(109, 94, 245, 0.03)' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {leadFunnel.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Health Score Card */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all duration-300 lg:col-span-1">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Pipeline Health Score</h3>
              <div className="p-1 rounded bg-muted text-muted-foreground">
                <HelpCircle size={14} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Automated deal scoring health meter.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
            {/* SVG Donut gauge */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" stroke="var(--muted)" strokeWidth="8" fill="transparent" />
                {/* Progress circle */}
                <circle cx="50" cy="50" r="40" stroke={health.color} strokeWidth="8" fill="transparent"
                  strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * health.score) / 100}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{health.score}</span>
                <span className="text-[9px] uppercase font-extrabold" style={{ color: health.color }}>{health.status}</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                {health.description}
              </p>
              <span className="text-[10px] text-primary font-bold hover:underline cursor-pointer flex items-center space-x-1">
                <span>View full analysis</span>
                <ChevronRight size={10} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity Log */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="font-bold text-sm text-foreground">Recent Pipeline Activity</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Live CRM logs and AI recalculations tracking.</p>
          </div>
          <div className="p-1.5 rounded bg-muted text-muted-foreground">
            <Activity size={15} />
          </div>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground font-semibold">
            No pipeline events registered yet.
          </div>
        ) : (
          <div className="relative border-l border-primary/20 ml-3 pl-6 space-y-5 py-1">
            {recentActivities.map((act) => (
              <div key={act.id} className="relative group flex items-start justify-between gap-4">
                {/* Timeline circle dot */}
                <span className="absolute -left-[31px] top-0.5 p-1 rounded-full bg-background border-2 border-primary text-primary shrink-0 transition-transform group-hover:scale-110">
                  {getActivityIcon(act.type)}
                </span>

                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span
                      onClick={() => navigate(`/leads/${act.leadId}`)}
                      className="font-extrabold text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {act.leadName}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {new Date(act.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
