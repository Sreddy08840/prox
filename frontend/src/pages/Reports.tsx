import { TrendingUp, Download, BarChart2, PieChart as PieIcon, LineChart as LucideLineIcon, FileText } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const adSpendData = [
  { name: 'Google Ads', Spend: 45000, Revenue: 180000 },
  { name: 'Facebook Ads', Spend: 35000, Revenue: 120000 },
  { name: 'LinkedIn Ads', Spend: 20000, Revenue: 90000 },
  { name: 'Instagram', Spend: 15000, Revenue: 60000 },
  { name: 'Direct/SEO', Spend: 5000, Revenue: 80000 },
];

export default function Reports() {
  const downloadReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:p-0 print:bg-white text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5 print:border-none">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <TrendingUp className="text-primary animate-pulse" size={26} />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Enterprise analytics, ROI summaries, and channel conversion reports.
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center space-x-1.5 rounded-xl border border-input bg-card px-4 py-2.5 text-xs font-bold hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-sm print:hidden"
        >
          <Download size={14} />
          <span>Download PDF Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1 */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-black tracking-wider">Average Deal Value</span>
            <BarChart2 size={16} className="text-primary" />
          </div>
          <h3 className="text-2xl font-black text-foreground">₹4.5 Crores</h3>
          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+15.2% vs last quarter</span>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-black tracking-wider">Customer Acquisition Cost</span>
            <PieIcon size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground">₹24,500</h3>
          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">-8.4% improvement</span>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-2 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] uppercase font-black tracking-wider">Marketing ROI</span>
            <LucideLineIcon size={16} className="text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground">4.2x</h3>
          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+12.1% growth</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ad Spend vs Revenue conversion bar chart */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="text-sm font-bold text-foreground">Ad Spend vs Revenue Conversion</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Marketing conversion metrics comparing campaign expenses to pipeline sales.</p>
          </div>
          <div className="h-64 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adSpendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                <Legend iconSize={10} verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Spend" fill="#6D5EF5" radius={[6, 6, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Revenue" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Export History Log */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="text-sm font-bold text-foreground">Generated Reports Log</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Audit log list of spreadsheet exports and performance reports.</p>
          </div>
          
          <div className="space-y-3 mt-2 text-left">
            {/* Report 1 */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                  <FileText size={15} />
                </div>
                <div>
                  <span className="font-extrabold text-[11px] text-foreground block leading-tight">q2_performance_audit.xlsx</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">Generated 2h ago by Admin</span>
                </div>
              </div>
              <button className="flex items-center space-x-1 px-2.5 py-1 rounded bg-muted hover:bg-primary/10 text-[9px] font-black text-muted-foreground hover:text-primary transition-all shrink-0">
                <Download size={10} />
                <span>Download</span>
              </button>
            </div>

            {/* Report 2 */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                  <FileText size={15} />
                </div>
                <div>
                  <span className="font-extrabold text-[11px] text-foreground block leading-tight">leads_acquisition_june.csv</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">Generated Yesterday by System</span>
                </div>
              </div>
              <button className="flex items-center space-x-1 px-2.5 py-1 rounded bg-muted hover:bg-primary/10 text-[9px] font-black text-muted-foreground hover:text-primary transition-all shrink-0">
                <Download size={10} />
                <span>Download</span>
              </button>
            </div>

            {/* Report 3 */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer group">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                  <FileText size={15} />
                </div>
                <div>
                  <span className="font-extrabold text-[11px] text-foreground block leading-tight">sla_escalations_weekly.pdf</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">Generated July 07 by System</span>
                </div>
              </div>
              <button className="flex items-center space-x-1 px-2.5 py-1 rounded bg-muted hover:bg-primary/10 text-[9px] font-black text-muted-foreground hover:text-primary transition-all shrink-0">
                <Download size={10} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
