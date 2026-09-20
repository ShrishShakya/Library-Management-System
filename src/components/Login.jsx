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
    setInfo('Password reset successfully. You can now log in.');
    setMode('login');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl text-blue-500 mb-2">
            <i className="fas fa-book-open" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">LibraSys</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Reset your password'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            <i className="fas fa-circle-exclamation mr-2" />{error}
          </div>
        )}
        {info && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 mb-4">
            <i className="fas fa-check-circle mr-2" />{info}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('reset'); setError(''); }}
              className="w-full text-sm text-blue-500 hover:underline"
            >
              Forgot password?
            </button>
            <div className="text-xs text-slate-400 text-center pt-3 border-t">
              Demo — Admin: admin@library.com / admin123<br />
              User: alice@example.com / user123
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone (on your account)
              </label>
              <input
                type="text" required value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="555-0101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input
                type="password" required value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                minLength={4}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600 transition font-medium"
            >
              Reset Password
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full text-sm text-slate-500 hover:underline"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
