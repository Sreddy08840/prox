import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Sparkles,
  AlertCircle,
  TrendingUp,
  IndianRupee,
  Calendar,
  Layers,
  Compass,
  FileText,
} from 'lucide-react';

interface AiInsight {
  leadScore: 'HOT' | 'WARM' | 'COLD';
  budget: string | null;
  preferredUnit: string | null;
  timeline: string | null;
  financingStatus: string | null;
  intent: string | null;
  reasoning: string | null;
}

interface AiInsightsPanelProps {
  leadId: string;
}

export default function AiInsightsPanel({ leadId }: AiInsightsPanelProps) {
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Score Override Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editScore, setEditScore] = useState<'HOT' | 'WARM' | 'COLD'>('WARM');
  const [editReasoning, setEditReasoning] = useState('');
  const [editBudget, setEditBudget] = useState<number>(0);
  const [editPreferredUnit, setEditPreferredUnit] = useState('');
  const [editTimeline, setEditTimeline] = useState('');
  const [editFinancing, setEditFinancing] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/leads/${leadId}/insight`);
      if (response.data.success) {
        setInsight(response.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status !== 404) {
        setError(err.response?.data?.error?.message || 'Failed to load AI Insights');
      }
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const response = await api.post(`/leads/${leadId}/analyze`);
      if (response.data.success) {
        setInsight(response.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to run AI Analysis. Ensure conversations and messages exist first.');
      } else {
        setError('Failed to run AI Analysis');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const startOverride = () => {
    if (insight) {
      setEditScore(insight.leadScore);
      setEditReasoning(insight.reasoning || '');
      setEditBudget(insight.budget ? parseFloat(insight.budget) : 0);
      setEditPreferredUnit(insight.preferredUnit || '');
      setEditTimeline(insight.timeline || '');
      setEditFinancing(insight.financingStatus || '');
    } else {
      setEditScore('WARM');
      setEditReasoning('');
      setEditBudget(0);
      setEditPreferredUnit('');
      setEditTimeline('');
      setEditFinancing('');
    }
    setIsEditing(true);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOverride(true);
    setError(null);
    try {
      const response = await api.put(`/ai/${leadId}/insight`, {
        leadScore: editScore,
        reasoning: editReasoning,
        budget: editBudget || null,
        preferredUnit: editPreferredUnit || null,
        timeline: editTimeline || null,
        financingStatus: editFinancing || null,
      });
      if (response.data.success) {
        setInsight(response.data.data);
        setIsEditing(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to override score details');
      } else {
        setError('Failed to override score details');
      }
    } finally {
      setSavingOverride(false);
    }
  };

  const getScoreStyles = (score: string) => {
    switch (score) {
      case 'HOT':
        return {
          bg: 'bg-red-500/10 border-red-500/20 text-red-500',
          gradient: 'from-red-500 to-rose-500',
          desc: 'High buying intent, pre-approved funding, immediate purchase timeline.',
        };
      case 'WARM':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          gradient: 'from-amber-500 to-orange-500',
          desc: 'Moderate buying interest, medium timeline, pre-approved or seeking loans.',
        };
      case 'COLD':
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
          gradient: 'from-blue-500 to-indigo-500',
          desc: 'Delayed interest, long timeline, or unverified details.',
        };
      default:
        return {
          bg: 'bg-muted border-border text-muted-foreground',
          gradient: 'from-muted to-muted-foreground',
          desc: 'Indeterminate state.',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="animate-spin text-primary" size={20} />
      </div>
    );
  }

  const scoreInfo = insight ? getScoreStyles(insight.leadScore) : null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/15 p-3 text-destructive flex items-start space-x-2 text-xs">
          <AlertCircle className="shrink-0 mt-0.5" size={15} />
          <span>{error}</span>
        </div>
      )}

      {insight ? (
        <div className="space-y-4">
          {/* Headline Score with Gradient Indicator */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className={`h-1.5 bg-gradient-to-r ${scoreInfo?.gradient}`} />
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                  AI Lead Score
                </span>
                <h4 className="text-xl font-black tracking-tight text-foreground flex items-center space-x-1.5 mt-0.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold border ${scoreInfo?.bg}`}
                  >
                    {insight.leadScore}
                  </span>
                </h4>
              </div>

              {/* Run analyze/override button inside header */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={startOverride}
                  className="flex items-center space-x-1 rounded-lg border border-input px-2.5 py-1.5 text-[10px] font-bold hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                >
                  Override
                </button>
                <button
                  disabled={analyzing}
                  onClick={handleAnalyze}
                  className="flex items-center space-x-1 rounded-lg border border-input px-2.5 py-1.5 text-[10px] font-bold hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                >
                  {analyzing ? (
                    <Loader2 className="animate-spin" size={10} />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  <span>Recalculate</span>
                </button>
              </div>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveOverride} className="rounded-xl border bg-card p-4 space-y-3.5 text-[11px]">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-foreground">Override AI Lead Scoring</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Lead Score
                </label>
                <div className="flex space-x-2">
                  {(['HOT', 'WARM', 'COLD'] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setEditScore(sc)}
                      className={`flex-1 py-1 rounded-lg border text-xs font-bold transition-all ${
                        editScore === sc
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-accent text-muted-foreground'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(Number(e.target.value))}
                    className="w-full px-2 py-1 border rounded-lg bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Preferred Layout
                  </label>
                  <input
                    type="text"
                    value={editPreferredUnit}
                    onChange={(e) => setEditPreferredUnit(e.target.value)}
                    className="w-full px-2 py-1 border rounded-lg bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="E.g. 2 BHK"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={editTimeline}
                    onChange={(e) => setEditTimeline(e.target.value)}
                    className="w-full px-2 py-1 border rounded-lg bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="E.g. 3 months"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                    Financing Status
                  </label>
                  <input
                    type="text"
                    value={editFinancing}
                    onChange={(e) => setEditFinancing(e.target.value)}
                    className="w-full px-2 py-1 border rounded-lg bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="E.g. Seeking bank loan"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Overridden Reasoning / Notes
                </label>
                <textarea
                  required
                  value={editReasoning}
                  onChange={(e) => setEditReasoning(e.target.value)}
                  className="w-full px-2 py-1 border rounded-lg bg-background text-xs h-14 resize-none text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe your reasoning..."
                />
              </div>

              <button
                type="submit"
                disabled={savingOverride}
                className="w-full flex justify-center items-center py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-sm"
              >
                {savingOverride ? <Loader2 className="animate-spin" size={12} /> : 'Save Override'}
              </button>
            </form>
          ) : (
            <>
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                {/* Budget */}
                <div className="border rounded-lg p-2.5 space-y-1 bg-muted/20">
                  <div className="flex items-center space-x-1 text-muted-foreground font-semibold">
                    <IndianRupee size={13} className="text-emerald-500" />
                    <span>Extracted Budget</span>
                  </div>
                  <div className="font-extrabold text-foreground">
                    {insight.budget ? (
                      `₹${parseFloat(insight.budget).toLocaleString('en-IN', {
                        maximumFractionDigits: 0,
                      })}`
                    ) : (
                      <span className="text-muted-foreground/60">Not stated</span>
                    )}
                  </div>
                </div>

                {/* Preferred Unit */}
                <div className="border rounded-lg p-2.5 space-y-1 bg-muted/20">
                  <div className="flex items-center space-x-1 text-muted-foreground font-semibold">
                    <Layers size={13} className="text-primary/70" />
                    <span>Preferred Layout</span>
                  </div>
                  <div className="font-bold text-foreground truncate">
                    {insight.preferredUnit || <span className="text-muted-foreground/60">Not specified</span>}
                  </div>
                </div>

                {/* Timeline */}
                <div className="border rounded-lg p-2.5 space-y-1 bg-muted/20">
                  <div className="flex items-center space-x-1 text-muted-foreground font-semibold">
                    <Calendar size={13} className="text-primary/70" />
                    <span>Timeline</span>
                  </div>
                  <div className="font-bold text-foreground">
                    {insight.timeline || <span className="text-muted-foreground/60">Immediate</span>}
                  </div>
                </div>

                {/* Financing */}
                <div className="border rounded-lg p-2.5 space-y-1 bg-muted/20">
                  <div className="flex items-center space-x-1 text-muted-foreground font-semibold">
                    <TrendingUp size={13} className="text-primary/70" />
                    <span>Financing Status</span>
                  </div>
                  <div className="font-bold text-foreground truncate">
                    {insight.financingStatus || <span className="text-muted-foreground/60">Pre-approved</span>}
                  </div>
                </div>
              </div>

              {/* Intent */}
              {insight.intent && (
                <div className="border rounded-lg p-3 space-y-1 bg-muted/20 text-[11px]">
                  <div className="flex items-center space-x-1 text-muted-foreground font-semibold">
                    <Compass size={13} className="text-primary/70" />
                    <span>Extracted Buying Intent</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {insight.intent}
                  </p>
                </div>
              )}

              {/* Explainable Reasoning */}
              {insight.reasoning && (
                <div className="border rounded-lg p-3 space-y-1 bg-primary/5 text-[11px] border-primary/10">
                  <div className="flex items-center space-x-1 text-primary font-bold">
                    <FileText size={13} />
                    <span>Explainable Reasoning</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {insight.reasoning}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="border border-dashed rounded-xl p-6 text-center space-y-3 bg-muted/10">
          <Sparkles className="mx-auto text-primary/40 animate-pulse" size={28} />
          <div>
            <h4 className="font-semibold text-xs text-foreground">No AI Insights Available</h4>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px] mx-auto">
              Run Claude AI analysis on dialog logs to compute customer properties.
            </p>
          </div>
          <button
            disabled={analyzing}
            onClick={handleAnalyze}
            className="flex items-center justify-center space-x-1.5 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
          >
            {analyzing ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            <span>Generate AI Insights</span>
          </button>
        </div>
      )}
    </div>
  );
}
