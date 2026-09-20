import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatDate } from '../utils/helpers';

export default function Reservations() {
  const {
    data, currentUser, addReservation, cancelReservation,
  } = useData();
  const isAdmin = currentUser?.role === 'admin';
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  const books = data.books || [];
  const members = data.members || [];
  const reservations = data.reservations || [];

  const visible = useMemo(() => {
    let list = [...reservations].sort((a, b) =>
      (b.reservedDate || '').localeCompare(a.reservedDate || '')
    );
    if (!isAdmin) {
      list = list.filter((r) => r.memberId === currentUser?.id);
    } else if (memberFilter) {
      list = list.filter((r) => r.memberId === memberFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((r) => {
        const b = books.find((bk) => bk.id === r.bookId);
        return b && b.title.toLowerCase().includes(s);
      });
    }
    return list;
  }, [reservations, books, isAdmin, currentUser, memberFilter, search]);

  const getBook = (id) => books.find((b) => b.id === id);
  const getMember = (id) => members.find((m) => m.id === id);

  const myActiveCount = reservations.filter(
    (r) => r.memberId === currentUser?.id && r.status === 'pending'
  ).length;

  const handleReserve = (bookId) => {
    addReservation(bookId, currentUser.id);
  };

  return (
    <div>
      {/* Info banner (user) */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-4 text-sm">
          <i className="fas fa-circle-info mr-2" />
          Reservation fee: <strong>{data.settings.currency}{data.settings.reservationFee.toFixed(2)}</strong> ·
          Hold period: <strong>{data.settings.reservationHoldDays} days</strong> ·
          Your active reservations: <strong>{myActiveCount}/{data.settings.maxReservationsPerUser}</strong>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by book title..."
          className="flex-1 min-w-[200px] border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isAdmin && (
          <select
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Available books to reserve (user view) */}
      {!isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-slate-800">
              <i className="fas fa-bookmark text-blue-500 mr-2" />Available to Reserve
            </h3>
          </div>
          <div className="p-4 grid md:grid-cols-2 gap-3">
            {books.filter((b) => b.available > 0).slice(0, 6).map((b) => (
              <div key={b.id} className="flex items-center gap-3 border rounded-lg p-3">
                <div className="w-12 h-16 bg-slate-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                  {b.coverImage
                    ? <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                    : <i className="fas fa-book text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  <p className="text-xs text-slate-500 truncate">{b.author}</p>
                </div>
                <button
                  onClick={() => handleReserve(b.id)}
                  className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600"
                  disabled={myActiveCount >= data.settings.maxReservationsPerUser}
                >
                  Reserve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservations table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {visible.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-bookmark text-4xl block mb-2" />
              <p>No reservations found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Book</th>
                  {isAdmin && <th className="px-4 py-3 text-left">Member</th>}
                  <th className="px-4 py-3 text-left">Reserved</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Fee</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const b = getBook(r.bookId);
                  const m = getMember(r.memberId);
                  return (
                    <tr key={r.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 max-w-[150px] truncate">{b?.title || 'Unknown'}</td>
                      {isAdmin && <td className="px-4 py-3">{m?.name || 'Unknown'}</td>}
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.reservedDate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.expiresAt)}</td>
                      <td className="px-4 py-3">{data.settings.currency}{Number(r.fee || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          r.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => cancelReservation(r.id)}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100"
                          >
                            Cancel
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
    </div>
  );
}
