import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // In a real-world scenario, you could fetch user details based on the invitation token.
  // To keep the foundation robust and avoid extra API calls, we let users input their name fields during activation.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/v1/auth/accept-invitation/${token}`, {
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });

      if (response.data.success) {
        // Save access token
        localStorage.setItem('propx_auth_token', response.data.data.accessToken);
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error?.message ||
            'Failed to accept invitation. The link may have expired or is invalid.',
        );
      } else {
        setError('Failed to accept invitation. The link may have expired or is invalid.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 gradient-bg">
      <div className="max-w-md w-full space-y-8 bg-card border rounded-2xl p-8 shadow-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2 rounded-xl bg-primary/10 text-primary mb-4">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome to PropX</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your profile details to join your property team.
          </p>
        </div>

        {success ? (
          <div className="rounded-lg bg-emerald-500/15 p-4 text-emerald-500 flex items-start space-x-3">
            <CheckCircle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold">Account activated!</p>
              <p className="text-xs">Redirecting to your administration dashboard...</p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-destructive/15 p-4 text-destructive flex items-start space-x-3 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Choose Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Activating Account...</span>
                  </span>
                ) : (
                  'Accept Invitation & Join'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
