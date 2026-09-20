import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';

export default function Login() {
  const { login, resetPassword } = useData();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const res = login(email, password);
    if (!res.ok) return setError(res.error);
    navigate(res.user.role === 'admin' ? '/admin' : '/portal');
  };

  const handleReset = (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const res = resetPassword(email, phone, newPassword);
    if (!res.ok) return setError(res.error);
    setInfo('Password reset successfully! You can now sign in with your new password.');
    setMode('login');
    setPassword('');
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 text-3xl mb-3 shadow-inner">
            <i className="fas fa-book-open" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">LibraSys</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' ? 'Sign in to access library portal' : 'Reset your account password'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3.5 mb-4 flex items-start gap-2.5 animate-in fade-in">
            <i className="fas fa-circle-exclamation mt-0.5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl p-3.5 mb-4 flex items-start gap-2.5 animate-in fade-in">
            <i className="fas fa-check-circle mt-0.5 text-emerald-600 flex-shrink-0" />
            <span>{info}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="name@gmail.com or @outlook.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm shadow-md shadow-blue-500/20"
            >
              Sign In
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => { setMode('reset'); setError(''); setInfo(''); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 text-center">
                Quick Demo Accounts (Click to Fill)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin@gmail.com', 'admin123')}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 text-xs transition"
                >
                  <div className="font-semibold text-purple-700 flex items-center gap-1">
                    <i className="fas fa-shield-halved text-[10px]" /> Admin
                  </div>
                  <div className="text-slate-500 text-[10px] truncate">admin@gmail.com</div>
                  <div className="text-slate-400 text-[10px]">Pass: admin123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo('alice@gmail.com', 'user123')}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-xs transition"
                >
                  <div className="font-semibold text-blue-700 flex items-center gap-1">
                    <i className="fas fa-user text-[10px]" /> Member 1
                  </div>
                  <div className="text-slate-500 text-[10px] truncate">alice@gmail.com</div>
                  <div className="text-slate-400 text-[10px]">Pass: user123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo('bob@outlook.com', 'user123')}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-xs transition"
                >
                  <div className="font-semibold text-blue-700 flex items-center gap-1">
                    <i className="fas fa-user text-[10px]" /> Member 2
                  </div>
                  <div className="text-slate-500 text-[10px] truncate">bob@outlook.com</div>
                  <div className="text-slate-400 text-[10px]">Pass: user123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo('carol@gmail.com', 'user123')}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-xs transition"
                >
                  <div className="font-semibold text-rose-700 flex items-center gap-1">
                    <i className="fas fa-clock text-[10px]" /> Expired Member
                  </div>
                  <div className="text-slate-500 text-[10px] truncate">carol@gmail.com</div>
                  <div className="text-slate-400 text-[10px]">Pass: user123</div>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. alice@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Registered Phone Number
              </label>
              <div className="relative">
                <i className="fas fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 9841234567"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Demo phone numbers: Alice (9841234567), Bob (9851234567), Admin (9800000000)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                New Password (min 4 characters)
              </label>
              <div className="relative">
                <i className="fas fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={4}
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 transition font-semibold text-sm shadow-md"
            >
              Reset Password
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setInfo(''); }}
              className="w-full text-xs text-slate-500 hover:text-slate-700 text-center block pt-2"
            >
              <i className="fas fa-arrow-left mr-1" /> Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
