import React from 'react';
import { useData } from '../hooks/useData';
import { formatDate, isOverdue } from '../utils/helpers';

export default function BookDetailModal({ book, onClose, onReserve }) {
  const { data, currentUser } = useData();

  if (!book) return null;

  const isAdmin = currentUser?.role === 'admin';
  const activeBorrows = (data.borrows || []).filter(
    (b) => b.bookId === book.id && b.status === 'borrowed'
  );
  const activeReservations = (data.reservations || []).filter(
    (r) => r.bookId === book.id && r.status === 'pending'
  );

  const myActiveReservation = activeReservations.find(
    (r) => r.memberId === currentUser?.id
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Close"
          >
            <i className="fas fa-times" />
          </button>
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            {/* Cover image */}
            <div className="w-32 h-44 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/10 shadow-lg">
              {book.coverImage ? (
                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                  <i className="fas fa-book text-4xl text-slate-600" />
                </div>
              )}
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              <span className="inline-block bg-white/15 text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2">
                {book.category || 'General'}
              </span>
              <h2 className="text-2xl font-bold mb-1 leading-snug">{book.title}</h2>
              <p className="text-slate-300 text-sm mb-3 font-medium">by {book.author}</p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-mono text-slate-200">
                  ISBN: {book.isbn || '—'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  book.available > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <i className={`fas ${book.available > 0 ? 'fa-check' : 'fa-times'}`} />
                  {book.available} / {book.quantity} copies available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Description */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i className="fas fa-align-left text-blue-500" /> Synopsis & Description
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {book.description || 'No overview or description provided for this book.'}
            </p>
          </section>

          {/* Book Metadata */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i className="fas fa-circle-info text-blue-500" /> Book Information & Borrow Fee
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-xs">Publisher</p>
                <p className="text-slate-800 font-semibold truncate">{book.publisher || 'Independent'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-xs">Publication Year</p>
                <p className="text-slate-800 font-semibold">{book.publishYear || '—'}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-xs">Borrow Fee</p>
                <p className="text-blue-700 font-bold">
                  {book.category === 'Academic (Nepal)' ? `${data.settings?.currency || 'NRs.'} 10.00 (Academic)` : `${data.settings?.currency || 'NRs.'} 50.00`}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-xs">Inventory (Avail/Total)</p>
                <p className="text-slate-800 font-semibold">{book.available} / {book.quantity} copies</p>
              </div>
            </div>
          </section>

          {/* Admin: Active Borrows list */}
          {isAdmin && activeBorrows.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <i className="fas fa-handshake text-emerald-500" /> Currently Issued To ({activeBorrows.length})
              </h3>
              <div className="space-y-2">
                {activeBorrows.map((b) => {
                  const m = (data.members || []).find((x) => x.id === b.memberId);
                  const overdue = isOverdue(b.dueDate);
                  return (
                    <div key={b.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div>
                        <p className="font-semibold text-slate-800">{m?.name || 'Unknown Member'}</p>
                        <p className="text-xs text-slate-400">{m?.email}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {overdue ? 'Overdue · ' : 'Due '} {formatDate(b.dueDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Active reservations (Admin view) */}
          {isAdmin && activeReservations.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <i className="fas fa-bookmark text-blue-500" /> Active Member Reservations ({activeReservations.length})
              </h3>
              <div className="space-y-1.5 text-sm">
                {activeReservations.map((r) => {
                  const m = (data.members || []).find((x) => x.id === r.memberId);
                  return (
                    <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 px-3.5 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700">
                        {m?.name || 'Unknown'} <span className="text-slate-400 font-normal">({m?.email || ''})</span>
                      </span>
                      <span className="text-slate-500">
                        Pickup by <strong>{formatDate(r.pickupDate || r.expiresAt)}</strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition"
          >
            Close
          </button>
          {!isAdmin && book.available > 0 && !myActiveReservation && (
            <button
              onClick={() => {
                onReserve?.(book);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md transition flex items-center gap-2"
            >
              <i className="fas fa-bookmark" /> Reserve This Book
            </button>
          )}
          {myActiveReservation && (
            <span className="px-4 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5">
              <i className="fas fa-clock" /> Already Reserved by You
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
