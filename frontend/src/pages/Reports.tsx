import { TrendingUp, Download, BarChart2, PieChart as PieIcon, LineChart } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <TrendingUp className="text-primary animate-pulse" size={26} />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Enterprise analytics, ROI summaries, and channel conversion reports.
          </p>
        </div>
        <button className="flex items-center space-x-1.5 rounded-xl border border-input bg-card px-4 py-2.5 text-xs font-bold hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-sm">
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
            <LineChart size={16} className="text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground">4.2x</h3>
          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">+12.1% growth</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground">Ad Spend vs Revenue Conversion</h3>
          <div className="h-60 rounded-xl bg-muted/10 border border-dashed flex flex-col items-center justify-center p-4">
            <BarChart2 size={32} className="text-muted-foreground/40 mb-2" />
            <span className="text-xs font-bold text-foreground">Marketing Conversion Matrix</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Live reporting updates automatically every 24 hours.</span>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground">SLA Escalation Response Analysis</h3>
          <div className="h-60 rounded-xl bg-muted/10 border border-dashed flex flex-col items-center justify-center p-4">
            <LineChart size={32} className="text-muted-foreground/40 mb-2" />
            <span className="text-xs font-bold text-foreground">Response Lag Heatmap</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Average agent response time compared to immediate buyer stages.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
