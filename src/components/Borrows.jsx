import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { calculateOverdueFine, formatCurrency, formatDate, isOverdue } from '../utils/helpers';
import Modal from './Modal';

export default function Borrows() {
  const { data, addBorrow, returnBorrow, markLost, deleteBorrow } = useData();
  const { books, members, borrows, settings } = data;
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ bookId: '', memberId: '', dueDays: 14 });
  const [activeOnly, setActiveOnly] = useState(true);

  const activeMembers = members.filter(m => m.active !== false);
  const availableBooks = books.filter(b => b.available > 0);

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
    if (activeOnly) list = list.filter(b => b.status === 'borrowed');
    return list;
  }, [borrows, activeOnly]);

  const getBookTitle = (id) => books.find(b => b.id === id)?.title || 'Unknown';
  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown';

  const openModal = () => {
    setForm({ bookId: availableBooks[0]?.id || '', memberId: activeMembers[0]?.id || '', dueDays: 14 });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleBorrow = () => {
    if (!form.bookId || !form.memberId) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (parseInt(form.dueDays) || 14));
    addBorrow({ bookId: form.bookId, memberId: form.memberId, dueDate: dueDate.toISOString().slice(0, 10) });
    closeModal();
  };

  const handleReturn = (id) => { if (window.confirm('Confirm return?')) returnBorrow(id); };
  const handleDelete = (id) => { if (window.confirm('Delete this borrow record?')) deleteBorrow(id); };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={() => setActiveOnly(!activeOnly)}
            className="rounded text-blue-600 focus:ring-blue-400"
          />
          Show active borrows only
        </label>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm disabled:opacity-50 flex items-center gap-1 shadow-sm"
          onClick={openModal}
          disabled={availableBooks.length === 0 || activeMembers.length === 0}
        >
          <i className="fas fa-handshake mr-1" /> Issue Book
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredBorrows.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-handshake text-4xl block mb-2" />
              <p>{activeOnly ? 'No active borrows.' : 'No borrow records yet.'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Book</th>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Borrowed</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Fine / Fee</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrows.map(br => {
                  const overdue = br.status === 'borrowed' && isOverdue(br.dueDate);
                  return (
                    <tr key={br.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 max-w-[150px] truncate font-medium text-slate-800" title={getBookTitle(br.bookId)}>
                        {getBookTitle(br.bookId)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{getMemberName(br.memberId)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(br.borrowDate)}</td>
                      <td className="px-4 py-3 text-xs">{formatDate(br.dueDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          br.status === 'lost'
                            ? 'bg-red-100 text-red-700'
                            : br.status === 'borrowed'
                            ? (overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {br.status === 'lost' ? 'Lost' : br.status === 'borrowed' ? (overdue ? 'Overdue' : 'Borrowed') : 'Returned'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {(() => {
                          if (br.status === 'lost') {
                            return <span className="text-red-600 font-semibold">{formatCurrency(br.fine, settings?.currency)} (lost)</span>;
                          }
                          if (br.status === 'borrowed' && isOverdue(br.dueDate)) {
                            const f = calculateOverdueFine(br.dueDate, settings?.overdueFineTiers);
                            return <span className="text-red-600 font-semibold">{formatCurrency(f, settings?.currency)}</span>;
                          }
                          if (br.status === 'returned' && br.fine > 0) {
                            return <span className="text-red-600 font-semibold">{formatCurrency(br.fine, settings?.currency)}</span>;
                          }
                          return <span className="text-slate-400">—</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {br.status === 'borrowed' && (
                          <>
                            <button
                              className="text-green-600 hover:text-green-800 text-xs bg-green-50 px-2.5 py-1 rounded"
                              onClick={() => handleReturn(br.id)}
                              title="Return Book"
                            >
                              <i className="fas fa-undo mr-1" /> Return
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700 text-xs bg-red-50 px-2 py-1 rounded"
                              onClick={() => {
                                if (window.confirm('Mark this book as LOST? A lost-book fee will be charged and quantity reduced.')) {
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
                          className="text-slate-400 hover:text-slate-600 text-xs bg-slate-100 px-2 py-1 rounded"
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

      <Modal isOpen={modalOpen} onClose={closeModal} title="Issue Book to Member">
        <label className="block text-sm font-medium text-slate-700 mt-2">Book *</label>
        <select className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.bookId} onChange={(e) => setForm({...form, bookId: e.target.value})}>
          {availableBooks.map(b => <option key={b.id} value={b.id}>{b.title} ({b.available} available)</option>)}
        </select>
        <label className="block text-sm font-medium text-slate-700 mt-2">Member *</label>
        <select className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.memberId} onChange={(e) => setForm({...form, memberId: e.target.value})}>
          {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.membershipId || m.email})</option>)}
        </select>
        <label className="block text-sm font-medium text-slate-700 mt-2">Due in (days)</label>
        <input type="number" className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.dueDays} onChange={(e) => setForm({...form, dueDays: parseInt(e.target.value) || 14})} min={1} max={90} />
        <div className="flex justify-end gap-3 mt-4">
          <button className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-50 text-sm" onClick={closeModal}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 text-sm font-medium" onClick={handleBorrow} disabled={!form.bookId || !form.memberId}>
            <i className="fas fa-handshake mr-1" /> Issue Book
          </button>
        </div>
      </Modal>
    </div>
  );
}
