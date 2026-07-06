import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  Plus,
  Search,
  IndianRupee,
  Home,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
} from 'lucide-react';

interface Unit {
  id: string;
  unitNumber: string;
  floor: number | null;
  status: string;
  price: string | null;
  areaSqFt: number | null;
  facing: string | null;
  unitTypeId: string;
  unitType: {
    name: string;
  };
}

interface UnitType {
  id: string;
  name: string;
}

interface Stats {
  totalCount: number;
  availableCount: number;
  reservedCount: number;
  soldCount: number;
  totalPortfolioValue: string;
  soldPortfolioValue: string;
  averagePrice: string;
  averageArea: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UnitsInventoryPanelProps {
  projectId: string;
}

export default function UnitsInventoryPanel({ projectId }: UnitsInventoryPanelProps) {
  // Inventory Lists
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // Add/Edit Form State
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [price, setPrice] = useState('');
  const [areaSqFt, setAreaSqFt] = useState('');
  const [facing, setFacing] = useState('');
  const [unitTypeId, setUnitTypeId] = useState('');
  const [unitStatus, setUnitStatus] = useState('AVAILABLE');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // User details
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

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${projectId}/units/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (_err) {
      // Keep fallback values
    }
  }, [projectId]);

  const fetchUnitTypes = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${projectId}/unit-types`);
      if (response.data.success) {
        setUnitTypes(response.data.data);
        if (response.data.data.length > 0 && !unitTypeId) {
          setUnitTypeId(response.data.data[0].id);
        }
      }
    } catch (_err) {
      // Ignore
    }
  }, [projectId, unitTypeId]);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/projects/${projectId}/units`, {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter || undefined,
          unitTypeId: typeFilter || undefined,
        },
      });

      if (response.data.success) {
        setUnits(response.data.data.units);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to fetch inventory');
      } else {
        setError('Failed to fetch inventory');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, page, search, statusFilter, typeFilter]);

  const refreshDashboard = useCallback(() => {
    fetchUnits();
    fetchStats();
    fetchUnitTypes();
  }, [fetchUnits, fetchStats, fetchUnitTypes]);

  useEffect(() => {
    refreshDashboard();
  }, [page, search, statusFilter, typeFilter, projectId, refreshDashboard]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitTypeId) {
      setSubmitError('A layout configuration must be selected');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.post(`/projects/${projectId}/units`, {
        unitNumber,
        floor: floor ? parseInt(floor) : null,
        status: unitStatus,
        price: price ? parseFloat(price) : null,
        areaSqFt: areaSqFt ? parseFloat(areaSqFt) : null,
        facing: facing || undefined,
        unitTypeId,
      });

      if (response.data.success) {
        setIsAddOpen(false);
        // Clear
        setUnitNumber('');
        setFloor('');
        setPrice('');
        setAreaSqFt('');
        setFacing('');
        setUnitStatus('AVAILABLE');
        refreshDashboard();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error?.message || 'Failed to create unit');
      } else {
        setSubmitError('Failed to create unit');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (unitId: string, nextStatus: string) => {
    try {
      const response = await api.put(`/units/${unitId}`, { status: nextStatus });
      if (response.data.success) {
        refreshDashboard();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error?.message || 'Failed to update status');
      } else {
        alert('Failed to update status');
      }
    }
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnitId(unit.id);
    setUnitNumber(unit.unitNumber);
    setFloor(unit.floor ? String(unit.floor) : '');
    setPrice(unit.price ? String(parseFloat(unit.price)) : '');
    setAreaSqFt(unit.areaSqFt ? String(unit.areaSqFt) : '');
    setFacing(unit.facing || '');
    setUnitTypeId(unit.unitTypeId);
    setUnitStatus(unit.status);
    setSubmitError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnitId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.put(`/units/${editingUnitId}`, {
        unitNumber,
        floor: floor ? parseInt(floor) : null,
        status: unitStatus,
        price: price ? parseFloat(price) : null,
        areaSqFt: areaSqFt ? parseFloat(areaSqFt) : null,
        facing: facing || undefined,
        unitTypeId,
      });

      if (response.data.success) {
        setIsEditOpen(false);
        setEditingUnitId(null);
        // Clear
        setUnitNumber('');
        setFloor('');
        setPrice('');
        setAreaSqFt('');
        setFacing('');
        setUnitStatus('AVAILABLE');
        refreshDashboard();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error?.message || 'Failed to update unit details');
      } else {
        setSubmitError('Failed to update unit details');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (unitId: string) => {
    if (!window.confirm('Are you sure you want to delete this unit from inventory?')) return;

    try {
      const response = await api.delete(`/units/${unitId}`);
      if (response.data.success) {
        refreshDashboard();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error?.message || 'Failed to delete unit');
      } else {
        alert('Failed to delete unit');
      }
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'RESERVED':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
      case 'SOLD':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'RENTED':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-500';
      case 'MAINTENANCE':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const occupancyRatio =
    stats && stats.totalCount > 0
      ? Math.round(((stats.soldCount + stats.reservedCount) / stats.totalCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Metrics Statistics Header */}
      {stats && stats.totalCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Portfolio Value */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Portfolio Value
                </span>
                <h4 className="text-xl font-black text-foreground mt-1 flex items-center">
                  <IndianRupee size={16} className="text-emerald-500 shrink-0" />
                  {parseFloat(stats.totalPortfolioValue).toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  })}
                </h4>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <IndianRupee size={16} />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              Avg price: ₹{parseFloat(stats.averagePrice).toLocaleString('en-IN', {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>

          {/* Occupancy Progress */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Sold / Reserved Ratio
                </span>
                <h4 className="text-xl font-black text-foreground mt-1">
                  {occupancyRatio}%
                </h4>
              </div>
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <CheckCircle size={16} />
              </div>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyRatio}%` }}
              />
            </div>
          </div>

          {/* Total Units count */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Inventory Units
                </span>
                <h4 className="text-xl font-black text-foreground mt-1">
                  {stats.totalCount}
                </h4>
              </div>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Home size={16} />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              Avg area: {Math.round(stats.averageArea)} sq ft
            </div>
          </div>

          {/* Sold Portfolio value */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Realized Book Value
                </span>
                <h4 className="text-xl font-black text-foreground mt-1 flex items-center text-emerald-600">
                  <IndianRupee size={16} className="shrink-0" />
                  {parseFloat(stats.soldPortfolioValue).toLocaleString('en-IN', {
                    maximumFractionDigits: 0,
                  })}
                </h4>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              {stats.soldCount} units sold
            </div>
          </div>
        </div>
      )}

      {/* 2. Search, Filter, Add Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap flex-1 gap-3 items-center">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Search unit number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="RENTED">Rented</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          {/* Unit Type layout filter */}
          {unitTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Layouts</option>
              {unitTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Add button trigger */}
        {isEditor && unitTypes.length > 0 && (
          <button
            onClick={() => {
              setSubmitError(null);
              setIsAddOpen(true);
            }}
            className="flex items-center space-x-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>Add Unit</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Table lists */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : units.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Home className="mx-auto text-muted-foreground mb-3 opacity-40 animate-pulse" size={40} />
          <h4 className="font-semibold text-sm">No Units Registered</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Try adjusting filters or register unit layout templates first to enable adding physical units.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Responsive Table Wrapper */}
          <div className="w-full overflow-x-auto border rounded-xl bg-card shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Unit Number</th>
                  <th className="px-5 py-3">Layout (Type)</th>
                  <th className="px-5 py-3 text-center">Floor</th>
                  <th className="px-5 py-3 text-center">Facing</th>
                  <th className="px-5 py-3 text-center">Area (Sq Ft)</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  {isEditor && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-muted/10 transition-colors">
                    {/* Unit Number */}
                    <td className="px-5 py-3 font-bold text-foreground">
                      {unit.unitNumber}
                    </td>

                    {/* Layout Type */}
                    <td className="px-5 py-3 font-semibold text-muted-foreground">
                      {unit.unitType?.name || 'Unknown Layout'}
                    </td>

                    {/* Floor */}
                    <td className="px-5 py-3 text-center text-muted-foreground">
                      {unit.floor !== null ? unit.floor : '—'}
                    </td>

                    {/* Facing */}
                    <td className="px-5 py-3 text-center text-muted-foreground font-medium">
                      {unit.facing || '—'}
                    </td>

                    {/* Area */}
                    <td className="px-5 py-3 text-center text-muted-foreground font-semibold">
                      {unit.areaSqFt !== null ? `${unit.areaSqFt} sqft` : '—'}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3 text-right font-black text-foreground">
                      {unit.price
                        ? `₹${parseFloat(unit.price).toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                          })}`
                        : '—'}
                    </td>

                    {/* Status Badge with inline mutation */}
                    <td className="px-5 py-3 text-center">
                      {isEditor ? (
                        <select
                          value={unit.status}
                          onChange={(e) => handleStatusChange(unit.id, e.target.value)}
                          className={`inline-flex px-2.5 py-0.5 border rounded-full text-[10px] font-bold tracking-wide focus:outline-none focus:ring-0 ${getStatusBadge(
                            unit.status,
                          )}`}
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="RESERVED">Reserved</option>
                          <option value="SOLD">Sold</option>
                          <option value="RENTED">Rented</option>
                          <option value="MAINTENANCE">Maintenance</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${getStatusBadge(
                            unit.status,
                          )}`}
                        >
                          {unit.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {isEditor && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal(unit)}
                            className="p-1.5 border rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(unit.id)}
                              className="p-1.5 border border-destructive/10 bg-destructive/5 text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 text-[11px]">
              <span className="text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} units)
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

      {/* Add unit modal overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold">Add Physical Unit</h4>
                <p className="text-[11px] text-muted-foreground">Register an inventory unit under a layout type.</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="A-102"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Layout (Type)
                  </label>
                  <select
                    value={unitTypeId}
                    onChange={(e) => setUnitTypeId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    {unitTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Floor Level
                  </label>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Facing Direction
                  </label>
                  <input
                    type="text"
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="East"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Area (Sq Ft)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="150000"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Initial Status
                </label>
                <select
                  value={unitStatus}
                  onChange={(e) => setUnitStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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
                    'Add Unit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit unit modal overlay */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setIsEditOpen(false);
                setEditingUnitId(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold">Update Inventory Unit</h4>
                <p className="text-[11px] text-muted-foreground">Modify physical inventory parameters.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Unit Number
                  </label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="A-102"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Layout (Type)
                  </label>
                  <select
                    value={unitTypeId}
                    onChange={(e) => setUnitTypeId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  >
                    {unitTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Floor Level
                  </label>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Facing Direction
                  </label>
                  <input
                    type="text"
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="East"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Area (Sq Ft)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="150000"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Current Status
                </label>
                <select
                  value={unitStatus}
                  onChange={(e) => setUnitStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                  <option value="RENTED">Rented</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingUnitId(null);
                  }}
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
