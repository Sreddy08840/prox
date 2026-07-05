import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Users, Settings, LogIn, Sparkles, Sun, Moon, Building2, AlertCircle, Sliders } from 'lucide-react';
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
          className={`text-sm font-semibold pb-2.5 border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Organization Profile
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`text-sm font-semibold pb-2.5 border-b-2 transition-all ${
            activeTab === 'team'
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

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser] = useState({ id: 'mock-user-123', role: 'ADMIN' }); // Mock Admin user

  const token = localStorage.getItem('propx_auth_token');
  if (!token && window.location.pathname !== '/login' && !window.location.pathname.startsWith('/accept-invitation')) {
    window.location.href = '/login';
    return null;
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPreview />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
        <Route
          path="/*"
          element={
            <div className={`min-h-screen flex flex-col md:flex-row bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>
              {/* Sidebar Navigation */}
              <aside className="w-full md:w-64 border-r bg-card flex flex-col justify-between shrink-0">
                <div className="p-6">
                  <div className="flex items-center space-x-2.5 font-bold text-xl tracking-tight text-primary">
                    <Sparkles className="animate-pulse" />
                    <span>PropX</span>
                  </div>
                  <nav className="mt-8 space-y-1.5">
                    <Link
                      to="/"
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/projects"
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Building2 size={18} />
                      <span>Projects</span>
                    </Link>
                    <Link
                      to="/leads"
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Users size={18} />
                      <span>Leads</span>
                    </Link>
                    <Link
                      to="/tenants"
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Users size={18} />
                      <span>Tenants</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Settings size={18} />
                      <span>Settings</span>
                    </Link>
                    {currentUser.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <Sliders size={18} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                  </nav>
                </div>

                <div className="p-6 border-t flex flex-col space-y-4">
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
                  >
                    <span className="flex items-center space-x-2">
                      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </span>
                  </button>
                  <Link
                    to="/login"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogIn size={18} />
                    <span>Logout</span>
                  </Link>
                </div>
              </aside>

              {/* Main Content Body & Header Wrapper */}
              <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Global Header Bar */}
                <header className="h-16 border-b bg-card flex items-center justify-between px-6 md:px-10 shrink-0">
                  <div className="text-xs text-muted-foreground font-semibold flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>CRM Status: Online</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <NotificationCenter />
                  </div>
                </header>

                {/* Main Scrollable Router Content */}
                <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-7xl mx-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/leads/:id" element={<LeadDetail />} />
                    <Route path="/tenants" element={<Tenants />} />
                    <Route
                      path="/settings"
                      element={<SettingsPage currentUser={currentUser} />}
                    />
                    <Route path="/admin" element={<AdminPanel />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
