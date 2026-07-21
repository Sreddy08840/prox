import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import AiInsightsPanel from '../components/AiInsightsPanel';
import ConversationsPanel from '../components/ConversationsPanel';
import {
  Loader2,
  ChevronLeft,
  Edit2,
  Trash2,
  Phone,
  Mail,
  IndianRupee,
  Sparkles,
  X,
  AlertCircle,
  Clock,
  Send,
  Building,
  User,
  Compass,
  FileText,
  Activity,
} from 'lucide-react';

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
}

interface Agent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  budget: string | null;
  timeline: string | null;
  financingStatus: string | null;
  notes: string | null;
  assignedUserId: string | null;
  preferredUnitId: string | null;
  assignedUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  preferredUnit: {
    id: string;
    unitNumber: string;
    projectId: string;
    project: {
      name: string;
    };
  } | null;
  activities: ActivityLog[];
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'conversations'>('history');

  // Edit Modal Form State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('NEW');
  const [source, setSource] = useState('');

  // Site Visit Modal State
  const [isSiteVisitOpen, setIsSiteVisitOpen] = useState(false);
  const [siteVisitDate, setSiteVisitDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [siteVisitNotes, setSiteVisitNotes] = useState('');
  const [googleCalUrl, setGoogleCalUrl] = useState('');
  const [icsDownloadUrl, setIcsDownloadUrl] = useState('');
  const [schedulingVisit, setSchedulingVisit] = useState(false);
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [financingStatus, setFinancingStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [preferredUnitId, setPreferredUnitId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Activity Form State
  const [activityType, setActivityType] = useState('NOTE');
  const [activityText, setActivityText] = useState('');
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  // Current User (simulated check)
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('propx_auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ role: payload.role });
      } catch (_err) {
        setCurrentUser({ role: 'ADMIN' });
      }
    } else {
      setCurrentUser({ role: 'ADMIN' });
    }
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isEditor = isAdmin || currentUser?.role === 'SALES_MANAGER';

  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/leads/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setLead(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setStatus(data.status);
        setSource(data.source || '');
        setBudget(data.budget ? String(parseFloat(data.budget)) : '');
        setTimeline(data.timeline || '');
        setFinancingStatus(data.financingStatus || '');
        setNotes(data.notes || '');
        setAssignedUserId(data.assignedUserId || '');
        setPreferredUnitId(data.preferredUnitId || '');
        setSelectedProjectId(data.preferredUnit?.projectId || '');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to load lead details');
      } else {
        setError('Failed to load lead details');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await api.get('/organizations/me/members');
      if (response.data.success) {
        setAgents(response.data.data);
      }
    } catch (_err) {
      // Ignore
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/projects?limit=100');
      if (response.data.success) {
        setProjects(response.data.data.projects);
      }
    } catch (_err) {
      // Ignore
    }
  }, []);

  const fetchUnits = useCallback(async (projId: string) => {
    if (!projId) {
      setUnits([]);
      return;
    }
    try {
      const response = await api.get(`/projects/${projId}/units?limit=100`);
      if (response.data.success) {
        setUnits(response.data.data.units);
      }
    } catch (_err) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  useEffect(() => {
    fetchAgents();
    fetchProjects();
  }, [fetchAgents, fetchProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchUnits(selectedProjectId);
    }
  }, [selectedProjectId, fetchUnits]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);

    try {
      const response = await api.put(`/leads/${id}`, {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        status,
        source: source || null,
        budget: budget ? parseFloat(budget) : null,
        timeline: timeline || null,
        financingStatus: financingStatus || null,
        notes: notes || null,
        assignedUserId: assignedUserId || null,
        preferredUnitId: preferredUnitId || null,
      });

      if (response.data.success) {
        setIsEditOpen(false);
        fetchLead();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setUpdateError(err.response?.data?.error?.message || 'Failed to update lead');
      } else {
        setUpdateError('Failed to update lead');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? This will soft delete the lead.')) {
      return;
    }

    try {
      const response = await api.delete(`/leads/${id}`);
      if (response.data.success) {
        navigate('/leads');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to delete lead');
      } else {
        setError('Failed to delete lead');
      }
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityText.trim()) return;

    setLogging(true);
    setLogError(null);

    try {
      const response = await api.post(`/leads/${id}/activities`, {
        type: activityType,
        description: activityText,
      });

      if (response.data.success) {
        setActivityText('');
        fetchLead(); // Refresh activities list
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setLogError(err.response?.data?.error?.message || 'Failed to log activity');
      } else {
        setLogError('Failed to log activity');
      }
    } finally {
      setLogging(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'NEW':
        return 'bg-blue-500/15 border-blue-500/20 text-blue-500';
      case 'CONTACTED':
        return 'bg-amber-500/15 border-amber-500/20 text-amber-500';
      case 'QUALIFIED':
        return 'bg-purple-500/15 border-purple-500/20 text-purple-500';
      case 'NEGOTIATING':
        return 'bg-teal-500/15 border-teal-500/20 text-teal-500';
      case 'WON':
        return 'bg-emerald-500/15 border-emerald-500/20 text-emerald-500';
      case 'LOST':
        return 'bg-rose-500/15 border-rose-500/20 text-rose-500';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getActivityIcon = (typeStr: string) => {
    switch (typeStr) {
      case 'NOTE':
        return <FileText size={13} />;
      case 'CALL':
        return <Phone size={13} />;
      case 'EMAIL':
        return <Mail size={13} />;
      case 'MEETING':
        return <Clock size={13} />;
      case 'STATUS_CHANGE':
        return <Activity size={13} className="text-primary" />;
      default:
        return <Compass size={13} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4 max-w-md mx-auto py-10">
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error || 'Lead not found.'}</span>
        </div>
        <Link
          to="/leads"
          className="flex items-center justify-center space-x-2 w-full rounded-lg bg-secondary py-2 text-sm font-semibold hover:bg-secondary/90 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Leads</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/leads"
          className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Back to CRM pipeline</span>
        </Link>
      </div>

      {/* Main Grid split-screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Lead Profile card info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-full min-h-[450px]">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    {lead.firstName} {lead.lastName}
                  </h2>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Source: {lead.source || 'Website'}
                  </span>
                </div>
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${getStatusBadge(
                    lead.status,
                  )}`}
                >
                  {lead.status}
                </span>
              </div>

              {/* Communication Links */}
              <div className="space-y-2 border-t pt-4 text-xs">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    <Phone size={14} className="text-primary/75" />
                    <span>{lead.phone}</span>
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    <Mail size={14} className="text-primary/75" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                )}
              </div>

              {/* Deal attributes */}
              <div className="space-y-3 border-t pt-4 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Budget</span>
                  <span className="font-extrabold text-foreground text-sm flex items-center">
                    <IndianRupee size={13} className="text-emerald-500" />
                    {lead.budget
                      ? parseFloat(lead.budget).toLocaleString('en-IN', {
                          minimumFractionDigits: 0,
                        })
                      : 'Not disclosed'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Timeline</span>
                  <span className="font-bold text-foreground">{lead.timeline || 'Flexible'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Financing</span>
                  <span className="font-bold text-foreground">{lead.financingStatus || 'Self-funded'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Assigned Agent</span>
                  <span className="font-bold text-foreground flex items-center space-x-1">
                    <User size={13} className="text-primary/70 shrink-0" />
                    <span>
                      {lead.assignedUser
                        ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`
                        : 'Unassigned'}
                    </span>
                  </span>
                </div>

                {lead.preferredUnit && (
                  <div className="border-t pt-3 mt-3">
                    <span className="font-semibold uppercase tracking-wider text-[10px] block mb-1">
                      Preferred Unit Choice
                    </span>
                    <div className="flex items-center space-x-2 bg-secondary/30 p-2.5 rounded-lg text-foreground font-semibold">
                      <Building size={14} className="text-primary shrink-0" />
                      <div>
                        <div>Unit {lead.preferredUnit.unitNumber}</div>
                        <div className="text-[9px] text-muted-foreground font-medium">
                          {lead.preferredUnit.project?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {lead.notes && (
                  <div className="border-t pt-3 mt-3">
                    <span className="font-semibold uppercase tracking-wider text-[10px] block mb-1">
                      Description Notes
                    </span>
                    <p className="text-[11px] leading-relaxed text-muted-foreground bg-muted/30 p-2.5 rounded-lg border">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Site Visit & Calendar Sync Banner */}
            <div className="pt-4 border-t mt-4">
              <button
                onClick={() => setIsSiteVisitOpen(true)}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white py-2.5 text-xs font-extrabold shadow-md hover:opacity-95 transition-all"
              >
                <Clock size={14} />
                <span>Book Site Visit & Sync Calendar</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t mt-4 flex gap-3 shrink-0">
              <button
                onClick={() => setIsEditOpen(true)}
                className="w-1/2 flex items-center justify-center space-x-1.5 rounded-lg border border-input bg-background py-2 text-xs font-semibold hover:bg-accent transition-colors shadow-sm"
              >
                <Edit2 size={13} />
                <span>Edit Lead</span>
              </button>
              {isEditor && (
                <button
                  onClick={handleDelete}
                  className="w-1/2 flex items-center justify-center space-x-1.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive py-2 text-xs font-semibold hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-sm text-foreground mb-4 flex items-center space-x-2">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <span>AI Analysis Insights</span>
            </h3>
            <AiInsightsPanel leadId={id!} />
          </div>
        </div>

        {/* Right Side: Timeline & Chat Workspace Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection Row */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              CRM History & Log
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'conversations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Conversations & Chat
            </button>
          </div>

          {activeTab === 'history' ? (
            <div className="space-y-6">
              {/* Quick activity log Form */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="font-bold text-sm text-foreground mb-4 flex items-center space-x-2">
                  <Activity size={16} className="text-primary" />
                  <span>Log Activity Comments</span>
                </h3>

                <form onSubmit={handleActivitySubmit} className="space-y-4">
                  {logError && (
                    <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                      <AlertCircle className="shrink-0 mt-0.5" size={18} />
                      <span>{logError}</span>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="w-1/4 shrink-0">
                      <select
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs font-semibold"
                      >
                        <option value="NOTE">Log Note</option>
                        <option value="CALL">Logged Call</option>
                        <option value="EMAIL">Email sent</option>
                        <option value="MEETING">Meeting</option>
                        <option value="TASK">Task completed</option>
                      </select>
                    </div>
                    <div className="flex-1 relative flex">
                      <input
                        type="text"
                        required
                        value={activityText}
                        onChange={(e) => setActivityText(e.target.value)}
                        placeholder="Enter activity description details (e.g. Lead requested site layout models)..."
                        className="w-full pl-3 pr-10 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                      />
                      <button
                        type="submit"
                        disabled={logging || !activityText.trim()}
                        className="absolute right-1 top-1 p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
                      >
                        {logging ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Activity Timeline List */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="font-bold text-sm text-foreground mb-6 flex items-center space-x-2">
                  <Clock size={16} className="text-primary" />
                  <span>CRM History Timeline</span>
                </h3>

                {lead.activities.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No activity logs registered.
                  </div>
                ) : (
                  <div className="relative border-l border-primary/20 ml-3 pl-6 space-y-6">
                    {lead.activities.map((act) => (
                      <div key={act.id} className="relative group">
                        {/* Circle icon marker on line */}
                        <span className="absolute -left-[31px] top-0.5 p-1 rounded-full bg-background border-2 border-primary text-primary shrink-0 transition-transform group-hover:scale-110">
                          {getActivityIcon(act.type)}
                        </span>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-extrabold uppercase tracking-wide text-primary">
                              {act.type.replace('_', ' ')}
                            </span>
                            <span className="text-muted-foreground font-semibold">
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
          ) : (
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <ConversationsPanel leadId={id!} />
            </div>
          )}
        </div>
      </div>

      {/* Edit Lead Modal Overlay */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold">Update Lead Profile</h4>
                <p className="text-[11px] text-muted-foreground">Modify customer pipeline identifiers.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {updateError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{updateError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="+1 (234) 567-890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="250000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Lead Source
                  </label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                    placeholder="Website"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Purchase Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    <option value="Immediate">Immediate (1 month)</option>
                    <option value="1-3 Months">1-3 months</option>
                    <option value="3-6 Months">3-6 months</option>
                    <option value="6+ Months">Flexible (6+ months)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Financing Status
                  </label>
                  <select
                    value={financingStatus}
                    onChange={(e) => setFinancingStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    <option value="Pre-approved">Pre-approved Mortgage</option>
                    <option value="Cash buyer">Cash Buyer</option>
                    <option value="Needs mortgage">Needs Pre-approval</option>
                    <option value="Self-funded">Self-funded/Equity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Status Pipeline
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="NEGOTIATING">Negotiating</option>
                    <option value="WON">Won (Converted)</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Assign Agent
                  </label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2-tier preferred unit selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Filter Unit by Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setPreferredUnitId('');
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    <option value="">No Project Filter</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Preferred Unit
                  </label>
                  <select
                    value={preferredUnitId}
                    onChange={(e) => setPreferredUnitId(e.target.value)}
                    disabled={!selectedProjectId}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold disabled:opacity-50"
                  >
                    <option value="">No Unit Mapped</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Lead Description & Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm h-16 resize-none"
                  placeholder="Notes..."
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-1/2 py-2.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-1/2 flex justify-center items-center py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Visit Booking Modal */}
      {isSiteVisitOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="text-primary" size={18} />
                <h3 className="text-base font-extrabold text-foreground">Schedule Site Visit & Sync Calendar</h3>
              </div>
              <button
                onClick={() => setIsSiteVisitOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSchedulingVisit(true);
                try {
                  const res = await api.post(`/leads/${id}/site-visit`, {
                    visitDate: siteVisitDate,
                    notes: siteVisitNotes,
                  });
                  if (res.data.success) {
                    setGoogleCalUrl(res.data.data.googleCalendarUrl);
                    setIcsDownloadUrl(res.data.data.icsUrl);
                    fetchLead();
                  }
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to schedule visit:', err);
                } finally {
                  setSchedulingVisit(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Site Visit Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={siteVisitDate}
                  onChange={(e) => setSiteVisitDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Special Notes / Meeting Location
                </label>
                <textarea
                  value={siteVisitNotes}
                  onChange={(e) => setSiteVisitNotes(e.target.value)}
                  placeholder="E.g. Meet buyer at PropX Sales Lounge, Tower B..."
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-xs h-20"
                />
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="submit"
                  disabled={schedulingVisit}
                  className="flex-1 py-2.5 bg-primary text-white text-xs font-extrabold rounded-lg hover:bg-primary/95 transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  {schedulingVisit ? <Loader2 className="animate-spin" size={14} /> : <span>Confirm & Generate Links</span>}
                </button>
              </div>

              {googleCalUrl && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400">✅ Site Visit Scheduled! Sync your calendar:</div>
                  <div className="flex gap-2">
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-center font-bold hover:bg-emerald-700 transition-all text-[11px]"
                    >
                      📅 Add to Google Calendar
                    </a>
                    <a
                      href={`http://localhost:5000${icsDownloadUrl}`}
                      download
                      className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-center font-bold hover:bg-slate-900 transition-all text-[11px]"
                    >
                      📥 Download iCal (.ics)
                    </a>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
