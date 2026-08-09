import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';

export default function Login() {
  const { login } = useData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    const res = login(email, password);
    if (!res.success) {
      setError(res.error);
      return;
    }

    if (res.user.role === 'admin') {
      navigate('/');
    } else {
      navigate('/user-portal');
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@library.com');
    setPassword('admin123');
    setActiveTab('admin');
    setError('');
    const res = login('admin@library.com', 'admin123');
    if (res.success) navigate('/');
    else setError(res.error);
  };

  const fillDemoUser = () => {
    setEmail('alice@example.com');
    setPassword('user123');
    setActiveTab('user');
    setError('');
    const res = login('alice@example.com', 'user123');
    if (res.success) navigate('/user-portal');
    else setError(res.error);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-3xl mb-3 backdrop-blur-sm">
            <i className="fas fa-book-open" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">LibraSys Portal</h1>
          <p className="text-blue-100 text-xs mt-1">Library Management & Booking System</p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'user'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setActiveTab('user'); setError(''); }}
          >
            <i className="fas fa-user-graduate" /> User Portal
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'admin'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => { setActiveTab('admin'); setError(''); }}
          >
            <i className="fas fa-user-shield" /> Admin Login
          </button>
        </div>

        {/* Form body */}
        <div className="p-6">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-slate-800">
              {activeTab === 'admin' ? 'Administrator Login' : 'Library User Login'}
            </h2>
            <p className="text-xs text-slate-500">
              {activeTab === 'admin'
                ? 'Access management panel and reports.'
                : 'Sign in to browse, reserve, and manage your books.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <i className="fas fa-circle-exclamation text-base" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="email"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="password"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-white font-medium text-sm transition shadow-md ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              Sign In as {activeTab === 'admin' ? 'Admin' : 'User'}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div className="mt-6 pt-4 border-t text-center space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase">Quick Demo Login Shortcuts</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-1.5 px-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs hover:bg-indigo-100 transition"
                onClick={fillDemoAdmin}
              >
                <i className="fas fa-key mr-1" /> Demo Admin
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs hover:bg-blue-100 transition"
                onClick={fillDemoUser}
              >
                <i className="fas fa-user mr-1" /> Demo User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
