import React from 'react';
import { useData } from '../hooks/useData';
import { formatDate, formatCurrency, isOverdue } from '../utils/helpers';

export default function UserBookings() {
  const { data, currentUser, cancelReservation, getMemberFines } = useData();
  const { books = [], borrows = [], reservations = [], settings } = data;

  if (!currentUser) return null;

  const myReservations = (reservations || []).filter((r) => r.memberId === currentUser.id);
  const myBorrows = (borrows || []).filter((b) => b.memberId === currentUser.id);
  const memberFines = getMemberFines(currentUser.id);

  const getBook = (id) => books.find((b) => b.id === id);

  return (
    <div className="space-y-6">
      {/* Outstanding Fines Banner (if any) */}
      {memberFines.total > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-red-800">
          <div className="flex items-center gap-3">
            <i className="fas fa-triangle-exclamation text-xl text-red-600" />
            <div>
              <p className="font-semibold text-sm">Outstanding Fines / Fees</p>
              <p className="text-xs text-red-600">
                You have an outstanding balance for overdue/lost items. Please settle this with the library desk.
              </p>
            </div>
          </div>
          <div className="text-lg font-bold text-red-700">
            {formatCurrency(memberFines.total, settings?.currency)}
          </div>
        </div>
      )}

      {/* Active Reservations */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-bookmark text-blue-500" /> My Book Reservations ({myReservations.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Limit: {myReservations.filter((r) => r.status === 'pending').length}/{settings?.maxReservationsPerUser || 3}
          </span>
        </div>

        <div className="p-4">
          {myReservations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <i className="fas fa-bookmark text-4xl mb-2 block" />
              <p>You have no active book reservations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="pb-3 px-3">Book</th>
                    <th className="pb-3 px-3">Reserved On</th>
                    <th className="pb-3 px-3">Expires</th>
                    <th className="pb-3 px-3">Fee</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myReservations.map((res) => {
                    const book = getBook(res.bookId);
                    return (
                      <tr key={res.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
                              {book?.coverImage ? (
                                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                              ) : (
                                <i className="fas fa-book text-slate-300 text-xs" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 block">{book?.title || 'Unknown Book'}</span>
                              <span className="text-xs text-slate-400">by {book?.author || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(res.reservedDate || res.bookingDate)}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(res.expiresAt)}</td>
                        <td className="py-3 px-3 text-xs font-medium">{formatCurrency(res.fee, settings?.currency)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            res.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : res.status === 'fulfilled' || res.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {res.status === 'pending' && <i className="fas fa-clock mr-1" />}
                            {res.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {res.status === 'pending' && (
                            <button
                              onClick={() => cancelReservation(res.id)}
                              className="text-rose-600 hover:text-rose-800 text-xs bg-rose-50 px-2.5 py-1 rounded-lg transition"
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
                    <th className="pb-3 px-3">Book</th>
                    <th className="pb-3 px-3">Borrowed On</th>
                    <th className="pb-3 px-3">Due Date</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Fine / Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {myBorrows.map((br) => {
                    const book = getBook(br.bookId);
                    const overdue = br.status === 'borrowed' && isOverdue(br.dueDate);
                    return (
                      <tr key={br.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
                              {book?.coverImage ? (
                                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                              ) : (
                                <i className="fas fa-book text-slate-300 text-xs" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 block">{book?.title || 'Unknown Book'}</span>
                              <span className="text-xs text-slate-400">by {book?.author || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(br.borrowDate)}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{formatDate(br.dueDate)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            br.status === 'lost'
                              ? 'bg-rose-100 text-rose-700'
                              : br.status === 'borrowed'
                              ? (overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800')
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {br.status === 'lost' ? 'Lost' : br.status === 'borrowed' ? (overdue ? 'Overdue' : 'Active Borrow') : 'Returned'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold">
                          {br.fine > 0 ? (
                            <span className="text-red-600">{formatCurrency(br.fine, settings?.currency)}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
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
    </div>
  );
}
