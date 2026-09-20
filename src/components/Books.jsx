import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { fileToBase64 } from '../utils/helpers';
import Modal from './Modal';
import BookDetailModal from './BookDetailModal';

// Static category list
const CATEGORIES = [
  'Fiction',
  'Science',
  'Social Science',
  'Technology',
  'History & Geography',
  'Business',
  'Education',
  'Programming',
  'Biography',
  'Philosophy',
  'Arts',
  'Health',
  'Travel',
  'Cooking',
  'Religion',
  'Literature',
  'Language',
  'Self-help',
  'Others'
];

export default function Books() {
  const { data, addBook, editBook, deleteBook } = useData();
  const location = useLocation();
  const books = data.books || [];
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailBook, setDetailBook] = useState(null);

  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publishYear: new Date().getFullYear(),
    publisher: '',
    quantity: 1,
    description: '',
    coverImage: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      openModal();
    }
  }, [location.search]);

  const filterCategories = useMemo(() => {
    const set = new Set(books.map((b) => b.category).filter(Boolean));
    return ['All Categories', ...Array.from(set)];
  }, [books]);

  const publishers = useMemo(() => {
    const set = new Set(books.map((b) => b.publisher).filter(Boolean));
    return ['All Publishers', ...Array.from(set)];
  }, [books]);

  const filtered = useMemo(() => {
    let list = books;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((b) =>
        b.title.toLowerCase().includes(s) ||
        b.author.toLowerCase().includes(s) ||
        (b.isbn && b.isbn.toLowerCase().includes(s)) ||
        (b.publisher && b.publisher.toLowerCase().includes(s))
      );
    }
    if (categoryFilter && categoryFilter !== 'All Categories') {
      list = list.filter((b) => b.category === categoryFilter);
    }
    if (publisherFilter && publisherFilter !== 'All Publishers') {
      list = list.filter((b) => b.publisher === publisherFilter);
    }
    return list;
  }, [books, search, categoryFilter, publisherFilter]);

  const openModal = (book = null) => {
    if (book) {
      setEditingId(book.id);
      setForm({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        category: book.category || '',
        publishYear: book.publishYear || new Date().getFullYear(),
        publisher: book.publisher || '',
        quantity: book.quantity,
        description: book.description || '',
        coverImage: book.coverImage || '',
      });
    } else {
      setEditingId(null);
      setForm({
        title: '',
        author: '',
        isbn: '',
        category: '',
        publishYear: new Date().getFullYear(),
        publisher: '',
        quantity: 1,
        description: '',
        coverImage: '',
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.author.trim()) return;
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim() || 'N/A',
      category: form.category.trim() || 'Others',
      publishYear: parseInt(form.publishYear) || new Date().getFullYear(),
      publisher: form.publisher.trim() || 'Independent',
      quantity: parseInt(form.quantity) || 1,
      description: form.description.trim() || '',
      coverImage: form.coverImage || '',
    };
    if (editingId) {
      const old = books.find((b) => b.id === editingId);
      const diff = payload.quantity - (old ? old.quantity : 0);
      editBook(editingId, { ...payload, available: Math.max(0, (old ? old.available : payload.quantity) + diff) });
    } else {
      addBook({ ...payload, available: payload.quantity });
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this book? This will also remove associated borrow and reservation records.')) {
      deleteBook(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[240px] flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search title, author, publisher, ISBN..."
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {filterCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
            value={publisherFilter}
            onChange={(e) => setPublisherFilter(e.target.value)}
          >
            {publishers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-1.5 shadow-sm"
          onClick={() => openModal()}
        >
          <i className="fas fa-plus mr-1" /> Add Book
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-book text-4xl block mb-2" />
              <p>{search || categoryFilter || publisherFilter ? 'No matching books found.' : 'No books in the library yet.'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Cover</th>
                  <th className="px-4 py-3 text-left">Title (Click for Details)</th>
                  <th className="px-4 py-3 text-left">Author</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Publisher</th>
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Avail.</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div
                        onClick={() => setDetailBook(b)}
                        className="w-10 h-14 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200 cursor-pointer hover:opacity-80 transition"
                        title="Click to view details"
                      >
                        {b.coverImage ? (
                          <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-book text-slate-300 text-xs" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <button
                        onClick={() => setDetailBook(b)}
                        className="text-left font-semibold text-slate-800 hover:text-blue-600 transition block truncate"
                        title="Click to view details"
                      >
                        {b.title}
                      </button>
                      <span className="block text-[11px] text-slate-400 font-normal">ISBN: {b.isbn || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.author}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {b.category || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{b.publisher || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-semibold">{b.publishYear || '—'}</td>
                    <td className="px-4 py-3 font-medium">{b.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        b.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {b.available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        className="text-slate-500 hover:text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded-lg transition"
                        onClick={() => setDetailBook(b)}
                        title="View Book Details"
                      >
                        <i className="fas fa-eye" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded-lg transition"
                        onClick={() => openModal(b)}
                        title="Edit Book"
                      >
                        <i className="fas fa-pen" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 text-xs bg-red-50 px-2 py-1 rounded-lg transition"
                        onClick={() => handleDelete(b.id)}
                        title="Delete Book"
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit / Add Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Book' : 'Add New Book'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cover Image</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
                {form.coverImage ? (
                  <img src={form.coverImage} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-image text-slate-300 text-xl" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const b64 = await fileToBase64(file);
                    setForm((prev) => ({ ...prev, coverImage: b64 }));
                  }}
                />
                {form.coverImage && (
                  <div>
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                    >
                      <i className="fas fa-trash-can mr-1" /> Remove image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Title *</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="Book title" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Author *</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.author} onChange={(e) => setForm({...form, author: e.target.value})} placeholder="Author name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">ISBN</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.isbn} onChange={(e) => setForm({...form, isbn: e.target.value})} placeholder="ISBN number" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.category}
                onChange={(e) => setForm({...form, category: e.target.value})}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Publisher</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.publisher} onChange={(e) => setForm({...form, publisher: e.target.value})} placeholder="e.g. Penguin" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Publication Year</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.publishYear} onChange={(e) => setForm({...form, publishYear: e.target.value})} min={1000} max={2100} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Quantity</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.quantity} onChange={(e) => setForm({...form, quantity: parseInt(e.target.value) || 1})} min={1} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
            <textarea rows="3" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Brief synopsis or description" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50 text-sm font-medium" onClick={closeModal}>Cancel</button>
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-sm" onClick={handleSubmit}>{editingId ? 'Update Book' : 'Add Book'}</button>
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
