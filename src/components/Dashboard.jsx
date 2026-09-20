import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { formatDate } from '../utils/helpers';
import QuickActions from './QuickActions';

export default function Dashboard() {
  const { data } = useData();
  const { books = [], members = [], borrows = [], reservations = [] } = data;

  const activeBorrows = borrows.filter(b => b.status === 'borrowed');
  const overdueBorrows = activeBorrows.filter(b => b.dueDate < new Date().toISOString().slice(0, 10));
  const availableBooks = books.reduce((sum, b) => sum + (Number(b.available) || 0), 0);
  const pendingReservations = reservations.filter(r => r.status === 'pending');

  const stats = [
    { label: 'Total Books', value: books.length, icon: 'fa-book', color: '#3b82f6' },
    { label: 'Available Books', value: availableBooks, icon: 'fa-check-circle', color: '#22c55e' },
    { label: 'Total Members', value: members.length, icon: 'fa-users', color: '#8b5cf6' },
    { label: 'Active Borrows', value: activeBorrows.length, icon: 'fa-handshake', color: '#f59e0b' },
    { label: 'Overdue', value: overdueBorrows.length, icon: 'fa-triangle-exclamation', color: '#ef4444' },
    { label: 'Reservations', value: pendingReservations.length, icon: 'fa-bookmark', color: '#6366f1' },
  ];

  const recentBooks = useMemo(
    () => [...books].sort((a, b) => (b.addedDate || '').localeCompare(a.addedDate || '')).slice(0, 5),
    [books]
  );

  return (
    <div>
      {/* Quick Actions Component */}
      <QuickActions />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="text-2xl" style={{ color: s.color }}><i className={`fas ${s.icon}`} /></div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{s.value}</div>
            <div className="text-xs text-slate-500 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent books */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            <i className="fas fa-clock mr-2 text-blue-500" />Recently Added Books
          </h3>
          <Link to="/books" className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition font-medium">
            <i className="fas fa-arrow-right mr-1" /> View All
          </Link>
        </div>
        <div className="p-4">
          {recentBooks.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <i className="fas fa-book text-4xl block mb-2" />
              <p>No books added yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Cover</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Author</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Available</th>
                </tr>
              </thead>
              <tbody>
                {recentBooks.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2">
                      <div className="w-8 h-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden border border-slate-200">
                        {b.coverImage ? (
                          <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-book text-slate-300 text-xs" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 font-medium text-slate-900">{b.title}</td>
                    <td className="text-slate-700">{b.author}</td>
                    <td><span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs text-slate-700">{b.category || 'General'}</span></td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.available}
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
