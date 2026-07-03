import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Plus,
  Layout,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface UnitType {
  id: string;
  name: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqFt: number | null;
  basePrice: string | null;
}

interface UnitTypesPanelProps {
  projectId: string;
}

export default function UnitTypesPanel({ projectId }: UnitTypesPanelProps) {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sizeSqFt, setSizeSqFt] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const isEditor = currentUser?.role === 'ADMIN' || currentUser?.role === 'SALES_MANAGER';

  const fetchUnitTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/projects/${projectId}/unit-types`);
      if (response.data.success) {
        setUnitTypes(response.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to load layout configurations');
      } else {
        setError('Failed to load layout configurations');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchUnitTypes();
  }, [fetchUnitTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.post(`/projects/${projectId}/unit-types`, {
        name,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        sizeSqFt: sizeSqFt ? parseFloat(sizeSqFt) : null,
        basePrice: basePrice ? parseFloat(basePrice) : null,
      });

      if (response.data.success) {
        setIsOpen(false);
        // Clear
        setName('');
        setBedrooms('');
        setBathrooms('');
        setSizeSqFt('');
        setBasePrice('');
        fetchUnitTypes();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error?.message || 'Failed to create layout config');
      } else {
        setSubmitError('Failed to create layout config');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Unit Layout Configurations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure floor plans, bedroom layouts, dimensions, and base pricing estimates.
          </p>
        </div>
        {isEditor && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors"
          >
            <Plus size={14} />
            <span>Add Layout</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {unitTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Layout className="mx-auto text-muted-foreground mb-3 opacity-40 animate-pulse" size={40} />
          <h4 className="font-semibold text-sm">No Layouts Defined</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Get started by defining layout templates like "1 BHK Apartment", "2 BHK Suite", or "Penthouse".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unitTypes.map((type) => (
            <div
              key={type.id}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                    {type.name}
                  </h4>
                  <Layout className="text-muted-foreground/40" size={16} />
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-b py-3 text-center text-xs text-muted-foreground">
                  <div>
                    <div className="flex items-center justify-center space-x-1 text-foreground font-semibold">
                      <Bed size={13} className="text-primary/70" />
                      <span>{type.bedrooms !== null ? type.bedrooms : '—'}</span>
                    </div>
                    <div className="text-[10px] uppercase font-semibold mt-0.5 text-muted-foreground/80 tracking-wider">
                      Beds
                    </div>
                  </div>
                  <div className="border-l border-r">
                    <div className="flex items-center justify-center space-x-1 text-foreground font-semibold">
                      <Bath size={13} className="text-primary/70" />
                      <span>{type.bathrooms !== null ? type.bathrooms : '—'}</span>
                    </div>
                    <div className="text-[10px] uppercase font-semibold mt-0.5 text-muted-foreground/80 tracking-wider">
                      Baths
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center space-x-1 text-foreground font-semibold">
                      <Maximize2 size={13} className="text-primary/70" />
                      <span>{type.sizeSqFt !== null ? `${type.sizeSqFt}` : '—'}</span>
                    </div>
                    <div className="text-[10px] uppercase font-semibold mt-0.5 text-muted-foreground/80 tracking-wider">
                      Sq Ft
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Base Pricing
                  </span>
                  <span className="font-extrabold text-foreground text-sm flex items-center">
                    <DollarSign size={14} className="text-emerald-500 shrink-0" />
                    {type.basePrice
                      ? parseFloat(type.basePrice).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add layout overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold">New Layout Configuration</h4>
                <p className="text-[11px] text-muted-foreground">Add a floor plan template for inventory mapping.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Layout Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="E.g., 2 BHK Apartment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Bedrooms Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Bathrooms Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Size (Sq Ft)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sizeSqFt}
                    onChange={(e) => setSizeSqFt(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Base Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="150000"
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 flex justify-center items-center py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    'Add Layout'
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
