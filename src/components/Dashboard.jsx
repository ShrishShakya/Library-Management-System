import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData, formatDate } from '../hooks/useData';

export default function Dashboard() {
  const { data } = useData();
  const { books, members, borrows } = data;

  const activeBorrows = borrows.filter(b => b.status === 'borrowed');
  const overdueBorrows = activeBorrows.filter(b => b.dueDate < new Date().toISOString().slice(0, 10));
  const availableBooks = books.reduce((sum, b) => sum + b.available, 0);

  const stats = [
    { label: 'Total Books', value: books.length, icon: 'fa-book', color: '#3b82f6' },
    { label: 'Available Books', value: availableBooks, icon: 'fa-check-circle', color: '#22c55e' },
    { label: 'Total Members', value: members.length, icon: 'fa-users', color: '#8b5cf6' },
    { label: 'Active Borrows', value: activeBorrows.length, icon: 'fa-handshake', color: '#f59e0b' },
    { label: 'Overdue', value: overdueBorrows.length, icon: 'fa-triangle-exclamation', color: '#ef4444' },
  ];

  const recentBooks = useMemo(() => [...books].sort((a, b) => (a.addedDate || '').localeCompare(b.addedDate || '')).slice(0, 5), [books]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="text-2xl" style={{ color: s.color }}><i className={`fas ${s.icon}`} /></div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent books */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="font-semibold text-slate-800"><i className="fas fa-clock mr-2 text-blue-500" />Recently Added Books</h3>
          <Link to="/books" className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
            <i className="fas fa-plus mr-1" /> View All
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
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Author</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Available</th>
                </tr>
              </thead>
              <tbody>
                {recentBooks.map(b => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2">{b.title}</td>
                    <td>{b.author}</td>
                    <td><span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs">{b.category || 'Uncategorized'}</span></td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs ${b.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.available}</span></td>
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
