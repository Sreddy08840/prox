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
  PieChart,
  Pie,
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

  const { kpis, leadTrend, leadFunnel, leadSources, demandHeatmap, recentActivities } = data;

  // Chart Color Palettes
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#6366f1'];
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2">
            <Sparkles className="text-primary animate-pulse" size={28} />
            <span>Executive Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time analytics, conversation insights, and lead pipeline intelligence.
          </p>
        </div>
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center space-x-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm shrink-0"
        >
          <span>Manage Pipeline</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* KPI Stats Grid Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Leads */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Inquiries</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-foreground">{kpis.totalLeads}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Leads registered in CRM</p>
          </div>
        </div>

        {/* Qualified Leads */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Qualified Stage</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-foreground">{kpis.qualifiedLeads}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Verified buying requirements</p>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">AI Hot Leads</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
              <Flame size={16} className="animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-foreground">{kpis.hotLeads}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Immediate closing intent</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-foreground">{kpis.conversionRate}%</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Won deals out of total leads</p>
          </div>
        </div>

        {/* Response Time */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Response Time</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight text-foreground">{kpis.responseTimeMin}m</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Average agent reply duration</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Trend AreaChart */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Leads Generation Trend</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Daily customer inquiries volume over the last 30 days.</p>
          </div>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Funnel BarChart */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Sales Funnel Conversion</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Volume of leads currently in each pipeline phase.</p>
          </div>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadFunnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="stage" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {leadFunnel.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Sources and Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PieChart: Lead Sources */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Acquisition Channels</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Inquiry sources distribution details.</p>
          </div>
          <div className="h-56 relative flex items-center justify-center text-xs mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="source"
                >
                  {leadSources.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Legends list */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-2 text-[10px] font-semibold text-muted-foreground">
            {leadSources.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>
                  {item.source} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap/BarChart: Demand Heatmap */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">Pricing & Budget Heatmap</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Budget segment inquiries representing customer affordability brackets.</p>
          </div>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={demandHeatmap} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
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
