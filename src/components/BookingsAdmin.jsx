import React, { useState } from 'react';
import { useData, formatDate } from '../hooks/useData';

export default function BookingsAdmin() {
  const { data, approveBooking, cancelBooking } = useData();
  const { books, members, bookings = [] } = data;
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all'

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);

  const getBook = (id) => books.find(b => b.id === id);
  const getMember = (id) => members.find(m => m.id === id);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-slate-800 text-lg">Member Reservations</h2>
          <span className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            {bookings.filter(b => b.status === 'pending').length} Pending
          </span>
        </div>

        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setFilter('pending')}
          >
            Pending Only
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setFilter('all')}
          >
            All Bookings
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-bookmark text-4xl block mb-2" />
              <p>{filter === 'pending' ? 'No pending book reservations.' : 'No reservation records found.'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Book Title</th>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Availability</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(bk => {
                  const book = getBook(bk.bookId);
                  const member = getMember(bk.memberId);
                  const isAvail = book && book.available > 0;

                  return (
                    <tr key={bk.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block max-w-[200px] truncate">{book?.title || 'Unknown'}</span>
                        <span className="text-xs text-slate-400">Author: {book?.author || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 block">{member?.name || 'Unknown'}</span>
                        <span className="text-xs text-slate-400">{member?.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{formatDate(bk.bookingDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isAvail ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {book ? `${book.available} available` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          bk.status === 'pending' ? 'bg-amber-100 text-amber-800' : bk.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {bk.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {bk.status === 'pending' && (
                          <>
                            <button
                              disabled={!isAvail}
                              onClick={() => approveBooking(bk.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm font-medium transition disabled:opacity-50"
                            >
                              <i className="fas fa-check mr-1" /> Approve & Borrow
                            </button>
                            <button
                              onClick={() => cancelBooking(bk.id)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs px-2.5 py-1.5 rounded-lg font-medium transition"
                            >
                              Reject
                            </button>
                          </>
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
