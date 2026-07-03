/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import {
  Users,
  Building,
  Key,
  ShieldAlert,
  Sliders,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  FileText,
  Save,
  Activity,
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  entityName: string;
  entityId: string | null;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SettingItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface FailedMessageItem {
  id: string;
  recipientPhone: string;
  content: string;
  errorMsg: string | null;
  attempts: number;
  status: string;
  createdAt: string;
}

type TabType = 'users' | 'projects' | 'apikeys' | 'audit' | 'settings' | 'deliveries';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for lists
  const [users, setUsers] = useState<UserItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [failedMsgs, setFailedMsgs] = useState<FailedMessageItem[]>([]);

  // Forms states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'SALES_AGENT',
  });
  const [showAddUser, setShowAddUser] = useState(false);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
  });
  const [showAddProject, setShowAddProject] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Load active tab data
  const loadTabData = async (tab: TabType) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data);
      } else if (tab === 'projects') {
        const res = await api.get('/admin/projects');
        setProjects(res.data.data);
      } else if (tab === 'apikeys') {
        const res = await api.get('/admin/apikeys');
        setApiKeys(res.data.data);
      } else if (tab === 'audit') {
        const res = await api.get('/admin/audit-logs');
        setAuditLogs(res.data.data);
      } else if (tab === 'settings') {
        const res = await api.get('/admin/settings');
        setSettings(res.data.data);
      } else if (tab === 'deliveries') {
        const res = await api.get('/admin/failed-messages');
        setFailedMsgs(res.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || `Failed to fetch ${tab} data.`);
      } else {
        setError(`Failed to fetch ${tab} data.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
    setGeneratedKey(null);
  }, [activeTab]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Add User handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users', newUser);
      if (res.data.success) {
        setUsers((prev) => [...prev, res.data.data]);
        setShowAddUser(false);
        setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'SALES_AGENT' });
        showToast('Member invited and created successfully.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create user', 'error');
    }
  };

  // User Role Change Handler
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.put(`/admin/users/${userId}`, { role: newRole });
      if (res.data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        showToast('Member permissions updated successfully.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update role', 'error');
    }
  };

  // User Status Change Handler
  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.put(`/admin/users/${userId}`, { status: newStatus });
      if (res.data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
        showToast(`User account status set to ${newStatus}.`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to toggle status', 'error');
    }
  };

  // Add Project handler
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/projects', newProject);
      if (res.data.success) {
        setProjects((prev) => [...prev, res.data.data]);
        setShowAddProject(false);
        setNewProject({ name: '', description: '', status: 'PLANNING' });
        showToast('Project created successfully.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create project', 'error');
    }
  };

  // Delete Project handler
  const handleDeleteProject = async (projId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await api.delete(`/admin/projects/${projId}`);
      if (res.data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== projId));
        showToast('Project soft-deleted.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to delete project', 'error');
    }
  };

  // Generate API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/apikeys', { name: newKeyName });
      if (res.data.success) {
        setApiKeys((prev) => [...prev, res.data.data]);
        setGeneratedKey(res.data.data.key); // Display raw key once
        setNewKeyName('');
        showToast('API access key created successfully.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to create API key', 'error');
    }
  };

  // Revoke API Key
  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API token? External requests using this key will immediately fail.')) return;
    try {
      const res = await api.delete(`/admin/apikeys/${keyId}`);
      if (res.data.success) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
        showToast('API Key revoked.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to revoke API key', 'error');
    }
  };

  // Update Setting
  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const res = await api.put('/admin/settings', { key, value });
      if (res.data.success) {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value } : s)),
        );
        showToast(`Configuration setting "${key}" updated.`);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to save settings', 'error');
    }
  };

  // Manual Retry Failed WhatsApp message
  const handleRetryMessage = async (id: string) => {
    try {
      const res = await api.post(`/admin/failed-messages/${id}/retry`);
      if (res.data.success) {
        setFailedMsgs((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, status: 'SENT', attempts: msg.attempts + 1 } : msg)),
        );
        showToast('WhatsApp message retried and dispatched successfully!');
      } else {
        setFailedMsgs((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, attempts: res.data.data.attempts, status: res.data.data.status } : msg)),
        );
        showToast('Message retry failed again.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Retry dispatch failed.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
          <Sliders className="text-primary" size={28} />
          <span>Platform Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage CRM members, roles, project assignments, generated tokens, and logs.
        </p>
      </div>

      {/* Toast Alert Indicators */}
      {successMsg && (
        <div className="rounded-lg bg-emerald-500/15 p-4 text-emerald-500 flex items-center space-x-2.5 text-xs font-bold shadow-sm border border-emerald-500/20 animate-in zoom-in duration-200">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-center space-x-2.5 text-xs font-bold shadow-sm border border-destructive/20 animate-in zoom-in duration-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu Navigation */}
      <div className="border-b flex flex-wrap gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={14} />
          <span>Members & Roles</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'projects' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building size={14} />
          <span>Projects</span>
        </button>
        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'apikeys' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key size={14} />
          <span>API Access Keys</span>
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 transition-all relative ${
            activeTab === 'deliveries' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity size={14} />
          <span>Failed WhatsApp Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={14} />
          <span>Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 transition-all ${
            activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders size={14} />
          <span>System Settings</span>
        </button>
      </div>

      {/* Main Tab Render Body */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div>
            {/* 1. USERS & ROLES TAB */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Organization Members</h3>
                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="flex items-center space-x-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Invite Member</span>
                  </button>
                </div>

                {showAddUser && (
                  <form onSubmit={handleAddUser} className="rounded-xl border bg-card p-5 space-y-4 max-w-md animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-xs font-black uppercase text-muted-foreground">New Member Invitation</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="newUserFirstName" className="text-[10px] font-bold block mb-1 text-muted-foreground">First Name</label>
                        <input
                          id="newUserFirstName"
                          type="text"
                          required
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                          className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label htmlFor="newUserLastName" className="text-[10px] font-bold block mb-1 text-muted-foreground">Last Name</label>
                        <input
                          id="newUserLastName"
                          type="text"
                          required
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                          className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="newUserEmail" className="text-[10px] font-bold block mb-1 text-muted-foreground">Email Address</label>
                      <input
                        id="newUserEmail"
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                        placeholder="john.doe@company.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="newUserPassword" className="text-[10px] font-bold block mb-1 text-muted-foreground">Password</label>
                      <input
                        id="newUserPassword"
                        type="password"
                        required
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label htmlFor="newUserRole" className="text-[10px] font-bold block mb-1 text-muted-foreground">System Role</label>
                      <select
                        id="newUserRole"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                      >
                        <option value="SALES_AGENT">Sales Agent</option>
                        <option value="SALES_MANAGER">Sales Manager</option>
                        <option value="ADMIN">Administrator</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95"
                      >
                        Save Member
                      </button>
                    </div>
                  </form>
                )}

                <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-bold text-foreground">
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="px-2 py-1 border rounded bg-background text-xs font-semibold focus:outline-none"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="SALES_MANAGER">Manager</option>
                              <option value="SALES_AGENT">Agent</option>
                              <option value="VIEWER">Viewer</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              u.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleStatusChange(u.id, u.status)}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Active Portfolios & Projects</h3>
                  <button
                    onClick={() => setShowAddProject(!showAddProject)}
                    className="flex items-center space-x-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Create Project</span>
                  </button>
                </div>

                {showAddProject && (
                  <form onSubmit={handleAddProject} className="rounded-xl border bg-card p-5 space-y-4 max-w-md animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-xs font-black uppercase text-muted-foreground">New Property Project</h4>
                    <div>
                      <label htmlFor="newProjectName" className="text-[10px] font-bold block mb-1 text-muted-foreground">Project Name</label>
                      <input
                        id="newProjectName"
                        type="text"
                        required
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                        placeholder="E.g. Emerald Heights"
                      />
                    </div>
                    <div>
                      <label htmlFor="newProjectDescription" className="text-[10px] font-bold block mb-1 text-muted-foreground">Description</label>
                      <textarea
                        id="newProjectDescription"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs h-20"
                        placeholder="Enter project summary..."
                      />
                    </div>
                    <div>
                      <label htmlFor="newProjectStatus" className="text-[10px] font-bold block mb-1 text-muted-foreground">Project Status</label>
                      <select
                        id="newProjectStatus"
                        value={newProject.status}
                        onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                        className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                      >
                        <option value="PLANNING">Planning</option>
                        <option value="UNDER_CONSTRUCTION">Under Construction</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProject(false)}
                        className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95"
                      >
                        Save Project
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {projects.map((p) => (
                    <div key={p.id} className="relative rounded-2xl border bg-card p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase bg-primary/10 text-primary`}>
                          {p.status.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-sm text-foreground">{p.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {p.description || 'No description provided for this portfolio project.'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase">ID: {p.id.slice(0, 8)}</span>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          aria-label="Delete project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. API KEYS TAB */}
            {activeTab === 'apikeys' && (
              <div className="space-y-6">
                <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
                  <h3 className="text-xs font-bold text-foreground">API Integrations</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Generate secure webhook authorization tokens. Use these keys in external API calls (such as WhatsApp Business verification headers or custom Zapier links) to authenticate payloads.
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-4">
                    <form onSubmit={handleCreateApiKey} className="flex gap-2 max-w-md items-end">
                      <div className="flex-1">
                        <label htmlFor="newApiKeyName" className="text-[10px] font-bold block mb-1 text-muted-foreground">API Token Label</label>
                        <input
                          id="newApiKeyName"
                          type="text"
                          required
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg bg-background text-xs"
                          placeholder="E.g. WhatsApp Prod Integration"
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex items-center space-x-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm shrink-0"
                      >
                        <Plus size={14} />
                        <span>Generate Key</span>
                      </button>
                    </form>

                    {generatedKey && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-600">
                          <ShieldAlert size={14} />
                          <span>Copy API Key Token</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          For security reasons, this token key will **only be shown once**. Copy it and store it safely in your secrets manager.
                        </p>
                        <div className="p-2 border bg-background rounded-lg text-xs font-mono font-bold text-foreground select-all break-all border-amber-500/30">
                          {generatedKey}
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/40 border-b text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                            <th className="p-4">Key Label Name</th>
                            <th className="p-4">Masked Token Key</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Created Date</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {apiKeys.map((k) => (
                            <tr key={k.id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-4 font-bold text-foreground">{k.name}</td>
                              <td className="p-4 font-mono text-muted-foreground">
                                pk_••••••••{k.key ? k.key.slice(-6) : '••••'}
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-500 px-2 py-0.5 text-[10px] font-bold">
                                  ACTIVE
                                </span>
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {new Date(k.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteApiKey(k.id)}
                                  className="text-[10px] font-bold text-destructive hover:underline"
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FAILED WHATSAPP LOGS TAB */}
            {activeTab === 'deliveries' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Outbound Failed Deliveries Queue</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Logs failed WhatsApp dispatches, allowing manual re-delivery triggers.</p>
                  </div>
                  <button
                    onClick={() => loadTabData('deliveries')}
                    className="p-1 text-muted-foreground hover:bg-muted rounded transition-colors"
                    aria-label="Refresh deliveries"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                        <th className="p-4">Recipient Phone</th>
                        <th className="p-4">Content</th>
                        <th className="p-4">Error Message</th>
                        <th className="p-4">Attempts</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {failedMsgs.map((msg) => (
                        <tr key={msg.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-bold text-foreground">{msg.recipientPhone}</td>
                          <td className="p-4 text-muted-foreground max-w-xs truncate">{msg.content}</td>
                          <td className="p-4 text-destructive font-medium max-w-xs truncate">
                            {msg.errorMsg || 'Mock Send Bypass Connection failed'}
                          </td>
                          <td className="p-4 font-semibold text-center">{msg.attempts}/3</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              msg.status === 'SENT'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : msg.status === 'PERMANENT_FAILURE'
                                ? 'bg-rose-500/15 text-rose-500'
                                : 'bg-amber-500/15 text-amber-500'
                            }`}>
                              {msg.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {msg.status !== 'SENT' && msg.status !== 'PERMANENT_FAILURE' ? (
                              <button
                                onClick={() => handleRetryMessage(msg.id)}
                                className="flex items-center space-x-1 text-[10px] font-bold text-primary hover:underline ml-auto"
                              >
                                <RefreshCw size={10} className="animate-spin-hover" />
                                <span>Retry Send</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. AUDIT TRAIL LOGS TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Organization Audit Trails</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Logs all CRUD and logins actions inside the organization tenant.</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">User</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Affected Entity</th>
                        <th className="p-4">Entity ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-4">
                            {log.user ? (
                              <div className="font-bold text-foreground">
                                {log.user.firstName} {log.user.lastName}
                                <span className="block text-[9px] text-muted-foreground font-medium">{log.user.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground font-semibold">System Trigger</span>
                            )}
                          </td>
                          <td className="p-4 font-bold uppercase text-primary text-[10px] tracking-wide">
                            {log.action.replace('_', ' ')}
                          </td>
                          <td className="p-4 text-foreground font-medium">{log.entityName}</td>
                          <td className="p-4 text-muted-foreground font-mono text-[10px]">{log.entityId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. SYSTEM SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {settings.length >= 0 && <span className="sr-only">Settings active</span>}
                <div>
                  <h3 className="text-sm font-bold text-foreground">Platform Parameters Configuration</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Toggle system settings switches to update system parameters.</p>
                </div>

                <div className="max-w-2xl divide-y border rounded-xl bg-card overflow-hidden shadow-sm">
                  {/* Maintenance Mode setting mockup */}
                  <div className="p-5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-foreground">Maintenance Mode</h4>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Locks the client facing platform portal and displays a maintenance screen to customers.
                      </p>
                    </div>
                    <button
                      onClick={() => handleUpdateSetting('MAINTENANCE_MODE', 'true')}
                      className="flex items-center space-x-1 px-3 py-1 border rounded-lg text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-sm"
                    >
                      <Save size={12} />
                      <span>Activate</span>
                    </button>
                  </div>

                  {/* AI Provider selection setting */}
                  <div className="p-5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-foreground">AI Intelligence Provider</h4>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Selects the LLM provider to process incoming WhatsApp inquiries and execute qualification.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => handleUpdateSetting('AI_PROVIDER', e.target.value)}
                        className="px-2 py-1.5 border rounded bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                        defaultValue="MockProvider"
                      >
                        <option value="MockProvider">Mock AI Parser (Local Seed)</option>
                        <option value="AnthropicProvider">Claude LLM (Claude API Key)</option>
                      </select>
                    </div>
                  </div>

                  {/* CRM Notification threshold */}
                  <div className="p-5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-foreground">Daily Email Summary Interval</h4>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Configures interval scheduling values for executing cron metrics summaries email dispatch.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => handleUpdateSetting('DAILY_SUMMARY_INTERVAL', e.target.value)}
                        className="px-2 py-1.5 border rounded bg-background text-xs font-semibold focus:outline-none"
                        defaultValue="24"
                      >
                        <option value="12">Every 12 Hours</option>
                        <option value="24">Every 24 Hours (Daily)</option>
                        <option value="168">Every 7 Days (Weekly)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
