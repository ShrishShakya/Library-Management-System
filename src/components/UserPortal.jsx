import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatCurrency } from '../utils/helpers';

export default function UserPortal() {
  const { data, currentUser, addReservation } = useData();
  const { books = [], borrows = [], reservations = [], settings } = data;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [publisherFilter, setPublisherFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'available' | 'popular' | 'recommended'

  // Dynamic filter lists
  const categories = useMemo(() => ['All', ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))], [books]);
  const publishers = useMemo(() => ['All', ...Array.from(new Set(books.map(b => b.publisher).filter(Boolean)))], [books]);
  const publishYears = useMemo(() => ['All', ...Array.from(new Set(books.map(b => b.publishYear).filter(Boolean))).sort((a, b) => b - a)], [books]);

  // Compute popular/trending books based on borrow & reservation counts
  const popularBooks = useMemo(() => {
    const counts = {};
    borrows.forEach(br => { counts[br.bookId] = (counts[br.bookId] || 0) + 1; });
    reservations.forEach(r => { counts[r.bookId] = (counts[r.bookId] || 0) + 1; });
    return [...books].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  }, [books, borrows, reservations]);

  // Recommended books
  const recommendedBooks = useMemo(() => {
    return books.filter(b => b.available > 0).slice(0, 4);
  }, [books]);

  // Filtered catalog
  const filteredBooks = useMemo(() => {
    let list = books;
    if (activeTab === 'available') {
      list = list.filter(b => b.available > 0);
    } else if (activeTab === 'popular') {
      list = popularBooks;
    } else if (activeTab === 'recommended') {
      list = recommendedBooks;
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(s) ||
        b.author.toLowerCase().includes(s) ||
        (b.publisher && b.publisher.toLowerCase().includes(s)) ||
        (b.isbn && b.isbn.toLowerCase().includes(s))
      );
    }
    if (categoryFilter !== 'All') {
      list = list.filter(b => b.category === categoryFilter);
    }
    if (publisherFilter !== 'All') {
      list = list.filter(b => b.publisher === publisherFilter);
    }
    if (yearFilter !== 'All') {
      list = list.filter(b => b.publishYear === parseInt(yearFilter));
    }
    return list;
  }, [books, activeTab, popularBooks, recommendedBooks, search, categoryFilter, publisherFilter, yearFilter]);

  const handleBookNow = (bookId) => {
    if (!currentUser) return;
    addReservation(bookId, currentUser.id);
  };

  const isBookedByMe = (bookId) => {
    if (!currentUser) return false;
    return reservations.some(r => r.bookId === bookId && r.memberId === currentUser.id && r.status === 'pending');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {currentUser?.name || 'Reader'}! 📖</h1>
          <p className="text-blue-100 text-sm mt-1">
            Explore our collection, search by publisher/year, or reserve your next book for {formatCurrency(settings?.reservationFee, settings?.currency)}.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center">
            <div className="text-xl font-bold">{books.filter(b => b.available > 0).length}</div>
            <div className="text-xs text-blue-100">Available Titles</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center">
            <div className="text-xl font-bold">
              {reservations.filter(r => r.memberId === currentUser?.id && r.status === 'pending').length}
            </div>
            <div className="text-xs text-blue-100">My Reservations</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Catalog', icon: 'fa-book-open' },
          { id: 'available', label: 'Books Available', icon: 'fa-circle-check' },
          { id: 'popular', label: 'Popular & Trending', icon: 'fa-fire' },
          { id: 'recommended', label: 'Recommendations', icon: 'fa-star' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <i className={`fas ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search title, author, publisher..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <select
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
          value={publisherFilter}
          onChange={(e) => setPublisherFilter(e.target.value)}
        >
          <option value="All">All Publishers</option>
          {publishers.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="All">Publication Year</option>
          {publishYears.filter(y => y !== 'All').map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Book Cards Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          <i className="fas fa-book-open text-5xl mb-3 block text-slate-300" />
          <p className="text-base font-medium">No matching books found.</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your category, publisher, or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => {
            const booked = isBookedByMe(book.id);
            const isAvailable = book.available > 0;

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {/* Visual badge */}
                {activeTab === 'popular' && (
                  <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <i className="fas fa-fire text-xs" /> Trending
                  </span>
                )}
                {activeTab === 'recommended' && (
                  <span className="absolute top-3 right-3 bg-indigo-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <i className="fas fa-star text-xs" /> Top Choice
                  </span>
                )}

                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-20 bg-slate-100 rounded-lg shadow-sm flex items-center justify-center text-slate-400 text-2xl shrink-0 overflow-hidden border border-slate-200">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <i className="fas fa-book text-slate-300 text-xl" />
                      )}
                    </div>
                    <div className="pr-12">
                      <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded mb-1">
                        {book.category || 'General'}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">by {book.author}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {book.description || 'No description available for this book.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Publisher</span>
                      <span className="font-medium text-slate-700 truncate block">{book.publisher || 'Independent'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold">Published</span>
                      <span className="font-medium text-slate-700">{book.publishYear || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className={`inline-flex items-center gap-1 font-semibold ${isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <i className={`fas ${isAvailable ? 'fa-check-circle' : 'fa-times-circle'}`} />
                      {isAvailable ? `${book.available} Available` : 'Out of Stock'}
                    </span>
                  </div>

                  {booked ? (
                    <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                      <i className="fas fa-clock" /> Reserved
                    </span>
                  ) : (
                    <button
                      disabled={!isAvailable}
                      onClick={() => handleBookNow(book.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        isAvailable
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <i className="fas fa-bookmark" />
                      {isAvailable ? 'Reserve' : 'Unavailable'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
