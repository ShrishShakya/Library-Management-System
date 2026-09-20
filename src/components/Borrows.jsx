import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../hooks/useData';
import {
  calculateOverdueFine, formatCurrency, formatDate, isOverdue,
  isMembershipExpired, daysBetween, today, getBorrowFee,
} from '../utils/helpers';
import Modal from './Modal';
import BookDetailModal from './BookDetailModal';

export default function Borrows() {
  const { data, addBorrow, returnBorrow, markLost, deleteBorrow } = useData();
  const { books = [], members = [], borrows = [], settings } = data;
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailBook, setDetailBook] = useState(null);
  const [form, setForm] = useState({ bookId: '', memberId: '', dueDays: 14 });
  const [activeOnly, setActiveOnly] = useState(true);

  const activeMembers = members.filter((m) => m.active !== false);
  const availableBooks = books.filter((b) => b.available > 0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'borrow' && availableBooks.length > 0 && activeMembers.length > 0) {
      openModal();
    } else if (params.get('action') === 'return') {
      setActiveOnly(true);
    }
  }, [location.search, availableBooks.length, activeMembers.length]);

  const filteredBorrows = useMemo(() => {
    let list = [...borrows].sort((a, b) => (b.borrowDate || '').localeCompare(a.borrowDate || ''));
    if (activeOnly) list = list.filter((b) => b.status === 'borrowed');
    return list;
  }, [borrows, activeOnly]);

  const getBook = (id) => books.find((b) => b.id === id);
  const getBookTitle = (id) => getBook(id)?.title || 'Unknown';
  const getMember = (id) => members.find((m) => m.id === id);
  const getMemberName = (id) => getMember(id)?.name || 'Unknown';

  const selectedMember = members.find((m) => m.id === form.memberId);
  const selectedMemberExpired = selectedMember && selectedMember.role !== 'admin' && isMembershipExpired(selectedMember.membershipExpiryDate);

  const openModal = () => {
    setForm({
      bookId: availableBooks[0]?.id || '',
      memberId: activeMembers[0]?.id || '',
      dueDays: 14,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleBorrow = () => {
    if (!form.bookId || !form.memberId) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (parseInt(form.dueDays) || 14));
    addBorrow({
      bookId: form.bookId,
      memberId: form.memberId,
      dueDate: dueDate.toISOString().slice(0, 10),
    });
    closeModal();
  };

  const handleReturn = (id) => {
    if (window.confirm('Confirm returning this book?')) returnBorrow(id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this borrow record permanently?')) deleteBorrow(id);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 font-medium">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={() => setActiveOnly(!activeOnly)}
            className="rounded text-blue-600 focus:ring-blue-400"
          />
          Show active borrows only
        </label>
        <button
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          onClick={openModal}
          disabled={availableBooks.length === 0 || activeMembers.length === 0}
        >
          <i className="fas fa-handshake mr-1" /> Issue Book
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredBorrows.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-handshake text-4xl block mb-2" />
              <p>{activeOnly ? 'No active borrows.' : 'No borrow records yet.'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Book Title (Click for details)</th>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Borrowed Date</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Borrow Fee</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Overdue Fine</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBorrows.map((br) => {
                  const overdue = br.status === 'borrowed' && isOverdue(br.dueDate);
                  const book = getBook(br.bookId);
                  const member = getMember(br.memberId);
                  const fee = br.borrowFee != null ? br.borrowFee : getBorrowFee(book, settings);

                  return (
                    <tr key={br.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 max-w-[180px]">
                        <button
                          onClick={() => book && setDetailBook(book)}
                          className="font-semibold text-slate-800 hover:text-blue-600 transition text-left truncate block"
                          title="Click to view book"
                        >
                          {getBookTitle(br.bookId)}
                        </button>
                        <span className="text-[11px] text-slate-400 font-normal">by {book?.author || '—'}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-semibold">{getMemberName(br.memberId)}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {member?.email || '—'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(br.borrowDate)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-700">{formatDate(br.dueDate)}</td>

                      <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                        {formatCurrency(fee, settings?.currency)}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          br.status === 'lost'
                            ? 'bg-red-100 text-red-700'
                            : br.status === 'borrowed'
                            ? (overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800')
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {br.status === 'lost' ? 'Lost Book' : br.status === 'borrowed' ? (overdue ? 'Overdue' : 'Borrowed') : 'Returned'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        {(() => {
                          if (br.status === 'lost') {
                            return <span className="text-red-600 font-bold">{formatCurrency(br.fine, settings?.currency)} (Lost)</span>;
                          }
                          if (br.status === 'borrowed' && isOverdue(br.dueDate)) {
                            const f = calculateOverdueFine(br.dueDate, settings?.overdueFineTiers);
                            return <span className="text-red-600 font-bold">{formatCurrency(f, settings?.currency)}</span>;
                          }
                          if (br.status === 'returned' && br.fine > 0) {
                            return <span className="text-red-600 font-semibold">{formatCurrency(br.fine, settings?.currency)}</span>;
                          }
                          return <span className="text-slate-400">—</span>;
                        })()}
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5">
                        {br.status === 'borrowed' && (
                          <>
                            <button
                              className="text-emerald-700 hover:text-emerald-900 text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition font-medium"
                              onClick={() => handleReturn(br.id)}
                              title="Return Book"
                            >
                              <i className="fas fa-undo mr-1 text-[10px]" /> Return
                            </button>
                            <button
                              className="text-rose-600 hover:text-rose-800 text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg transition"
                              onClick={() => {
                                if (window.confirm('Mark this book as LOST? A replacement fee will be charged.')) {
                                  markLost(br.id);
                                }
                              }}
                              title="Mark as Lost"
                            >
                              <i className="fas fa-circle-exclamation" />
                            </button>
                          </>
                        )}
                        <button
                          className="text-slate-400 hover:text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded-lg transition"
                          onClick={() => handleDelete(br.id)}
                          title="Delete Record"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Issue Book to Member">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Book *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.bookId}
              onChange={(e) => setForm({ ...form, bookId: e.target.value })}
            >
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.available} available) — {b.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Member *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
            >
              {activeMembers.map((m) => {
                const expired = m.role !== 'admin' && isMembershipExpired(m.membershipExpiryDate);
                const daysLeft = m.membershipExpiryDate ? daysBetween(today(), m.membershipExpiryDate) : 0;
                return (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email}) — {m.role === 'admin' ? 'Admin' : expired ? 'EXPIRED' : `Active (${daysLeft}d left)`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dynamic Borrow Fee display */}
          {form.bookId && (() => {
            const selectedBook = books.find((b) => b.id === form.bookId);
            const fee = getBorrowFee(selectedBook, settings);
            const isAcademic = selectedBook?.category === 'Academic (Nepal)';
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-950">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Borrow Fee:</span>
                  <span className="font-bold text-blue-900 text-sm">{formatCurrency(fee, settings?.currency)}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAcademic ? 'Academic rate (discounted)' : 'Standard book borrow fee'}
                </p>
              </div>
            );
          })()}

          {selectedMemberExpired && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">
              <i className="fas fa-triangle-exclamation mr-1.5" />
              <strong>Warning:</strong> {selectedMember.name}'s membership has expired ({formatDate(selectedMember.membershipExpiryDate)}). Please renew their membership before issuing a book.
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Loan Period (Days)</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.dueDays}
              onChange={(e) => setForm({ ...form, dueDays: parseInt(e.target.value) || 14 })}
              min={1}
              max={90}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50 text-sm font-medium"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50 shadow-sm"
            onClick={handleBorrow}
            disabled={!form.bookId || !form.memberId || selectedMemberExpired}
          >
            <i className="fas fa-handshake mr-1" /> Issue Book
          </button>
        </div>
      </Modal>

      {/* Book Detail Modal */}
      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
        />
      )}
    </div>
  );
}
