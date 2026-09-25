import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/authService';
import { Shield, Terminal, Lock, AlertTriangle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export const DeveloperLoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // 1. Strictly block Judge Demo users from accessing Developer Portal
    if (AuthService.isDemoSession()) {
      setIsDemoUser(true);
      return;
    }

    // 2. If already authenticated as Developer, navigate straight to dashboard
    if (AuthService.isDeveloperSession()) {
      navigate('/developer/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please provide both developer email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.loginDeveloper(trimmedEmail, trimmedPassword);
      if (result.success) {
        navigate('/developer/dashboard', { replace: true });
      } else {
        setError(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to establish connection to developer authentication gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  // If Judge Demo session detected, show strict isolation refusal
  if (isDemoUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Strictly Restricted</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Judge Demo Mode is cryptographically isolated from the Developer Portal and internal engineering subsystems.
          </p>
          <div className="pt-2">
            <Link
              to="/demo"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors"
            >
              Return to Judge Demo Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xs shadow-emerald-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-wider text-emerald-400 font-bold uppercase">
                Farmer’s Gamble
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                v2.4 Core
              </span>
            </div>
            <h1 className="text-sm font-semibold text-slate-200">Developer Engineering Console</h1>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Public Site
        </Link>
      </div>

      {/* Main Authentication Box */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Cyber Glow Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

          {/* Icon & Title */}
          <div className="mb-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Internal Developer Login</h2>
            <p className="text-xs text-slate-400 mt-1">
              Authenticate with your verified engineering credentials to access CMS, theme engine, and telemetry.
            </p>
          </div>

          {/* Security Notice Pill */}
          <div className="mb-5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5 text-[11px] text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Restricted area. All session logins and configuration edits are cryptographically signed and stored in audit logs.
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                DEVELOPER EMAIL
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@domain.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-slate-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                DEVELOPER PASSWORD
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-slate-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Developer Console</span>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center space-y-2">
        <p className="text-[11px] text-slate-400">
          Not visible in public portal navigation. Zero credentials or secret keys stored on frontend.
        </p>
        <p className="text-[10px] text-slate-400 font-mono">
          Farmer's Gamble Internal Architecture • Protected by RLS & HMAC Signed Session Tokens
        </p>
      </div>
    </div>
  );
};
