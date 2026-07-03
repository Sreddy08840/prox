import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { Loader2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  role: string;
}

export default function OrgProfilePanel({ user }: { user: User }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const response = await api.get('/organizations/me');
        if (response.data.success) {
          const orgData = response.data.data;
          setOrg(orgData);
          setName(orgData.name);
          setSlug(orgData.slug);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error?.message || 'Failed to load organization profile');
        } else {
          setError('Failed to load organization profile');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put('/organizations/me', { name, slug });
      if (response.data.success) {
        setOrg(response.data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to update organization details');
      } else {
        setError('Failed to update organization details');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Organization Profile {org && `— ${org.name}`}
        </h2>
        <p className="text-sm text-muted-foreground">
          View and configure your team name and URL identifiers.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        {!isAdmin && (
          <div className="rounded-lg bg-amber-500/15 p-4 text-amber-500 flex items-start space-x-3 mb-6 text-sm">
            <ShieldAlert className="shrink-0 mt-0.5" size={18} />
            <span>
              You are signed in as a **{user.role}**. Organization updates are restricted to **Admin** users.
            </span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-500/15 p-4 text-emerald-500 flex items-start space-x-3 text-sm">
              <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
              <span>Organization profile updated successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                disabled={!isAdmin || updating}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-60"
                placeholder="E.g., PropX Developments"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Organization URL Slug
              </label>
              <div className="flex rounded-lg shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-muted text-muted-foreground text-xs">
                  propx.com/org/
                </span>
                <input
                  type="text"
                  disabled={!isAdmin || updating}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-r-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm disabled:opacity-60"
                  placeholder="slug-identifier"
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updating}
                className="flex items-center justify-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
