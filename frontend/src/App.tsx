import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogIn, 
  Sparkles, 
  Building2, 
  AlertCircle, 
  Sliders, 
  Search,
  ChevronDown,
  Calendar,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  FileText,
  CheckSquare,
  Bell,
  Play
} from 'lucide-react';
import AcceptInvitation from './pages/AcceptInvitation';
import OrgProfilePanel from './components/OrgProfilePanel';
import TeamManagementPanel from './components/TeamManagementPanel';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Tenants from './pages/Tenants';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Conversations from './pages/Conversations';
import Copilot from './pages/Copilot';
import SandboxSimulator from './pages/SandboxSimulator';
import Pipelines from './pages/Pipelines';
import NotificationsPage from './pages/NotificationsPage';
import Analytics from './pages/Analytics';
import api from './services/api';
import NotificationCenter from './components/NotificationCenter';

// Login Preview Component

interface AxiosErrorLike {
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

const LoginPreview = () => {
  const [email, setEmail] = useState('admin@propx.com');
  const [password, setPassword] = useState('adminpassword');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let token = '';
      try {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
          token = res.data.data.accessToken;
        }
      } catch (err) {
        const axiosError = err as AxiosErrorLike;
        if (axiosError.response?.status === 401 || axiosError.response?.status === 404) {
          // Attempt self-registration if credentials are correct but user does not exist
          const regRes = await api.post('/auth/register', {
            organizationName: 'Default Organization',
            organizationSlug: `default-org-${Math.floor(Math.random() * 1000)}`,
            email,
            password,
            firstName: 'Admin',
            lastName: 'User',
          });
          if (regRes.data.success) {
            token = regRes.data.data.accessToken;
          }
        } else {
          throw err;
        }
      }

      if (token) {
        localStorage.setItem('propx_auth_token', token);
        window.location.href = '/';
      } else {
        setError('Authentication failed');
      }
    } catch (err) {
      const axiosError = err as AxiosErrorLike;
      setError(axiosError.response?.data?.error?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 gradient-bg">
      <div className="max-w-md w-full space-y-8 bg-card border rounded-2xl p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight">PropX Platform</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your administration panel</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-destructive/15 p-3 text-destructive flex items-start space-x-2 text-xs">
              <AlertCircle className="shrink-0 mt-0.5" size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-md space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="name@propx.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsPage = ({ currentUser }: { currentUser: { id: string; role: string } }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');

  return (
    <div className="space-y-6">
      <div className="border-b pb-1 flex space-x-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`text-sm font-semibold pb-2.5 border-b-2 transition-all ${activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Organization Profile
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`text-sm font-semibold pb-2.5 border-b-2 transition-all ${activeTab === 'team'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Team Management
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'profile' ? (
          <OrgProfilePanel user={currentUser} />
        ) : (
          <TeamManagementPanel currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

const translations = {
  EN: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    leads: 'Leads',
    tenants: 'Tenants',
    settings: 'Settings',
    adminPanel: 'Admin Panel',
    crmStatus: 'CRM Status: Online',
    logout: 'Logout',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language: EN',
    sandbox: 'AI Sandbox',
  },
  ES: {
    dashboard: 'Tablero',
    projects: 'Proyectos',
    leads: 'Clientes Potenciales',
    tenants: 'Inquilinos',
    settings: 'Configuración',
    adminPanel: 'Panel de Admin',
    crmStatus: 'Estado del CRM: En línea',
    logout: 'Cerrar sesión',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    language: 'Idioma: ES',
    sandbox: 'Simulador IA',
  }
};

interface MainLayoutProps {
  t: Record<string, string>;
  currentUser: { id: string; role: string };
}

function MainLayout({ t, currentUser }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
  const [isCopilotDrawerOpen, setIsCopilotDrawerOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<string[]>([
    'Hello! I am the global PropX AI Copilot. How can I help you manage your CRM workspace or qualify deals today?',
  ]);
  const [copilotInput, setCopilotInput] = useState('');

  // Handle hotkeys (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = [
    { name: 'Dashboard overview', url: '/', category: 'Navigation' },
    { name: 'Projects listing', url: '/projects', category: 'Navigation' },
    { name: 'Leads directory list', url: '/leads', category: 'Navigation' },
    { name: 'Deals Pipelines Kanban board', url: '/pipelines', category: 'Navigation' },
    { name: 'Conversations chats history', url: '/conversations', category: 'Navigation' },
    { name: 'SLA Alerts Feed', url: '/notifications', category: 'Navigation' },
    { name: 'AI Sandbox Simulator panel', url: '/sandbox', category: 'Navigation' },
    { name: 'Project Skyline details page', url: '/projects', category: 'Content' },
    { name: 'Rashid Al-Mansoori (Hot Lead)', url: '/leads', category: 'Content' },
  ].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSendCopilotMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;

    const userText = copilotInput;
    setCopilotMessages(prev => [...prev, `USER: ${userText}`]);
    setCopilotInput('');

    setTimeout(() => {
      let aiText = "I qualified the workspace dashboard stats. The conversions are fully matching the Q2 targets.";
      if (userText.toLowerCase().includes('rashid') || userText.toLowerCase().includes('mansoori')) {
        aiText = "Lead Rashid Al-Mansoori is qualified as HOT with a budget of ₹4.5 Cr. Recommended action: Send layout option details.";
      } else if (userText.toLowerCase().includes('sla') || userText.toLowerCase().includes('breach')) {
        aiText = "SLA Alert breach: lead-to-won conversion rate warning threshold is currently active. Response lag on Emma exceeds 10m.";
      }
      setCopilotMessages(prev => [...prev, `AI: ${aiText}`]);
    }, 700);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { to: '/', label: t.dashboard, icon: LayoutDashboard },
    { to: '/projects', label: t.projects, icon: Building2 },
    { to: '/leads', label: t.leads, icon: Users },
    { to: '/pipelines', label: 'Pipelines', icon: Sliders },
    { to: '/conversations', label: 'Conversations', icon: MessageSquare },
    { to: '/tenants', label: t.tenants, icon: Users },
    { to: '/analytics', label: 'Analytics', icon: TrendingUp },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/sandbox', label: t.sandbox, icon: Play },
    { to: '/settings', label: t.settings, icon: Settings },
  ];

  const quickAccessItems = [
    { to: '/tasks', label: 'My Tasks', icon: CheckSquare, badge: 8 },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 12 },
    { to: '/copilot', label: 'AI Copilot', icon: Sparkles, glow: true },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      {/* Floating Modern Sidebar */}
      <aside className={`border-r border-[#1F2937]/50 bg-[#111827] text-[#CBD5E1] flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out relative z-30 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4 flex flex-col space-y-5 overflow-y-auto max-h-[85vh] scrollbar-none">
          {/* Workspace Selector Mockup */}
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div 
                onClick={() => setWorkspaceOpen(!workspaceOpen)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#1F2937] bg-[#1E293B]/40 hover:bg-[#1E293B]/70 transition-all cursor-pointer select-none relative"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6D5EF5] to-[#5B4FEA] flex items-center justify-center font-extrabold text-xs text-white shadow-sm">
                    P
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold tracking-tight text-white">PropX Enterprise</span>
                    <span className="text-[10px] text-[#94A3B8] font-semibold">Workspace</span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-[#94A3B8] transition-transform duration-200" />
                {workspaceOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-[#1F2937] bg-[#111827] text-[#CBD5E1] rounded-xl shadow-lg p-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-2 py-1.5 text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Workspaces</div>
                    <div className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-[#1E293B] text-white">PropX Enterprise</div>
                    <div className="px-2 py-1.5 text-xs font-semibold rounded-lg hover:bg-[#1E293B]/50 transition-colors">PropX Personal</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-[#6D5EF5] to-[#5B4FEA] flex items-center justify-center font-extrabold text-sm text-white shadow-sm">
                P
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                    active
                      ? 'bg-gradient-to-r from-[#6D5EF5] to-[#5B4FEA] text-white shadow-sm border border-[#6D5EF5]/20 scale-[1.02]'
                      : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Icon size={15} className={`shrink-0 ${active ? 'text-white' : 'text-[#CBD5E1] group-hover:text-white transition-colors'}`} />
                  {!isSidebarCollapsed && <span className="tracking-tight">{item.label}</span>}
                  
                  {active && !isSidebarCollapsed && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
            
            {currentUser.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                  isActive('/admin')
                    ? 'bg-gradient-to-r from-[#6D5EF5] to-[#5B4FEA] text-white shadow-sm border border-[#6D5EF5]/20 scale-[1.02]'
                    : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
                }`}
              >
                <Sliders size={15} className={`shrink-0 ${isActive('/admin') ? 'text-white' : 'text-[#CBD5E1] group-hover:text-white transition-colors'}`} />
                {!isSidebarCollapsed && <span className="tracking-tight">{t.adminPanel}</span>}
                {isActive('/admin') && !isSidebarCollapsed && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            )}
          </nav>

          {/* QUICK ACCESS Section */}
          {!isSidebarCollapsed && (
            <div className="pt-3 px-3 text-[9px] font-black text-[#94A3B8]/60 uppercase tracking-widest text-left select-none">
              Quick Access
            </div>
          )}
          <nav className="space-y-1">
            {quickAccessItems.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                    active
                      ? 'bg-gradient-to-r from-[#6D5EF5] to-[#5B4FEA] text-white shadow-sm border border-[#6D5EF5]/20 scale-[1.02]'
                      : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <Icon size={15} className={`shrink-0 ${active ? 'text-white' : item.glow ? 'text-primary animate-pulse' : 'text-[#CBD5E1] group-hover:text-white transition-colors'}`} />
                    {!isSidebarCollapsed && <span className="tracking-tight">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge && (
                    <span className="bg-primary/20 text-[#6D5EF5] border border-primary/20 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Theme Toggle, Collapse, and Logout */}
        <div className="p-4 border-t border-[#1F2937]/50 flex flex-col space-y-2">
          {/* Collapse sidebar button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-[#1F2937]/80 text-xs font-bold text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white transition-all duration-200"
          >
            {!isSidebarCollapsed ? (
              <>
                <span>Collapse Sidebar</span>
                <ChevronRight size={14} className="rotate-180" />
              </>
            ) : (
              <ChevronRight size={14} className="mx-auto" />
            )}
          </button>


          {/* Logout */}
          <Link
            to="/login"
            onClick={() => localStorage.removeItem('propx_auth_token')}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogIn size={16} className="shrink-0" />
            {!isSidebarCollapsed && <span className="tracking-tight">{t.logout}</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 sticky top-0 border-b bg-white/85 backdrop-blur-md flex items-center justify-between px-6 md:px-10 shrink-0 relative z-20 shadow-sm">
          <div 
            onClick={() => setIsSearchModalOpen(true)}
            className="hidden md:flex items-center space-x-2 relative w-72 lg:w-96 cursor-pointer select-none"
          >
            <Search className="absolute left-3.5 text-muted-foreground" size={15} />
            <div className="w-full pl-10 pr-12 py-2 border rounded-full bg-muted/20 hover:bg-muted/40 text-xs font-semibold text-muted-foreground text-left transition-all duration-200">
              Search projects, leads, pipelines... (⌘K)
            </div>
            <span className="absolute right-3.5 top-2.5 px-1.5 py-0.5 rounded border bg-card text-[9px] font-bold text-muted-foreground uppercase select-none tracking-wider">
              ⌘K
            </span>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Quick Date Filter Dropdown Selector */}
            <div className="relative">
              <div 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="hidden sm:flex items-center bg-muted/20 border hover:bg-muted/40 transition-all px-3 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none space-x-1.5"
              >
                <Calendar size={13} />
                <span>{selectedDateFilter}</span>
                <ChevronDown size={11} className={`transition-transform duration-200 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isDateDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 border border-border bg-card text-foreground rounded-xl shadow-lg p-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  {['All Time', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days'].map(opt => (
                    <div
                      key={opt}
                      onClick={() => {
                        setSelectedDateFilter(opt);
                        setIsDateDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Assistant Quick Copilot Button Drawer Toggle */}
            <button 
              onClick={() => setIsCopilotDrawerOpen(!isCopilotDrawerOpen)}
              className="flex items-center space-x-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all px-3.5 py-1.5 text-[11px] font-extrabold text-primary shadow-sm hover:scale-[1.02]"
            >
              <Sparkles size={13} className="animate-pulse" />
              <span>AI Copilot</span>
            </button>

            {/* Notifications Panel */}
            <div className="shrink-0">
              <NotificationCenter />
            </div>

            {/* User Profile Avatar with Role Dropdown */}
            <div className="flex items-center space-x-2 pl-2 border-l">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-primary flex items-center justify-center font-bold text-xs text-white shadow-sm border border-card">
                AD
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[11px] font-bold text-foreground">Admin User</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-extrabold">{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Routing Main Frame */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/sandbox" element={<SandboxSimulator />} />
            <Route
              path="/settings"
              element={<SettingsPage currentUser={currentUser} />}
            />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/copilot" element={<Copilot />} />
          </Routes>
        </main>
      </div>

      {/* Premium Search / Command Palette Overlay */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
          <div className="bg-card w-full max-w-xl rounded-2xl border border-border shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Search className="text-primary shrink-0" size={16} />
              <input
                type="text"
                placeholder="Type a command or search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent focus:outline-none text-xs text-foreground font-bold"
              />
              <button 
                onClick={() => setIsSearchModalOpen(false)}
                className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md hover:bg-muted/80 shrink-0"
              >
                ESC
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground font-bold">No results found.</div>
              ) : (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      navigate(res.url);
                      setIsSearchModalOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all cursor-pointer text-left"
                  >
                    <span className="text-xs font-extrabold text-foreground">{res.name}</span>
                    <span className="text-[8px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{res.category}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Slider Drawer */}
      {isCopilotDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-sm bg-card border-l h-full flex flex-col justify-between p-5 animate-in slide-in-from-right duration-300 shadow-2xl text-left font-sans">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center space-x-2 text-foreground font-black text-sm">
                <Sparkles size={16} className="text-primary animate-pulse" />
                <span>AI Copilot Helper</span>
              </div>
              <button 
                onClick={() => setIsCopilotDrawerOpen(false)}
                className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md hover:bg-muted/80"
              >
                Close
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 font-semibold text-xs leading-relaxed">
              {copilotMessages.map((msg, i) => {
                const isUser = msg.startsWith('USER: ');
                const text = isUser ? msg.replace('USER: ', '') : msg.replace('AI: ', '');
                return (
                  <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] ${isUser ? 'bg-primary text-white rounded-tr-none' : 'bg-muted/20 border text-foreground rounded-tl-none'}`}>
                      {!isUser && i > 0 && (
                        <span className="flex items-center space-x-1 text-[8px] uppercase tracking-wider text-primary font-black mb-1">
                          <Sparkles size={9} />
                          <span>AI Copilot</span>
                        </span>
                      )}
                      <p>{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendCopilotMessage} className="border-t pt-3 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask anything about the CRM..."
                value={copilotInput}
                onChange={e => setCopilotInput(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-full bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="p-2.5 rounded-full bg-primary text-white hover:bg-primary/95 transition-all shadow-md shrink-0"
              >
                <Sparkles size={12} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [currentUser] = useState({ id: 'mock-user-123', role: 'ADMIN' });
  const lang = 'EN';
  const t = translations[lang];

  const token = localStorage.getItem('propx_auth_token');
  if (!token && window.location.pathname !== '/login' && !window.location.pathname.startsWith('/accept-invitation')) {
    window.location.href = '/login';
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPreview />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
        <Route
          path="/*"
          element={
            <MainLayout
              t={t}
              currentUser={currentUser}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
