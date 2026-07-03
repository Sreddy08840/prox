import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  status: string;
  launchDate: string | null;
  _count: {
    units: number;
    unitTypes: number;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Projects() {
  const navigate = useNavigate();

  // Project List State
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Create Project Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('PLANNING');
  const [launchDate, setLaunchDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Current User (simulated check)
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    // Read JWT role or set default mock
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

  const isEditor = currentUser?.role === 'ADMIN' || currentUser?.role === 'SALES_MANAGER';

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/projects', {
        params: {
          page,
          limit: 6,
          search,
          status: statusFilter || undefined,
          sortBy,
          sortOrder,
        },
      });

      if (response.data.success) {
        setProjects(response.data.data.projects);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to load projects');
      } else {
        setError('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const formattedLaunchDate = launchDate ? new Date(launchDate).toISOString() : null;

      const response = await api.post('/projects', {
        name,
        description: description || undefined,
        address: address || undefined,
        city: city || undefined,
        status,
        launchDate: formattedLaunchDate,
      });

      if (response.data.success) {
        setIsOpen(false);
        // Clear fields
        setName('');
        setDescription('');
        setAddress('');
        setCity('');
        setStatus('PLANNING');
        setLaunchDate('');
        fetchProjects();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setCreateError(err.response?.data?.error?.message || 'Failed to create project');
      } else {
        setCreateError('Failed to create project');
      }
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (projectStatus: string) => {
    switch (projectStatus) {
      case 'PLANNING':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'UNDER_CONSTRUCTION':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'COMPLETED':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'CANCELLED':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your real estate developments, layout types, and inventory.
          </p>
        </div>
        {isEditor && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Query Filters Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by name, address, or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-background border rounded-lg px-2.5 py-1.5 text-sm w-full sm:w-auto">
            <Filter size={14} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="UNDER_CONSTRUCTION">Under Construction</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2 bg-background border rounded-lg px-2.5 py-1.5 text-sm w-full sm:w-auto">
            <ArrowUpDown size={14} className="text-muted-foreground" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
                setPage(1);
              }}
              className="bg-transparent border-0 focus:ring-0 focus:outline-none text-xs font-semibold"
            >
              <option value="createdAt-desc">Newest Created</option>
              <option value="createdAt-asc">Oldest Created</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="launchDate-desc">Launch Date (Latest)</option>
              <option value="launchDate-asc">Launch Date (Earliest)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Building2 className="mx-auto text-muted-foreground mb-4 opacity-50 animate-bounce" size={48} />
          <h3 className="text-lg font-semibold">No Projects Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter fields, or create a new real estate project profile.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top header row */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                        project.status,
                      )}`}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                    <Building2 className="text-muted-foreground/60 group-hover:text-primary transition-colors" size={18} />
                  </div>

                  {/* Body title & description */}
                  <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 h-8">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2 border-t pt-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">
                        {project.address || ''}
                        {project.address && project.city ? ', ' : ''}
                        {project.city || 'No location set'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="shrink-0" />
                      <span>
                        Launch:{' '}
                        {project.launchDate
                          ? new Date(project.launchDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Not announced'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counter Footer */}
                <div className="grid grid-cols-2 gap-4 mt-6 border-t pt-4 text-center">
                  <div>
                    <div className="font-bold text-foreground text-sm">
                      {project._count.unitTypes}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                      Layout Types
                    </div>
                  </div>
                  <div className="border-l">
                    <div className="font-bold text-foreground text-sm">
                      {project._count.units}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                      Total Units
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-xs text-muted-foreground">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Create Property Project</h3>
                <p className="text-xs text-muted-foreground">Add metadata fields to register a project.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="E.g., Sunrise Towers"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm h-20 resize-none"
                  placeholder="Describe properties, features, proximity structures..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="102 Park Avenue"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="New York"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Launch Date
                  </label>
                  <input
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-1/2 flex justify-center items-center py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Create Project'
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
