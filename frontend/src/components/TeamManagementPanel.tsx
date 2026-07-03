import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import {
  Loader2,
  UserPlus,
  X,
  AlertCircle,
  CheckCircle,
  User,
  UserX,
  UserCheck,
} from 'lucide-react';

interface Member {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  createdAt: string;
}

interface UserProfile {
  role: string;
  id: string;
}

export default function TeamManagementPanel({ currentUser }: { currentUser: UserProfile }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invitation Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Fetch Team Members
  const fetchMembers = async () => {
    try {
      const response = await api.get('/organizations/me/members');
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to fetch team members');
      } else {
        setError('Failed to fetch team members');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      setError(null);
      const response = await api.put(`/organizations/me/members/${memberId}/role`, {
        role: newRole,
      });
      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to change user role');
      } else {
        setError('Failed to change user role');
      }
    }
  };

  const handleStatusToggle = async (memberId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setError(null);
      const response = await api.put(`/organizations/me/members/${memberId}/status`, {
        status: nextStatus,
      });
      if (response.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, status: nextStatus } : m)),
        );
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to update user status');
      } else {
        setError('Failed to update user status');
      }
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmitting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const response = await api.post('/organizations/me/invitations', {
        email: inviteEmail,
        firstName: inviteFirstName || undefined,
        lastName: inviteLastName || undefined,
        role: inviteRole,
      });

      if (response.data.success) {
        setInviteSuccess(response.data.data.email);
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
        setInviteRole('VIEWER');
        fetchMembers();
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setInviteError(err.response?.data?.error?.message || 'Failed to send invite');
      } else {
        setInviteError('Failed to send invite');
      }
    } finally {
      setInviteSubmitting(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage roles, statuses, and send account invitations.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors"
          >
            <UserPlus size={16} />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3.5 text-left font-semibold text-muted-foreground">Member</th>
                <th className="px-6 py-3.5 text-left font-semibold text-muted-foreground">Role</th>
                <th className="px-6 py-3.5 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3.5 text-left font-semibold text-muted-foreground">Joined Date</th>
                {isAdmin && <th className="px-6 py-3.5 text-right font-semibold text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {member.firstName ? member.firstName[0].toUpperCase() : <User size={16} />}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {member.firstName || member.lastName
                            ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                            : 'Guest Member'}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isAdmin && member.id !== currentUser.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="bg-background border rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="SALES_MANAGER">Sales Manager</option>
                        <option value="SALES_AGENT">Sales Agent</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {member.role.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        member.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-500'
                          : member.status === 'INVITED'
                          ? 'bg-blue-500/15 border-blue-500/20 text-blue-500'
                          : 'bg-rose-500/15 border-rose-500/20 text-rose-500'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                    {new Date(member.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      {member.id !== currentUser.id && (
                        <button
                          onClick={() => handleStatusToggle(member.id, member.status)}
                          className={`inline-flex items-center space-x-1 font-semibold transition-colors ${
                            member.status === 'ACTIVE'
                              ? 'text-rose-500 hover:text-rose-600'
                              : 'text-emerald-500 hover:text-emerald-600'
                          }`}
                        >
                          {member.status === 'ACTIVE' ? (
                            <>
                              <UserX size={14} />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal Overlay */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setIsInviteOpen(false);
                setInviteSuccess(null);
                setInviteError(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Invite Team Member</h3>
                <p className="text-xs text-muted-foreground">Add details to send a registration link.</p>
              </div>
            </div>

            {inviteSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-500/15 p-4 text-emerald-500 flex items-start space-x-3 text-sm">
                  <CheckCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold">Invitation created!</p>
                    <p className="text-xs mt-1">
                      An invitation link has been registered for **{inviteSuccess}**.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-3.5 text-xs text-muted-foreground space-y-2 border">
                  <p className="font-medium text-foreground">Next Action (Development mode):</p>
                  <p>
                    Check the backend server console log to copy the simulated registration URL link.
                  </p>
                </div>

                <button
                  onClick={() => setInviteSuccess(null)}
                  className="w-full py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Invite Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                {inviteError && (
                  <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <span>{inviteError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="teammate@propx.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    System Permission Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium"
                  >
                    <option value="ADMIN">Admin (Full Control)</option>
                    <option value="SALES_MANAGER">Sales Manager</option>
                    <option value="SALES_AGENT">Sales Agent</option>
                    <option value="VIEWER">Viewer (Read-only)</option>
                  </select>
                </div>

                <div className="pt-2 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="w-1/2 py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:bg-secondary/90 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="w-1/2 flex justify-center items-center py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50"
                  >
                    {inviteSubmitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      'Send Invite'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
