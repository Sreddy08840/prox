import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Plus,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Edit2,
  Home,
  IndianRupee,
  Key,
} from 'lucide-react';

interface Unit {
  id: string;
  unitNumber: string;
  floor: number | null;
  status: string;
}

interface Project {
  id: string;
  name: string;
}

interface Lease {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string | null;
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED' | 'UPCOMING';
  notes: string | null;
  unit: {
    id: string;
    unitNumber: string;
    project: {
      id: string;
      name: string;
    };
  };
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  leases: Lease[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Tenants() {
  // Lists State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Modal Triggers
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [leasingTenant, setLeasingTenant] = useState<Tenant | null>(null);

  // Forms State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [leaseNotes, setLeaseNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Tenants List
  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/tenants', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter || undefined,
        },
      });
      if (res.data.success) {
        setTenants(res.data.data.tenants);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to fetch tenants');
      } else {
        setError('Failed to fetch tenants');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // Fetch Projects (for leasing dropdown)
  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects', { params: { limit: 100 } });
      if (res.data.success) {
        setProjects(res.data.data.projects);
      }
    } catch (_err) {
      // Ignore
    }
  }, []);

  // Fetch Available Units in Selected Project
  const fetchAvailableUnits = useCallback(async (projectId: string) => {
    if (!projectId) {
      setUnits([]);
      return;
    }
    try {
      const res = await api.get(`/projects/${projectId}/units`, { params: { limit: 100 } });
      if (res.data.success) {
        // Filter only AVAILABLE units
        const filtered = res.data.data.units.filter((u: Unit) => u.status === 'AVAILABLE');
        setUnits(filtered);
        if (filtered.length > 0) {
          setSelectedUnitId(filtered[0].id);
        } else {
          setSelectedUnitId('');
        }
      }
    } catch (_err) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchAvailableUnits(selectedProjectId);
  }, [selectedProjectId, fetchAvailableUnits]);

  // Tenant CRUD actions
  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      let res;
      if (editingTenant) {
        res = await api.put(`/tenants/${editingTenant.id}`, {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
        });
      } else {
        res = await api.post('/tenants', {
          firstName,
          lastName,
          email: email || null,
          phone: phone || null,
        });
      }

      if (res.data.success) {
        setIsTenantModalOpen(false);
        setEditingTenant(null);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        fetchTenants();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error?.message || 'Failed to save tenant');
      } else {
        setSubmitError('Failed to save tenant');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFirstName(tenant.firstName);
    setLastName(tenant.lastName);
    setEmail(tenant.email || '');
    setPhone(tenant.phone || '');
    setSubmitError(null);
    setIsTenantModalOpen(true);
  };

  const handleDeleteTenant = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant profile?')) return;
    try {
      const res = await api.delete(`/tenants/${id}`);
      if (res.data.success) {
        fetchTenants();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error?.message || 'Failed to delete tenant');
      } else {
        alert('Failed to delete tenant');
      }
    }
  };

  // Lease actions
  const handleLeaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      setSubmitError('An available unit must be selected');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post(`/tenants/${leasingTenant?.id}/leases`, {
        unitId: selectedUnitId,
        startDate,
        endDate,
        rentAmount: parseFloat(rentAmount),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        notes: leaseNotes || null,
      });

      if (res.data.success) {
        setIsLeaseModalOpen(false);
        setLeasingTenant(null);
        setSelectedProjectId('');
        setSelectedUnitId('');
        setStartDate('');
        setEndDate('');
        setRentAmount('');
        setDepositAmount('');
        setLeaseNotes('');
        fetchTenants();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error?.message || 'Failed to register lease');
      } else {
        setSubmitError('Failed to register lease');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminateLease = async (leaseId: string) => {
    if (!window.confirm('Are you sure you want to terminate this lease? The unit status will revert to AVAILABLE.')) return;
    try {
      const res = await api.put(`/tenants/leases/${leaseId}/terminate`);
      if (res.data.success) {
        fetchTenants();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error?.message || 'Failed to terminate lease');
      } else {
        alert('Failed to terminate lease');
      }
    }
  };

  const getLeaseStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'UPCOMING':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'EXPIRED':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'TERMINATED':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  // Metrics summary
  const activeTenantsCount = tenants.filter(t => t.leases.some(l => l.status === 'ACTIVE')).length;
  const activeRentSum = tenants.reduce((sum, t) => {
    const activeLease = t.leases.find(l => l.status === 'ACTIVE');
    return sum + (activeLease ? parseFloat(activeLease.rentAmount) : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants & Leases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tenant contact profiles, register lease contracts, and assign units.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTenant(null);
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            setSubmitError(null);
            setIsTenantModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors w-full sm:w-auto"
        >
          <Plus size={15} />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Tenants</span>
              <h4 className="text-xl font-black text-foreground mt-1">{pagination.total}</h4>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Users size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Leases</span>
              <h4 className="text-xl font-black text-foreground mt-1">{activeTenantsCount}</h4>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <CheckCircle size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Monthly Rent Portfolio</span>
              <h4 className="text-xl font-black text-foreground mt-1 flex items-center">
                <IndianRupee size={16} className="text-emerald-500 shrink-0" />
                {activeRentSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h4>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <IndianRupee size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-1.5 text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Lease</option>
          <option value="UPCOMING">Upcoming Lease</option>
          <option value="INACTIVE">No Active Lease</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tenants Table/Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : tenants.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Users className="mx-auto text-muted-foreground mb-4 opacity-50" size={48} />
          <h3 className="text-lg font-semibold">No Tenants Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting filters, or add a new tenant record to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {tenants.map((tenant) => {
              const activeLease = tenant.leases.find((l) => l.status === 'ACTIVE' || l.status === 'UPCOMING');
              const historicalLeases = tenant.leases.filter((l) => l.status !== 'ACTIVE' && l.status !== 'UPCOMING');

              return (
                <div key={tenant.id} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-6">
                  {/* Left Column: Profile Info */}
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-base text-foreground">
                        {tenant.firstName} {tenant.lastName}
                      </h3>
                      {activeLease ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getLeaseStatusBadge(activeLease.status)}`}>
                          Lease: {activeLease.status}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-secondary/50 border-border text-muted-foreground">
                          No Active Lease
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-semibold block text-[10px] uppercase text-muted-foreground/60 tracking-wider">Email Address</span>
                        <span>{tenant.email || '—'}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[10px] uppercase text-muted-foreground/60 tracking-wider">Phone Number</span>
                        <span>{tenant.phone || '—'}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2 border-t text-[11px]">
                      <button
                        onClick={() => handleEditTenant(tenant)}
                        className="flex items-center space-x-1 border rounded-lg px-2.5 py-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors font-semibold"
                      >
                        <Edit2 size={12} />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="flex items-center space-x-1 border border-destructive/10 bg-destructive/5 text-destructive rounded-lg px-2.5 py-1.5 hover:bg-destructive/10 transition-colors font-semibold"
                      >
                        <Trash2 size={12} />
                        <span>Delete Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Lease Details */}
                  <div className="flex-1 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6 space-y-4">
                    {activeLease ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Assigned Unit</span>
                            <div className="font-extrabold text-sm flex items-center space-x-1.5 text-foreground mt-0.5">
                              <Home size={14} className="text-primary shrink-0" />
                              <span>{activeLease.unit.unitNumber} ({activeLease.unit.project.name})</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleTerminateLease(activeLease.id)}
                            className="text-xs font-semibold text-destructive hover:underline"
                          >
                            Terminate Lease
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground/60 tracking-wider block">Monthly Rent</span>
                            <span className="font-black text-foreground flex items-center">
                              <IndianRupee size={13} className="text-emerald-500" />
                              {parseFloat(activeLease.rentAmount).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-muted-foreground/60 tracking-wider block">Lease Duration</span>
                            <span className="font-medium text-muted-foreground">
                              {new Date(activeLease.startDate).toLocaleDateString()} - {new Date(activeLease.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {activeLease.notes && (
                          <div className="text-[11px] bg-muted/50 border rounded-lg p-2.5 italic text-muted-foreground">
                            Note: {activeLease.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col justify-center items-center py-6 text-center border-2 border-dashed border-muted/50 rounded-xl bg-muted/10">
                        <Key className="text-muted-foreground/40 mb-2" size={24} />
                        <h4 className="font-bold text-xs text-muted-foreground">Lease not configured</h4>
                        <button
                          onClick={() => {
                            setLeasingTenant(tenant);
                            setSubmitError(null);
                            setIsLeaseModalOpen(true);
                          }}
                          className="mt-3 inline-flex items-center space-x-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          <Plus size={12} />
                          <span>Assign Lease</span>
                        </button>
                      </div>
                    )}

                    {/* Historical Leases List */}
                    {historicalLeases.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider block mb-1">Historical Leases</span>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {historicalLeases.map((l) => (
                            <div key={l.id} className="text-[10px] flex items-center justify-between border bg-muted/30 rounded px-2 py-1">
                              <span className="font-semibold text-muted-foreground">
                                Unit {l.unit.unitNumber} ({l.unit.project.name})
                              </span>
                              <span className="text-muted-foreground/60">
                                {new Date(l.startDate).getFullYear()} - {new Date(l.endDate).getFullYear()} • {l.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 text-xs">
              <span className="text-muted-foreground">
                Showing tenant {page * 10 - 9} to {Math.min(page * 10, pagination.total)} of {pagination.total} tenants
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <X size={14} />
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-1.5 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Create / Edit Tenant */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsTenantModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-4">
              {editingTenant ? 'Edit Tenant Profile' : 'Add Tenant Profile'}
            </h3>
            <form onSubmit={handleTenantSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg bg-destructive/15 p-3 text-destructive flex items-start space-x-2 text-xs">
                  <AlertCircle size={15} />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+1 (234) 567-890"
                />
              </div>
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(false)}
                  className="w-1/2 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 flex justify-center items-center py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : 'Save Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Lease */}
      {isLeaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsLeaseModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-1">Assign Lease Contract</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Tenant: {leasingTenant?.firstName} {leasingTenant?.lastName}
            </p>
            <form onSubmit={handleLeaseSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg bg-destructive/15 p-3 text-destructive flex items-start space-x-2 text-xs">
                  <AlertCircle size={15} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Project</label>
                  <select
                    required
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Unit Number (Available)</label>
                  <select
                    required
                    disabled={!selectedProjectId}
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium disabled:opacity-50"
                  >
                    {units.length === 0 ? (
                      <option value="">No units available</option>
                    ) : (
                      units.map((u) => (
                        <option key={u.id} value={u.id}>{u.unitNumber} (Flr {u.floor ?? '—'})</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Monthly Rent ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Security Deposit ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none"
                    placeholder="2400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Lease Notes / Terms</label>
                <textarea
                  value={leaseNotes}
                  onChange={(e) => setLeaseNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="E.g., Deposit covers first & last month rent. Pets allowed..."
                />
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsLeaseModalOpen(false)}
                  className="w-1/2 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 flex justify-center items-center py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : 'Launch Lease'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
