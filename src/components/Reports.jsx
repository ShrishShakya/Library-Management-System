import React, { useMemo } from 'react';
import { useData, formatDate, isOverdue } from '../hooks/useData';

export default function Reports() {
  const { data } = useData();
  const { books, members, borrows } = data;

  const activeBorrows = borrows.filter(b => b.status === 'borrowed');
  const overdueBorrows = activeBorrows.filter(b => isOverdue(b.dueDate));
  const returnedBorrows = borrows.filter(b => b.status === 'returned');

  // Most borrowed books
  const borrowCounts = {};
  borrows.forEach(br => { borrowCounts[br.bookId] = (borrowCounts[br.bookId] || 0) + 1; });
  const topBooks = useMemo(() => [...books].sort((a, b) => (borrowCounts[b.id] || 0) - (borrowCounts[a.id] || 0)).slice(0, 5), [books, borrowCounts]);

  // Most active members
  const memberCounts = {};
  borrows.forEach(br => { memberCounts[br.memberId] = (memberCounts[br.memberId] || 0) + 1; });
  const topMembers = useMemo(() => [...members].sort((a, b) => (memberCounts[b.id] || 0) - (memberCounts[a.id] || 0)).slice(0, 5), [members, memberCounts]);

  const summaryStats = [
    { label: 'Total Borrows', value: borrows.length, icon: 'fa-handshake', color: '#3b82f6' },
    { label: 'Active Borrows', value: activeBorrows.length, icon: 'fa-clock', color: '#f59e0b' },
    { label: 'Overdue', value: overdueBorrows.length, icon: 'fa-triangle-exclamation', color: '#ef4444' },
    { label: 'Returned', value: returnedBorrows.length, icon: 'fa-check-circle', color: '#22c55e' },
  ];

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="text-2xl" style={{ color: s.color }}><i className={`fas ${s.icon}`} /></div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top books */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-slate-800"><i className="fas fa-trophy mr-2 text-yellow-500" />Most Borrowed Books</h3>
          </div>
          <div className="p-4">
            {topBooks.length === 0 ? (
              <div className="text-center py-6 text-slate-400"><p>No borrow data yet.</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500"><th className="pb-2">Book</th><th className="pb-2 text-right">Borrows</th></tr></thead>
                <tbody>
                  {topBooks.map(b => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-2 max-w-[150px] truncate" title={b.title}>{b.title}</td>
                      <td className="py-2 text-right font-semibold">{borrowCounts[b.id] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top members */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-slate-800"><i className="fas fa-user-graduate mr-2 text-purple-500" />Most Active Members</h3>
          </div>
          <div className="p-4">
            {topMembers.length === 0 ? (
              <div className="text-center py-6 text-slate-400"><p>No borrow data yet.</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500"><th className="pb-2">Member</th><th className="pb-2 text-right">Borrows</th></tr></thead>
                <tbody>
                  {topMembers.map(m => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2">{m.name}</td>
                      <td className="py-2 text-right font-semibold">{memberCounts[m.id] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Overdue list */}
      {overdueBorrows.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h3 className="font-semibold text-red-800"><i className="fas fa-triangle-exclamation mr-2" />Overdue Books ({overdueBorrows.length})</h3>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500"><th className="pb-2">Book</th><th className="pb-2">Member</th><th className="pb-2">Due Date</th></tr></thead>
              <tbody>
                {overdueBorrows.map(br => {
                  const b = books.find(bk => bk.id === br.bookId);
                  const m = members.find(mb => mb.id === br.memberId);
                  return (
                    <tr key={br.id} className="border-b last:border-0">
                      <td className="py-2">{b?.title || 'Unknown'}</td>
                      <td className="py-2">{m?.name || 'Unknown'}</td>
                      <td className="py-2"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{formatDate(br.dueDate)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
