import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Search,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Paperclip,
  FileText,
  User,
  Computer,
  X,
  AlertCircle,
} from 'lucide-react';

interface Attachment {
  name: string;
  size?: number;
  url: string;
}

interface Message {
  id: string;
  content: string;
  senderType: 'USER' | 'LEAD' | 'AI';
  attachments: Attachment[] | null;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface Conversation {
  id: string;
  subject: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationsPanelProps {
  leadId: string;
}

export default function ConversationsPanel({ leadId }: ConversationsPanelProps) {
  // Topics & threads
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Selected thread details
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  // New conversation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Message input form
  const [content, setContent] = useState('');
  const [senderType, setSenderType] = useState<'USER' | 'LEAD' | 'AI'>('USER');
  const [attachMock, setAttachMock] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // AI Summarize thread
  const [summarizing, setSummarizing] = useState(false);

  // AI Negotiation Co-pilot Suggestion States
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotDraft, setCopilotDraft] = useState<string | null>(null);

  const fetchCopilotDraft = async () => {
    setCopilotLoading(true);
    setCopilotDraft(null);
    try {
      const res = await api.post(`/ai/${leadId}/copilot-draft`);
      if (res.data.success) {
        setCopilotDraft(res.data.data.draft);
      }
    } catch (_err) {
      setSendError('Failed to fetch negotiation draft from co-pilot.');
    } finally {
      setCopilotLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/leads/${leadId}/conversations`, {
        params: { search: search || undefined },
      });
      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to fetch conversations');
      }
    } finally {
      setLoading(false);
    }
  }, [leadId, search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchThread = useCallback(async (id: string) => {
    setThreadLoading(true);
    setSendError(null);
    try {
      const response = await api.get(`/conversations/${id}`);
      if (response.data.success) {
        setMessages(response.data.data.messages);
        setSummary(response.data.data.summary);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSendError(err.response?.data?.error?.message || 'Failed to load messages');
      }
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchThread(selectedId);
    }
  }, [selectedId, fetchThread]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    setCreating(true);
    setModalError(null);

    try {
      const response = await api.post(`/leads/${leadId}/conversations`, {
        subject: newSubject.trim(),
      });
      if (response.data.success) {
        setNewSubject('');
        setIsModalOpen(false);
        fetchConversations();
        setSelectedId(response.data.data.id);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setModalError(err.response?.data?.error?.message || 'Failed to start topic');
      } else {
        setModalError('Failed to start topic');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedId) return;

    setSending(true);
    setSendError(null);

    // Mock attachments structure
    let attachments: Attachment[] | null = null;
    if (attachMock) {
      attachments = [
        {
          name: 'PropX_Floor_Plan_Brochure.pdf',
          size: 1540000,
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        },
      ];
    }

    try {
      const response = await api.post(`/conversations/${selectedId}/messages`, {
        content: content.trim(),
        senderType,
        attachments,
      });

      if (response.data.success) {
        setContent('');
        setAttachMock(false);
        setMessages((prev) => [...prev, response.data.data]);
        fetchConversations(); // Update timestamps on left pane
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSendError(err.response?.data?.error?.message || 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedId) return;
    setSummarizing(true);
    setSendError(null);

    try {
      const response = await api.post(`/conversations/${selectedId}/summarize`);
      if (response.data.success) {
        setSummary(response.data.data.summary);
        fetchConversations(); // Update list summaries
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSendError(err.response?.data?.error?.message || 'Failed to generate summary');
      }
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="flex h-[520px] rounded-xl border bg-card overflow-hidden shadow-sm text-xs">
      {/* 1. Left Side: Channels List */}
      <div className="w-1/3 border-r bg-muted/10 flex flex-col h-full">
        {/* Header & search */}
        <div className="p-3 border-b space-y-2 shrink-0">
          {error && (
            <div className="rounded bg-destructive/15 p-2 text-destructive flex items-center space-x-1.5 text-[10px] shrink-0">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-foreground">Topics</h4>
            <button
              onClick={() => {
                setModalError(null);
                setNewSubject('');
                setIsModalOpen(true);
              }}
              className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-muted-foreground" size={13} />
            <input
              type="text"
              placeholder="Search subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border rounded-md bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Channels scrollable */}
        <div className="flex-1 overflow-y-auto divide-y">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-primary" size={18} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No threads found.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`p-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                  selectedId === conv.id ? 'bg-primary/5 border-l-2 border-primary font-bold' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-foreground truncate max-w-[120px]">
                    {conv.subject}
                  </span>
                  <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                    {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {conv.summary ? (
                  <p className="text-[10px] text-primary mt-1 line-clamp-2 leading-tight">
                    {conv.summary}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">
                    No summary generated yet
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Right Side: Message Thread Pane */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {selectedId ? (
          <>
            {/* Header info */}
            {conversations.find((c) => c.id === selectedId) && (
              <div className="p-3 border-b flex justify-between items-center bg-card shrink-0">
                <div>
                  <h4 className="font-bold text-foreground">
                    {conversations.find((c) => c.id === selectedId)?.subject}
                  </h4>
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    Topic UUID: {selectedId}
                  </span>
                </div>
                <button
                  disabled={summarizing || messages.length === 0}
                  onClick={handleSummarize}
                  className="flex items-center space-x-1 border rounded-lg px-2.5 py-1 text-[10px] font-bold hover:bg-accent transition-all text-primary border-primary/20 bg-primary/5 disabled:opacity-40"
                >
                  {summarizing ? (
                    <Loader2 className="animate-spin" size={11} />
                  ) : (
                    <Sparkles size={11} />
                  )}
                  <span>Summarize AI</span>
                </button>
              </div>
            )}

            {/* Error banners inside chat */}
            {sendError && (
              <div className="mx-3 mt-3 rounded bg-destructive/15 p-2 text-destructive flex items-center space-x-1.5 text-[10px] shrink-0">
                <AlertCircle size={13} />
                <span>{sendError}</span>
              </div>
            )}

            {/* Main scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Summary display banner inside thread */}
              {summary && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center space-x-1.5 text-primary font-bold text-[10px]">
                    <Sparkles size={13} />
                    <span>AI Thread Summary</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground whitespace-pre-line leading-relaxed">
                    {summary}
                  </p>
                </div>
              )}

              {threadLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground font-medium">
                  Select a participant role and post messages to populate history logs.
                </div>
              ) : (
                messages.map((msg) => {
                  const isAgent = msg.senderType === 'USER';
                  const isAI = msg.senderType === 'AI';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] space-y-1 ${isAgent ? 'text-right' : 'text-left'}`}>
                        {/* Message Sender Header */}
                        <div className="flex items-center space-x-1.5 text-[10px] text-muted-foreground px-1 justify-start">
                          {isAgent ? (
                            <span className="font-bold text-foreground">
                              {msg.sender ? `${msg.sender.firstName} (Agent)` : 'Agent'}
                            </span>
                          ) : isAI ? (
                            <span className="font-bold text-purple-600 flex items-center space-x-1">
                              <Computer size={11} />
                              <span>AI Automation</span>
                            </span>
                          ) : (
                            <span className="font-bold text-foreground flex items-center space-x-1">
                              <User size={11} />
                              <span>Client Lead</span>
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Content bubble */}
                        <div
                          className={`rounded-2xl px-3 py-2 leading-relaxed text-xs shadow-sm ${
                            isAgent
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : isAI
                              ? 'bg-purple-500/10 border border-purple-500/20 text-purple-700 rounded-tl-none'
                              : 'bg-muted border border-border text-foreground rounded-tl-none'
                          }`}
                        >
                          <p>{msg.content}</p>

                          {/* Attachments panel */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 pt-1.5 border-t border-current/10">
                              {msg.attachments.map((file, fIdx) => (
                                <a
                                  key={fIdx}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1.5 text-[10px] underline bg-black/10 hover:bg-black/20 px-2 py-0.5 rounded transition-all font-semibold"
                                >
                                  <FileText size={11} />
                                  <span>{file.name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Co-Pilot Suggestion Banner */}
            <div className="mx-3 mt-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2 shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1.5 text-primary font-bold text-[10px]">
                  <Sparkles size={13} className="animate-pulse" />
                  <span>AI Negotiation Co-Pilot</span>
                </div>
                <button
                  type="button"
                  onClick={fetchCopilotDraft}
                  disabled={copilotLoading}
                  className="flex items-center space-x-1 border border-primary/25 rounded px-2.5 py-0.5 text-[9px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
                >
                  {copilotLoading ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />}
                  <span>Generate Objection Response</span>
                </button>
              </div>

              {copilotDraft && (
                <div className="space-y-2">
                  <p className="text-[11px] leading-relaxed text-muted-foreground bg-background p-2.5 rounded border italic">
                    "{copilotDraft}"
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setContent(copilotDraft);
                        setCopilotDraft(null);
                      }}
                      className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-bold text-[9px] shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      Use Suggestion in Chat
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form footer input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t bg-card shrink-0 space-y-2">
              <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
                {/* Simulator controls */}
                <div className="flex items-center space-x-2">
                  <span className="font-bold">Post message as:</span>
                  <select
                    value={senderType}
                    onChange={(e) => setSenderType(e.target.value as 'USER' | 'LEAD' | 'AI')}
                    className="border rounded px-1.5 py-0.5 bg-background font-semibold text-foreground focus:outline-none"
                  >
                    <option value="USER">Agent (USER)</option>
                    <option value="LEAD">Client (LEAD)</option>
                    <option value="AI">AI (AI)</option>
                  </select>
                </div>

                {/* Attachments checkbox mock selector */}
                <label className="flex items-center space-x-1.5 cursor-pointer font-semibold text-primary hover:underline">
                  <input
                    type="checkbox"
                    checked={attachMock}
                    onChange={(e) => setAttachMock(e.target.checked)}
                    className="rounded border"
                  />
                  <Paperclip size={11} />
                  <span>Mock brochure PDF</span>
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message or response details..."
                  className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="flex items-center justify-center space-x-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="animate-spin" size={12} />
                  ) : (
                    <Send size={12} />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 p-6 text-center">
            <MessageSquare className="text-muted-foreground/30 animate-pulse" size={42} />
            <div>
              <h4 className="font-semibold text-foreground text-sm">No Topic Selected</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[220px]">
                Create a conversation channel topic on the left to start sending mock logs.
              </p>
            </div>
            <button
              onClick={() => {
                setModalError(null);
                setNewSubject('');
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary px-4 py-2 font-bold hover:bg-primary/15 transition-all"
            >
              <Plus size={13} />
              <span>Start New Topic</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. New Topic Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <MessageSquare size={16} />
              </div>
              <h4 className="text-sm font-bold text-foreground">Start Conversation Topic</h4>
            </div>

            <form onSubmit={handleStartTopic} className="space-y-4">
              {modalError && (
                <div className="rounded bg-destructive/15 p-2.5 text-destructive flex items-center space-x-1.5 text-[10px]">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Topic Subject
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="E.g., Pricing Quote Penthouse"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2 bg-secondary text-secondary-foreground text-[11px] font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newSubject.trim()}
                  className="w-1/2 flex justify-center items-center py-2 bg-primary text-primary-foreground text-[11px] font-bold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    'Create Topic'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
