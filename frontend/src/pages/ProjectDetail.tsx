import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import axios from 'axios';
import UnitTypesPanel from '../components/UnitTypesPanel';
import UnitsInventoryPanel from '../components/UnitsInventoryPanel';
import {
  Loader2,
  MapPin,
  Calendar,
  ChevronLeft,
  Edit2,
  Trash2,
  Sparkles,
  X,
  AlertCircle,
  Layout,
  Home,
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

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('PLANNING');
  const [launchDate, setLaunchDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'units' | 'types'>('units');

  // Role details
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

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/projects/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setProject(data);
        setName(data.name);
        setDescription(data.description || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setStatus(data.status);
        setLaunchDate(
          data.launchDate ? new Date(data.launchDate).toISOString().split('T')[0] : '',
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to load project details');
      } else {
        setError('Failed to load project details');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);

    try {
      const formattedLaunchDate = launchDate ? new Date(launchDate).toISOString() : null;

      const response = await api.put(`/projects/${id}`, {
        name,
        description: description || undefined,
        address: address || undefined,
        city: city || undefined,
        status,
        launchDate: formattedLaunchDate,
      });

      if (response.data.success) {
        setIsEditOpen(false);
        fetchProject();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setUpdateError(err.response?.data?.error?.message || 'Failed to update project');
      } else {
        setUpdateError('Failed to update project');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This will soft delete the project.')) {
      return;
    }

    try {
      const response = await api.delete(`/projects/${id}`);
      if (response.data.success) {
        navigate('/projects');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to delete project');
      } else {
        setError('Failed to delete project');
      }
    }
  };

  const getStatusColor = (projectStatus: string) => {
    switch (projectStatus) {
      case 'PLANNING':
        return 'bg-blue-500/15 border-blue-500/20 text-blue-500';
      case 'UNDER_CONSTRUCTION':
        return 'bg-amber-500/15 border-amber-500/20 text-amber-500';
      case 'COMPLETED':
        return 'bg-emerald-500/15 border-emerald-500/20 text-emerald-500';
      case 'CANCELLED':
        return 'bg-rose-500/15 border-rose-500/20 text-rose-500';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4 max-w-md mx-auto py-10">
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error || 'Project not found.'}</span>
        </div>
        <Link
          to="/projects"
          className="flex items-center justify-center space-x-2 w-full rounded-lg bg-secondary py-2 text-sm font-semibold hover:bg-secondary/90 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button and breadcrumb */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center space-x-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Back to Portfolio</span>
        </Link>
      </div>

      {/* Main Header card */}
      <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Decorative corner background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {project.name}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                  project.status,
                )}`}
              >
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              {project.description || 'No description provided for this project.'}
            </p>

            {/* Address & Launch */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground font-medium">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-primary/75" />
                <span>
                  {project.address || ''}
                  {project.address && project.city ? ', ' : ''}
                  {project.city || 'No Location set'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-primary/75" />
                <span>
                  Launch:{' '}
                  {project.launchDate
                    ? new Date(project.launchDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not announced'}
                </span>
              </div>
            </div>
          </div>

          {/* Action triggers */}
          {isEditor && (
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center space-x-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-all shadow-sm"
              >
                <Edit2 size={15} />
                <span>Edit Project</span>
              </button>
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/10 transition-all"
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs list & content panels */}
      <div className="space-y-6">
        <div className="border-b pb-1 flex space-x-6">
          <button
            onClick={() => setActiveTab('units')}
            className={`text-sm font-semibold pb-2.5 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'units'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home size={15} />
            <span>Inventory ({project._count.units})</span>
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`text-sm font-semibold pb-2.5 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'types'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layout size={15} />
            <span>Unit Types ({project._count.unitTypes})</span>
          </button>
        </div>

        {/* Tab content panels */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {activeTab === 'units' ? (
            <UnitsInventoryPanel projectId={id!} />
          ) : (
            <UnitTypesPanel projectId={id!} />
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {isEditOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent"
              title="Close"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Update Property Project</h3>
                <p className="text-xs text-muted-foreground">Modify detail fields for project registration.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {updateError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{updateError}</span>
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
                  placeholder="Sunrise Towers"
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
                  placeholder="Sunrise features, proximities..."
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
                    placeholder="102 Park Ave"
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
                  onClick={() => setIsEditOpen(false)}
                  className="w-1/2 py-2.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-1/2 flex justify-center items-center py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Save Changes'
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
