import { useState } from 'react';
import { Play, Sparkles, RefreshCw, Smartphone } from 'lucide-react';

export default function SandboxSimulator() {
  const [inboundText, setInboundText] = useState('Hi, I am looking to purchase a 3 BHK flat. My budget is around 4 Crores and I need to close the deal within 2 months. Cash buyer.');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    'System initialized. Waiting for mock WhatsApp triggers...',
  ]);

  const [aiAnalysis, setAiAnalysis] = useState<{
    score: string;
    budget: string;
    timeline: string;
    financing: string;
    replyDraft: string;
  } | null>(null);

  const [simulating, setSimulating] = useState(false);

  const runSimulation = () => {
    if (!inboundText.trim()) return;
    setSimulating(true);
    setSimulationLogs(prev => [...prev, `[Inbound Trigger] Inbound WhatsApp message received: "${inboundText}"`]);

    setTimeout(() => {
      setSimulationLogs(prev => [...prev, '[AI Agent Parser] Running language models key-phrase extraction...']);
      
      setTimeout(() => {
        setSimulationLogs(prev => [...prev, '[Database Ingest] Parsed metrics stored to prisma client models.']);
        setSimulationLogs(prev => [...prev, '[AI Scorer] Scoring intent calculations complete. Lead flags hot.']);

        setAiAnalysis({
          score: 'HOT',
          budget: '₹4.0 Crores',
          timeline: '2 months (Immediate)',
          financing: 'Cash buyer',
          replyDraft: 'Hello! I have recorded your requirements. A sales representative is preparing layout options for 3 BHK properties matching your ₹4 Cr budget segment. We can arrange a call today at 5 PM. Would that work?',
        });
        setSimulating(false);
      }, 600);
    }, 600);
  };

  const resetSimulation = () => {
    setInboundText('Hello, do you have any available penthouses? Budget is ₹5.5 Cr.');
    setAiAnalysis(null);
    setSimulationLogs(['Sandbox console cleared. Waiting for inputs...']);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <Play className="text-primary animate-pulse" size={26} />
            <span>AI Sandbox Simulator</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Simulate incoming WhatsApp customer inquiries to test real-time AI scoring accuracy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Left Input Simulator */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 font-bold text-foreground">
            <Smartphone size={16} className="text-primary" />
            <span>Simulate WhatsApp Client Inbound</span>
          </div>

          <div className="space-y-3.5 text-xs font-semibold">
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block mb-1">Message Content</label>
              <textarea
                value={inboundText}
                onChange={e => setInboundText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent font-medium transition-all resize-none leading-relaxed"
                placeholder="Type client message here..."
              />
            </div>

            <div className="flex items-center space-x-3.5 pt-2">
              <button
                onClick={runSimulation}
                disabled={simulating}
                className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground hover:bg-primary/95 transition-all shadow-md"
              >
                {simulating ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
                <span>Trigger Simulation</span>
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center justify-center space-x-1.5 rounded-xl border border-input bg-card px-4 py-2.5 text-xs font-bold hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-sm"
              >
                <span>Reset Sandbox</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Logs & Output */}
        <div className="space-y-6">
          {/* Logs Terminal */}
          <div className="rounded-2xl border bg-slate-950 text-slate-200 p-5 shadow-md h-48 overflow-y-auto font-mono text-[10px] space-y-1">
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-2 border-b border-slate-800 pb-1.5 select-none">
              Simulation Logging Trace
            </div>
            {simulationLogs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                <span className="text-primary font-bold mr-1">&gt;</span>
                {log}
              </div>
            ))}
          </div>

          {/* AI Result Card */}
          {aiAnalysis && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center space-x-1.5">
                  <Sparkles size={15} className="text-primary animate-pulse" />
                  <span>AI Recalculated Insights</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse uppercase">
                  {aiAnalysis.score} Lead
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b pb-3.5 text-[11px] font-bold text-muted-foreground">
                <div>
                  <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/60 mb-0.5">Budget Segment</span>
                  <span className="text-foreground">{aiAnalysis.budget}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/60 mb-0.5">Timeline</span>
                  <span className="text-foreground">{aiAnalysis.timeline}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/60 mb-0.5">Financing</span>
                  <span className="text-foreground">{aiAnalysis.financing}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider block text-muted-foreground/60 mb-1 font-bold">Suggested AI Auto-Reply Draft</span>
                <div className="p-3 rounded-xl border bg-muted/15 font-semibold leading-relaxed text-xs text-muted-foreground">
                  {aiAnalysis.replyDraft}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
