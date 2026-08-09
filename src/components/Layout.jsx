import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';

const adminNavItems = [
  { path: '/', label: 'Dashboard', icon: 'fa-gauge-high' },
  { path: '/books', label: 'Books', icon: 'fa-book' },
  { path: '/members', label: 'Members', icon: 'fa-users' },
  { path: '/borrows', label: 'Borrow / Return', icon: 'fa-handshake' },
  { path: '/admin-bookings', label: 'Reservations', icon: 'fa-bookmark' },
  { path: '/reports', label: 'Reports', icon: 'fa-chart-simple' },
];

const userNavItems = [
  { path: '/user-portal', label: 'Book Catalog & Search', icon: 'fa-book-open' },
  { path: '/my-bookings', label: 'My Bookings & Activity', icon: 'fa-bookmark' },
];

export default function Layout({ children }) {
  const { currentUser, logout } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay fixed inset-0 bg-black/30 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <i className="fas fa-book-open text-blue-400 mr-2" />
              LibraSys
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin ? 'Admin Console' : 'Member Portal'}
            </p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`fas ${item.icon} w-5 text-center`} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-slate-50 p-4 md:p-8 ml-0 md:ml-64">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-700 text-xl p-2 rounded hover:bg-slate-200"
              onClick={() => setSidebarOpen(true)}
            >
              <i className="fas fa-bars" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800">
              <i className="fas fa-book-open text-blue-500 mr-2" />
              {navItems.find(item => isActive(item.path))?.label || (isAdmin ? 'Dashboard' : 'Portal')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="bg-white px-3.5 py-1.5 rounded-full shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-medium text-slate-700">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <span>{currentUser.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                  isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Sign Out"
            >
              <i className="fas fa-right-from-bracket" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
