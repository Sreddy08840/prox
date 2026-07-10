import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Sliders, Plus, IndianRupee, Loader2 } from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  budget: string | null;
  source: string | null;
  aiInsight?: {
    leadScore: 'HOT' | 'WARM' | 'COLD';
  } | null;
}

const STAGES = [
  { id: 'NEW', title: 'New Inquiries', color: 'border-blue-500 bg-blue-500/10 text-blue-500' },
  { id: 'CONTACTED', title: 'Contacted', color: 'border-amber-500 bg-amber-500/10 text-amber-500' },
  { id: 'QUALIFIED', title: 'Qualified', color: 'border-purple-500 bg-purple-500/10 text-purple-500' },
  { id: 'NEGOTIATING', title: 'Negotiating', color: 'border-teal-500 bg-teal-500/10 text-teal-500' },
  { id: 'WON', title: 'Won (Converted)', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-500' }
];

export default function Pipelines() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await api.get('/leads', { params: { limit: 100 } });
        if (response.data.success) {
          setLeads(response.data.data.leads);
        }
      } catch (_err) {
        // Ignore fallback
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const getLeadsByStage = (status: string) => {
    return leads.filter(l => l.status === status);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <Sliders className="text-primary animate-pulse" size={26} />
            <span>Deals Pipeline</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Real-time status Kanban board. Drag-and-drop lead requirements tracking.
          </p>
        </div>
        <button
          onClick={() => navigate('/leads')}
          className="flex items-center space-x-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shrink-0"
        >
          <Plus size={14} />
          <span>Add Lead</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto min-h-[550px] pb-4">
          {STAGES.map(stage => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <div key={stage.id} className="rounded-2xl border bg-card/60 p-4 space-y-4 flex flex-col min-w-[220px]">
                {/* Column Header */}
                <div className="flex items-center justify-between border-b pb-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${stage.color}`}>
                    {stage.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-black bg-muted px-2 py-0.5 rounded-md">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-xl text-[10px] text-muted-foreground/60 font-semibold select-none">
                      No leads in stage
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="rounded-xl border bg-card p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer space-y-2 border-border/80 group"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-extrabold text-foreground block text-[11px] group-hover:text-primary transition-colors leading-tight text-left">
                            {lead.firstName} {lead.lastName}
                          </span>
                          {lead.aiInsight?.leadScore && (
                            <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase tracking-wider ${
                              lead.aiInsight.leadScore === 'HOT' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                              lead.aiInsight.leadScore === 'WARM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}>
                              {lead.aiInsight.leadScore}
                            </span>
                          )}
                        </div>

                        {/* Budget & details */}
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground pt-1 border-t">
                          <div className="flex items-center">
                            <IndianRupee size={10} className="text-emerald-500 mr-0.5" />
                            <span>
                              {lead.budget ? parseFloat(lead.budget).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                            </span>
                          </div>
                          <span className="text-[9px] text-muted-foreground/75 font-semibold bg-muted/50 px-1 rounded">
                            {lead.source || 'Website'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
