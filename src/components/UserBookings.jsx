import React from 'react';
import { useData, formatDate, isOverdue } from '../hooks/useData';

export default function UserBookings() {
  const { data, currentUser, cancelBooking } = useData();
  const { books, borrows, bookings = [] } = data;

  if (!currentUser) return null;

  const myBookings = bookings.filter(b => b.memberId === currentUser.id);
  const myBorrows = borrows.filter(b => b.memberId === currentUser.id);

  const getBook = (id) => books.find(b => b.id === id);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Library Activity</h1>
        <p className="text-sm text-slate-500">Track your reserved books and active borrowed items.</p>
      </div>

      {/* Pending / Active Reservations */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-bookmark text-blue-500" /> My Bookings & Reservations ({myBookings.length})
          </h2>
        </div>

        <div className="p-4">
          {myBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <i className="fas fa-calendar-xmark text-4xl mb-2 block" />
              <p>You have no active book reservations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-3 px-3">Book Title</th>
                    <th className="pb-3 px-3">Reserved On</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map(bk => {
                    const book = getBook(bk.bookId);
                    return (
                      <tr key={bk.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{book?.title || 'Unknown Book'}</span>
                          <span className="text-xs text-slate-400">by {book?.author || '—'}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(bk.bookingDate)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            bk.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : bk.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {bk.status === 'pending' && <i className="fas fa-hourglass-half mr-1" />}
                            {bk.status === 'approved' && <i className="fas fa-check-circle mr-1" />}
                            {bk.status === 'cancelled' && <i className="fas fa-ban mr-1" />}
                            {bk.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {bk.status === 'pending' && (
                            <button
                              onClick={() => cancelBooking(bk.id)}
                              className="text-rose-600 hover:text-rose-800 text-xs bg-rose-50 px-2.5 py-1 rounded-lg transition"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Borrow History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-handshake text-emerald-500" /> My Borrowed Books ({myBorrows.length})
          </h2>
        </div>

        <div className="p-4">
          {myBorrows.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <i className="fas fa-book-reader text-4xl mb-2 block" />
              <p>No borrow history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-3 px-3">Book Title</th>
                    <th className="pb-3 px-3">Borrowed On</th>
                    <th className="pb-3 px-3">Due Date</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myBorrows.map(br => {
                    const book = getBook(br.bookId);
                    const overdue = br.status === 'borrowed' && isOverdue(br.dueDate);
                    return (
                      <tr key={br.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{book?.title || 'Unknown Book'}</span>
                          <span className="text-xs text-slate-400">Publisher: {book?.publisher || '—'} ({book?.publishYear || '—'})</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(br.borrowDate)}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(br.dueDate)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            br.status === 'borrowed'
                              ? (overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800')
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {br.status === 'borrowed' ? (overdue ? 'Overdue' : 'Active Borrow') : 'Returned'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
