import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../services/api';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  Clock,
  User,
  ShieldAlert,
} from 'lucide-react';

interface SandboxMessage {
  id: string;
  senderType: 'LEAD' | 'BOT' | 'USER';
  content: string;
  createdAt: string;
}

interface SandboxLead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  isHandedOver: boolean;
}

interface SandboxInsight {
  leadScore: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  budget: string | null;
  preferredUnit: string | null;
  timeline: string | null;
  financingStatus: string | null;
}

export default function SandboxSimulator() {
  const [phone, setPhone] = useState('9876543210');
  const [contactName, setContactName] = useState('Rohan Sharma');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<SandboxMessage[]>([]);
  const [leadInfo, setLeadInfo] = useState<SandboxLead | null>(null);
  const [aiInsight, setAiInsight] = useState<SandboxInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/whatsapp/simulate-sandbox', {
        phone,
        contactName,
        content: content.trim(),
      });

      if (response.data.success) {
        const { lead, insight, messages } = response.data.data;
        setLeadInfo(lead);
        setAiInsight(insight);
        setChatHistory(messages);
        setContent('');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Sandbox simulator failed to run.');
      } else {
        setError('Sandbox simulator failed to run.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'HOT':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'WARM':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'COLD':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2">
          <Sparkles className="text-primary animate-pulse" size={28} />
          <span>AI WhatsApp Sandbox</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simulate live user WhatsApp inquiries to test the AI qualification, scoring engine, and manual agent takeover triggers.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Simulator Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Configuration & Chat Mockup */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground">Sandbox User Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider mb-1.5">
                  Simulated Customer Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="E.g., Rohan Sharma"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider mb-1.5">
                  Simulated Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="E.g., 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Interactive Chat Console */}
          <div className="rounded-2xl border bg-card flex flex-col h-[520px] shadow-md overflow-hidden relative">
            {/* Header */}
            <div className="bg-muted px-6 py-4 flex justify-between items-center border-b">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {contactName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">{contactName}</h4>
                  <p className="text-[10px] text-muted-foreground flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    <span>Active Sandbox Session (+{phone})</span>
                  </p>
                </div>
              </div>
              
              {leadInfo?.isHandedOver && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/10 border border-rose-500/20 text-rose-600 uppercase tracking-wider animate-pulse">
                  <ShieldAlert size={10} className="mr-1" />
                  Agent Takeover
                </span>
              )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-muted/20">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                  <MessageSquare size={36} className="opacity-40 animate-pulse text-primary" />
                  <div>
                    <h5 className="font-bold text-xs text-foreground">Launch conversation simulator</h5>
                    <p className="text-[10px] mt-1 max-w-xs leading-normal">
                      Try typing a query like: <br />
                      <strong className="text-primary">"Hi, I want a 3 BHK layout around 60 Lakhs, plan to move in 2 months. Need bank financing."</strong>
                    </p>
                  </div>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'LEAD' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2.5 text-xs shadow-sm ${
                        msg.senderType === 'LEAD'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-card text-foreground rounded-bl-none border'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <span
                        className={`block text-[8px] mt-1 text-right ${
                          msg.senderType === 'LEAD' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border rounded-xl rounded-bl-none px-4 py-3 text-xs flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="animate-spin text-primary" size={14} />
                    <span>AI Qualification engine running...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-card flex gap-2">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type customer WhatsApp reply..."
                className="flex-1 rounded-lg border bg-background px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: AI Qualification Insights Dashboard */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center">
                <Sparkles className="text-primary mr-1.5" size={16} />
                <span>AI Live Qualification Insights</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dynamic lead extraction parameters parsed by the LLM system.
              </p>
            </div>

            {aiInsight ? (
              <div className="space-y-5">
                {/* Score */}
                <div className="border-b pb-4">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">
                    Lead Qualification Score
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getScoreColor(aiInsight.leadScore)}`}>
                      ★ {aiInsight.leadScore} LEAD
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Auto-routing status: <strong className="text-foreground">Assigned Agent</strong>
                    </span>
                  </div>
                </div>

                {/* Parameters Checklist */}
                <div className="space-y-3.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Extracted Signal Parameters
                  </span>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start justify-between text-xs border-b pb-2">
                      <span className="text-muted-foreground flex items-center">
                        <User size={12} className="mr-1.5 text-muted-foreground/60" />
                        <span>Budget Range</span>
                      </span>
                      <strong className="text-foreground">{aiInsight.budget || '₹ Undefined'}</strong>
                    </div>

                    <div className="flex items-start justify-between text-xs border-b pb-2">
                      <span className="text-muted-foreground flex items-center">
                        <Clock size={12} className="mr-1.5 text-muted-foreground/60" />
                        <span>Timeline / Urgency</span>
                      </span>
                      <strong className="text-foreground">{aiInsight.timeline || 'Undefined'}</strong>
                    </div>

                    <div className="flex items-start justify-between text-xs border-b pb-2">
                      <span className="text-muted-foreground flex items-center">
                        <MessageSquare size={12} className="mr-1.5 text-muted-foreground/60" />
                        <span>Preferred Layout</span>
                      </span>
                      <strong className="text-foreground">{aiInsight.preferredUnit || 'Undefined'}</strong>
                    </div>

                    <div className="flex items-start justify-between text-xs border-b pb-2">
                      <span className="text-muted-foreground flex items-center">
                        <HelpCircle size={12} className="mr-1.5 text-muted-foreground/60" />
                        <span>Financing Method</span>
                      </span>
                      <strong className="text-foreground">{aiInsight.financingStatus || 'Undefined'}</strong>
                    </div>
                  </div>
                </div>

                {/* AI Rationale */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-2">
                    AI Analysis Rationale
                  </span>
                  <div className="rounded-xl bg-muted/40 p-4 border text-xs leading-relaxed text-muted-foreground italic">
                    "{aiInsight.reasoning}"
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                <ShieldAlert size={28} className="mx-auto opacity-30 mb-2" />
                <h5 className="font-semibold text-xs text-foreground">Waiting for customer input</h5>
                <p className="text-[10px] mt-1 max-w-[200px] mx-auto">
                  Type a message in the sandbox simulator to trigger real-time lead grading analysis.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
