import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatDate, formatCurrency, isMembershipExpired } from '../utils/helpers';

export default function Reservations() {
  const {
    data, currentUser, addReservation, cancelReservation,
  } = useData();
  const isAdmin = currentUser?.role === 'admin';
  const isExpired = !isAdmin && isMembershipExpired(currentUser?.membershipExpiryDate);
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  const books = data.books || [];
  const members = data.members || [];
  const reservations = data.reservations || [];
  const settings = data.settings;

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
    if (isExpired) return;
    addReservation(bookId, currentUser.id);
  };

  return (
    <div className="space-y-4">
      {/* Expired alert for member */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <i className="fas fa-triangle-exclamation text-red-600 text-lg" />
            <span>Your membership is expired ({formatDate(currentUser?.membershipExpiryDate)}). Please renew your membership to place new reservations.</span>
          </div>
        </div>
      )}

      {/* Info banner (user) */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl p-4 text-sm flex flex-wrap items-center justify-between gap-2">
          <div>
            <i className="fas fa-circle-info mr-2 text-blue-600" />
            Reservation fee: <strong>{formatCurrency(settings?.reservationFee, settings?.currency)}</strong> ·
            Hold period: <strong>{settings?.reservationHoldDays} days</strong>
          </div>
          <div className="font-semibold text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            Active reservations: {myActiveCount} / {settings?.maxReservationsPerUser || 3}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Search reservations by book title..."
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <select
            className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
          >
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.membershipId || m.email})</option>
            ))}
          </select>
        )}
      </div>

      {/* Available books to reserve (user view) */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fas fa-bookmark text-blue-500" />
              Available Books for Immediate Reservation
            </h3>
          </div>
          <div className="p-4 grid md:grid-cols-2 gap-3">
            {books.filter((b) => b.available > 0).slice(0, 6).map((b) => (
              <div key={b.id} className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 hover:bg-slate-50 transition">
                <div className="w-12 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                  {b.coverImage ? (
                    <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <i className="fas fa-book text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-slate-800">{b.title}</p>
                  <p className="text-xs text-slate-500 truncate">{b.author}</p>
                  <span className="text-[11px] text-emerald-600 font-semibold">{b.available} copies available</span>
                </div>
                <button
                  onClick={() => handleReserve(b.id)}
                  className="text-xs bg-blue-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-blue-700 font-semibold disabled:opacity-50 transition shadow-sm"
                  disabled={isExpired || myActiveCount >= (settings?.maxReservationsPerUser || 3)}
                >
                  {isExpired ? 'Expired' : 'Reserve'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservations table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {visible.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-bookmark text-4xl block mb-2" />
              <p>No reservations found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Book</th>
                  {isAdmin && <th className="px-4 py-3 text-left">Member</th>}
                  <th className="px-4 py-3 text-left">Reserved On</th>
                  <th className="px-4 py-3 text-left">Hold Expires</th>
                  <th className="px-4 py-3 text-left">Reservation Fee</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((r) => {
                  const b = getBook(r.bookId);
                  const m = getMember(r.memberId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 max-w-[180px] truncate font-semibold text-slate-800">
                        {b?.title || 'Unknown Book'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {m?.name || 'Unknown'} <span className="text-slate-400 text-xs font-mono">({m?.membershipId || m?.email})</span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.reservedDate || r.bookingDate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.expiresAt)}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(r.fee, settings?.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'fulfilled' || r.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => cancelReservation(r.id)}
                            className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1 rounded-xl transition font-medium"
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
