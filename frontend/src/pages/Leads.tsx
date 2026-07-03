import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Plus,
  Search,
  Users,
  DollarSign,
  Phone,
  Mail,
  Sparkles,
  X,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  budget: string | null;
  assignedUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  preferredUnit: {
    id: string;
    unitNumber: string;
    project: {
      name: string;
    };
  } | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Agent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export default function Leads() {
  const navigate = useNavigate();

  // List states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & query filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Modal Creation Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('NEW');
  const [source, setSource] = useState('Website');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('Immediate');
  const [financingStatus, setFinancingStatus] = useState('Pre-approved');
  const [notes, setNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // CSV Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    duplicatesCount: number;
    errorsCount: number;
    logs: string[];
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/leads', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter || undefined,
          source: sourceFilter || undefined,
          assignedUserId: agentFilter || undefined,
          sortBy,
          sortOrder,
        },
      });

      if (response.data.success) {
        setLeads(response.data.data.leads);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to fetch leads');
      } else {
        setError('Failed to fetch leads');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sourceFilter, agentFilter, sortBy, sortOrder]);

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

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.post('/leads', {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        status,
        source,
        budget: budget ? parseFloat(budget) : null,
        timeline,
        financingStatus,
        notes: notes || undefined,
        assignedUserId: assignedUserId || undefined,
      });

      if (response.data.success) {
        setIsCreateOpen(false);
        // Clear
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setStatus('NEW');
        setSource('Website');
        setBudget('');
        setTimeline('Immediate');
        setFinancingStatus('Pre-approved');
        setNotes('');
        setAssignedUserId('');
        fetchLeads();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error?.message || 'Failed to create lead');
      } else {
        setSubmitError('Failed to create lead');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText) {
      setImportError('Please select or paste CSV data first');
      return;
    }
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const response = await api.post('/leads/import', { csvData: csvText });
      if (response.data.success) {
        setImportResult(response.data.data);
        fetchLeads();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setImportError(err.response?.data?.error?.message || 'Failed to import CSV');
      } else {
        setImportError('Failed to import CSV');
      }
    } finally {
      setImporting(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'NEW':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'CONTACTED':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'QUALIFIED':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-500';
      case 'NEGOTIATING':
        return 'bg-teal-500/10 border-teal-500/20 text-teal-500';
      case 'WON':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'LOST':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,firstName,lastName,email,phone,budget,source,timeline,financingStatus,status,notes\n' +
      'John,Doe,john.doe@example.com,+123456789,250000,Website,Immediate,Pre-approved,NEW,Very interested in penthouses.\n' +
      'Jane,Smith,jane.smith@example.com,+987654321,450000,Referral,3-6 months,Cash buyer,QUALIFIED,Wants 3 BHK near city center.\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'propx_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads & Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track inquiries, conversions, budgets, and manage sales agents.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setImportResult(null);
              setImportError(null);
              setCsvText('');
              setIsImportOpen(true);
            }}
            className="flex items-center justify-center space-x-2 rounded-lg border border-input bg-background px-4 py-2.5 text-xs font-semibold hover:bg-accent transition-colors shadow-sm w-1/2 sm:w-auto"
          >
            <FileSpreadsheet size={15} />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors w-1/2 sm:w-auto"
          >
            <Plus size={15} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Query Filters Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap w-full lg:w-auto items-center gap-3">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NEGOTIATING">Negotiating</option>
            <option value="WON">Won (Converted)</option>
            <option value="LOST">Lost</option>
          </select>

          {/* Source */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="CSV Import">CSV Import</option>
          </select>

          {/* Agent */}
          {agents.length > 0 && (
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))}
            </select>
          )}

          {/* Sorting */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
              setPage(1);
            }}
            className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="createdAt-desc">Newest Leads</option>
            <option value="createdAt-asc">Oldest Leads</option>
            <option value="budget-desc">Budget (High to Low)</option>
            <option value="budget-asc">Budget (Low to High)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Users className="mx-auto text-muted-foreground mb-4 opacity-50 animate-pulse" size={48} />
          <h3 className="text-lg font-semibold">No Leads Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting filters, searching different values, or add/import leads manually.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-full overflow-x-auto border rounded-xl bg-card shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Lead Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4 text-right">Budget</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4">Preferred Unit</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    {/* Name */}
                    <td className="px-6 py-4 font-bold text-foreground">
                      {lead.firstName} {lead.lastName}
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 space-y-1">
                      {lead.phone && (
                        <div className="flex items-center space-x-1.5 text-muted-foreground">
                          <Phone size={12} />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center space-x-1.5 text-muted-foreground">
                          <Mail size={12} />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </div>
                      )}
                      {!lead.phone && !lead.email && <span className="text-muted-foreground/60">No contact info</span>}
                    </td>

                    {/* Budget */}
                    <td className="px-6 py-4 text-right font-black text-foreground">
                      {lead.budget ? (
                        <span className="flex items-center justify-end">
                          <DollarSign size={13} className="text-emerald-500 shrink-0" />
                          {parseFloat(lead.budget).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Source */}
                    <td className="px-6 py-4 text-muted-foreground font-semibold">
                      {lead.source || 'Website'}
                    </td>

                    {/* Agent */}
                    <td className="px-6 py-4 font-medium text-muted-foreground">
                      {lead.assignedUser ? (
                        `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`
                      ) : (
                        <span className="text-muted-foreground/40 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="px-6 py-4 space-y-0.5 text-muted-foreground">
                      {lead.preferredUnit ? (
                        <>
                          <div className="font-bold text-foreground">{lead.preferredUnit.unitNumber}</div>
                          <div className="text-[10px]">{lead.preferredUnit.project?.name}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${getStatusBadge(
                          lead.status,
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 text-xs">
              <span className="text-muted-foreground">
                Showing lead {page * 10 - 9} to {Math.min(page * 10, pagination.total)} of {pagination.total} leads
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-1.5 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Add Lead Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold">Register Customer Lead</h4>
                <p className="text-[11px] text-muted-foreground">Add new contact inquiries to pipeline tracking.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{submitError}</span>
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
                    placeholder="E.g., John"
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
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    <option value="Website">Website</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                  </select>
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

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Lead Description & Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm h-16 resize-none"
                  placeholder="E.g., Client wants a view of the park, layout must be 2 BHK..."
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-1/2 py-2.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 flex justify-center items-center py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    'Add Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CSV Import Modal Overlay */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold">Import Leads from CSV</h4>
                <p className="text-[11px] text-muted-foreground">Upload columns to import multiple client leads.</p>
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              {importError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{importError}</span>
                </div>
              )}

              <div className="border border-dashed rounded-lg p-5 text-center bg-muted/20">
                <FileSpreadsheet className="mx-auto text-muted-foreground mb-2" size={32} />
                <label className="cursor-pointer block">
                  <span className="text-xs font-semibold text-primary underline hover:text-primary/90">
                    Choose a CSV File
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-muted-foreground mt-1">UTF-8 comma-separated list values only</p>
                <button
                  type="button"
                  onClick={downloadCSVTemplate}
                  className="mt-3 text-[10px] font-bold text-primary hover:underline bg-background px-3 py-1 border rounded-full shadow-sm"
                >
                  Download template file
                </button>
              </div>

              {csvText && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Loaded CSV Preview (Character Count: {csvText.length})
                  </label>
                  <textarea
                    readOnly
                    value={csvText.slice(0, 500) + (csvText.length > 500 ? '...' : '')}
                    className="w-full px-3 py-2 border rounded-lg bg-muted/30 text-muted-foreground text-[10px] h-20 resize-none focus:outline-none"
                  />
                </div>
              )}

              {importResult && (
                <div className="border rounded-lg p-4 bg-secondary/30 space-y-2">
                  <h5 className="font-bold text-xs">Import Statistics</h5>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <div className="font-bold text-emerald-600">{importResult.successCount}</div>
                      <div className="text-[9px] uppercase font-semibold text-muted-foreground mt-0.5">Success</div>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <div className="font-bold text-amber-600">{importResult.duplicatesCount}</div>
                      <div className="text-[9px] uppercase font-semibold text-muted-foreground mt-0.5">Duplicate</div>
                    </div>
                    <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      <div className="font-bold text-rose-600">{importResult.errorsCount}</div>
                      <div className="text-[9px] uppercase font-semibold text-muted-foreground mt-0.5">Errors</div>
                    </div>
                  </div>

                  {importResult.logs.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Conflict Log</div>
                      <div className="max-h-24 overflow-y-auto border rounded bg-background p-2 text-[9px] font-mono space-y-1 divide-y text-muted-foreground">
                        {importResult.logs.map((log, lIdx) => (
                          <div key={lIdx} className="pt-1 first:pt-0">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="w-1/2 py-2.5 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing || !csvText}
                  className="w-1/2 flex justify-center items-center py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {importing ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    'Start Import'
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
