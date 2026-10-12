'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Crown, Scissors, LogIn, Eye, EyeOff, Shield, User, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [setupInfo, setSetupInfo] = useState(null);

  // Auto-setup default users if none exist
  useEffect(() => {
    const autoSetup = async () => {
      try {
        const res = await fetch('/api/auth/setup', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setSetupInfo(data);
          setSetupDone(true);
        }
      } catch {
        // Setup may have already been done, that's fine
      }
    };
    autoSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const result = await login(username.trim(), password);
      if (result.success) {
        router.replace(result.user?.role === 'admin' ? '/' : '/billing');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  // If already logged in, AuthProvider will redirect
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-rose-950 flex items-center justify-center p-4">
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
        }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-900 to-rose-600 flex items-center justify-center text-amber-300 shadow-2xl shadow-rose-600/30 mx-auto mb-4 border border-rose-400/20">
            <Crown className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">VR FASHION PALACE</h1>
          <p className="text-rose-200/80 text-xs sm:text-sm font-semibold mt-1">Women & Kids Wear Boutique</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-rose-100">
          <div className="text-center mb-6">
            <h2 className="text-lg font-black text-slate-900 font-heading">Store Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access POS billing & inventory</p>
          </div>

          {/* Setup Info Banner */}
          {setupDone && setupInfo && (
            <div className="mb-5 p-3.5 rounded-xl bg-teal-50 border border-teal-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-teal-800">Default accounts created!</span>
              </div>
              <div className="space-y-1.5">
                {setupInfo.users?.map((u) => (
                  <div key={u.username} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-teal-100">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>{u.role}</span>
                      <span className="font-semibold text-slate-800">{u.username}</span>
                    </div>
                    <span className="font-mono text-slate-500">{u.password}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials & Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Login / Access Roles
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('admin123');
                  setError('');
                }}
                className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-left transition group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">Admin</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 underline group-hover:text-amber-900">
                    Use
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 font-mono">admin / admin123</p>
                <p className="text-[10px] text-amber-700/80 mt-1 leading-tight">
                  Full overview: Dashboard, Stock, Reports
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername('employee');
                  setPassword('emp123');
                  setError('');
                }}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-left transition group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    <span className="text-xs font-bold text-blue-900">Employee</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 underline group-hover:text-blue-900">
                    Use
                  </span>
                </div>
                <p className="text-[10px] text-blue-800 font-mono">employee / emp123</p>
                <p className="text-[10px] text-blue-700/80 mt-1 leading-tight">
                  Basic access: POS Billing & Invoices
                </p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-rose-200/70 mt-6 font-semibold">
          &copy; {new Date().getFullYear()} VR FASHION PALACE &middot; Women & Kids Wear Boutique
        </p>
      </div>
    </div>
  );
}
