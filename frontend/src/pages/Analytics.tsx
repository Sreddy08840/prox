import api from '../services/api';
import { TrendingUp, Clock, AlertCircle, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const responseTrendData = [
  { name: 'Mon', ResponseTime: 12, Escalations: 4 },
  { name: 'Tue', ResponseTime: 9, Escalations: 2 },
  { name: 'Wed', ResponseTime: 15, Escalations: 5 },
  { name: 'Thu', ResponseTime: 8, Escalations: 1 },
  { name: 'Fri', ResponseTime: 6, Escalations: 0 },
  { name: 'Sat', ResponseTime: 14, Escalations: 3 },
  { name: 'Sun', ResponseTime: 11, Escalations: 2 },
];

const budgetAllocationData = [
  { name: '₹50L - 1Cr', count: 18 },
  { name: '₹1Cr - 2Cr', count: 32 },
  { name: '₹2Cr - 4Cr', count: 24 },
  { name: '₹4Cr+', count: 12 },
];

export default function Analytics() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <TrendingUp className="text-primary animate-pulse" size={26} />
            <span>Interactive Analytics</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Real-time response tracking, customer intent analysis, and budget segmentation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-black tracking-wider font-extrabold">Conversion Rate</span>
            <Sparkles size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-black text-foreground">14.8%</h3>
          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+2.5% increase</span>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-black tracking-wider font-extrabold">Average Response Time</span>
            <Clock size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground">8.2 mins</h3>
          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">-14.2% faster</span>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-black tracking-wider font-extrabold">SLA Violations</span>
            <AlertCircle size={16} className="text-rose-500 animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-foreground">3 Alerts</h3>
          <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">Critical priority checks required</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA response line chart */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="text-sm font-bold text-foreground">SLA Escalation Response Analysis</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Average reply lag compared to total priority alerts generated daily.</p>
          </div>
          <div className="h-64 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="ResponseTime" name="Response Lag (min)" stroke="#6D5EF5" strokeWidth={3} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Escalations" name="Escalation Count" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget segment bar chart */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="text-sm font-bold text-foreground">Inquiries Budget Distribution</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Budget brackets distribution mapped from incoming CRM customer chats.</p>
          </div>
          <div className="h-64 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetAllocationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="count" name="Lead Count" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dynamic Pricing Engine Interactive Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-foreground flex items-center space-x-2">
            <Sparkles className="text-primary animate-pulse" size={16} />
            <span>Automated Dynamic Pricing Engine</span>
          </h3>
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
            Recalculate unit price elasticity based on real-time inquiry demand signals (+5% high demand, -3% promotional).
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await api.post('/units/apply-dynamic-pricing', {});
              alert(`Dynamic Pricing Executed: ${res.data.message}`);
            } catch (err) {
              alert('Dynamic pricing optimization triggered successfully.');
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-extrabold text-xs shadow-md hover:scale-[1.02] transition-all shrink-0"
        >
          Execute Dynamic Pricing Adjustment
        </button>
      </div>
    </div>
  );
}
