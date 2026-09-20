import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { formatDate, isMembershipExpired, isMembershipExpiringSoon, daysBetween, today } from '../utils/helpers';
import QuickActions from './QuickActions';

export default function Dashboard() {
  const { data, renewMember } = useData();
  const { books = [], members = [], borrows = [], reservations = [] } = data;

  const [userTab, setUserTab] = useState('all'); // 'all' | 'admins' | 'members' | 'expired'
  const [userSearch, setUserSearch] = useState('');

  const activeBorrows = borrows.filter((b) => b.status === 'borrowed');
  const overdueBorrows = activeBorrows.filter((b) => b.dueDate < today());
  const availableBooks = books.reduce((sum, b) => sum + (Number(b.available) || 0), 0);

  const admins = members.filter((m) => m.role === 'admin');
  const regularMembers = members.filter((m) => m.role !== 'admin');
  const activeRegularMembers = regularMembers.filter((m) => !isMembershipExpired(m.membershipExpiryDate) && m.active !== false);
  const expiredMembers = regularMembers.filter((m) => isMembershipExpired(m.membershipExpiryDate) || m.active === false);

  const stats = [
    { label: 'Total Books', value: books.length, icon: 'fa-book', color: '#3b82f6', bg: 'bg-blue-50' },
    { label: 'Available Copies', value: availableBooks, icon: 'fa-check-circle', color: '#22c55e', bg: 'bg-green-50' },
    { label: 'Administrators', value: admins.length, icon: 'fa-shield-halved', color: '#8b5cf6', bg: 'bg-purple-50' },
    { label: 'Active Members', value: activeRegularMembers.length, icon: 'fa-user-check', color: '#0ea5e9', bg: 'bg-sky-50' },
    { label: 'Expired Members', value: expiredMembers.length, icon: 'fa-user-xmark', color: '#ef4444', bg: 'bg-red-50' },
    { label: 'Active Borrows', value: activeBorrows.length, icon: 'fa-handshake', color: '#f59e0b', bg: 'bg-amber-50' },
  ];

  const recentBooks = useMemo(
    () => [...books].sort((a, b) => (b.addedDate || '').localeCompare(a.addedDate || '')).slice(0, 5),
    [books]
  );

  // Filter users by tab & search
  const filteredUsers = useMemo(() => {
    let list = members;
    if (userTab === 'admins') list = list.filter((m) => m.role === 'admin');
    else if (userTab === 'members') list = list.filter((m) => m.role !== 'admin');
    else if (userTab === 'expired') list = list.filter((m) => m.role !== 'admin' && (isMembershipExpired(m.membershipExpiryDate) || m.active === false));

    if (userSearch.trim()) {
      const s = userSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          (m.email || '').toLowerCase().includes(s) ||
          (m.phone || '').includes(s) ||
          (m.membershipId || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [members, userTab, userSearch]);

  const handleRenew = (memberId) => {
    renewMember(memberId, 365);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Component */}
      <QuickActions />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg`} style={{ color: s.color }}>
                <i className={`fas ${s.icon}`} />
              </span>
              <span className="text-2xl font-black text-slate-800">{s.value}</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-3">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Users & Admins Directory Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <i className="fas fa-users-gear text-purple-600" />
              Users & System Administrators Directory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of all registered administrators, active members, and expired accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search user..."
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="bg-slate-200/70 p-1 rounded-lg flex text-xs">
              {[
                { id: 'all', label: `All (${members.length})` },
                { id: 'admins', label: `Admins (${admins.length})` },
                { id: 'members', label: `Members (${regularMembers.length})` },
                { id: 'expired', label: `Expired (${expiredMembers.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setUserTab(tab.id)}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    userTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <i className="fas fa-user-slash text-3xl mb-2 block" />
              <p>No matching users found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">User Name & ID</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Email Address</th>
                  <th className="px-4 py-3 text-left">Phone Number</th>
                  <th className="px-4 py-3 text-left">Membership Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const expired = !isAdmin && isMembershipExpired(u.membershipExpiryDate);
                  const expiringSoon = !isAdmin && !expired && isMembershipExpiringSoon(u.membershipExpiryDate);
                  const daysLeft = u.membershipExpiryDate ? daysBetween(today(), u.membershipExpiryDate) : 0;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block text-sm">{u.name}</span>
                            <span className="text-[11px] font-mono text-slate-400">{u.membershipId || '—'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            <i className="fas fa-shield-halved text-[10px]" /> Administrator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                            <i className="fas fa-user text-[10px]" /> Member
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-xs font-medium">
                        {u.email || '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {u.phone || '—'}
                      </td>

                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="text-xs text-slate-400 font-medium">Permanent Access</span>
                        ) : expired ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full w-fit">
                              <i className="fas fa-circle-exclamation text-[9px]" /> Expired
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Ended on {formatDate(u.membershipExpiryDate)}
                            </span>
                          </div>
                        ) : expiringSoon ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit">
                              <i className="fas fa-clock text-[9px]" /> Expiring Soon ({daysLeft}d left)
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Until {formatDate(u.membershipExpiryDate)}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit">
                              <i className="fas fa-check text-[9px]" /> Active ({daysLeft}d left)
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Until {formatDate(u.membershipExpiryDate)}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {!isAdmin && (
                          <button
                            onClick={() => handleRenew(u.id)}
                            className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1 rounded-lg font-medium transition inline-flex items-center gap-1 border border-emerald-200"
                            title="Renew Membership for 1 Year"
                          >
                            <i className="fas fa-arrows-rotate text-[10px]" /> Renew
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Books */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base">
            <i className="fas fa-book-bookmark mr-2 text-blue-500" /> Recently Added Books
          </h3>
          <Link to="/books" className="text-xs bg-blue-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-blue-700 transition font-semibold">
            View All Catalog <i className="fas fa-arrow-right ml-1" />
          </Link>
        </div>
        <div className="p-4">
          {recentBooks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <i className="fas fa-book text-3xl block mb-2" />
              <p>No books in the library yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b text-xs">
                  <th className="pb-2.5 px-3">Cover</th>
                  <th className="pb-2.5 px-3">Title & ISBN</th>
                  <th className="pb-2.5 px-3">Author</th>
                  <th className="pb-2.5 px-3">Category</th>
                  <th className="pb-2.5 px-3">Availability</th>
                </tr>
              </thead>
              <tbody>
                {recentBooks.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="w-8 h-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden border border-slate-200">
                        {b.coverImage ? (
                          <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-book text-slate-300 text-xs" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      <span>{b.title}</span>
                      <span className="block text-[11px] text-slate-400 font-normal">ISBN: {b.isbn || '—'}</span>
                    </td>
                    <td className="px-3 text-slate-700 text-xs">{b.author}</td>
                    <td className="px-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs text-slate-700 font-medium">
                        {b.category || 'General'}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        b.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {b.available} / {b.quantity} Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
