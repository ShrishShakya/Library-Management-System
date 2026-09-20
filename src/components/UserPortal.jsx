import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import {
  formatCurrency, formatDate, isMembershipExpired, daysBetween, today, daysFromNow,
} from '../utils/helpers';
import BookDetailModal from './BookDetailModal';

export default function UserPortal() {
  const { data, currentUser, addReservation } = useData();
  const { books = [], borrows = [], reservations = [], settings } = data;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [publisherFilter, setPublisherFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  const [detailBook, setDetailBook] = useState(null);
  const [reserveBook, setReserveBook] = useState(null);
  const [pickupDate, setPickupDate] = useState(today());
  const [error, setError] = useState('');

  const minDate = today();
  const maxDate = daysFromNow(30);

  const isExpired = isMembershipExpired(currentUser?.membershipExpiryDate);
  const daysLeft = currentUser?.membershipExpiryDate ? daysBetween(today(), currentUser.membershipExpiryDate) : 0;

  const myActiveReservations = (reservations || []).filter(
    (r) => r.memberId === currentUser?.id && r.status === 'pending'
  );

  // Dynamic filter lists
  const categories = useMemo(() => ['All', ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))], [books]);
  const publishers = useMemo(() => ['All', ...Array.from(new Set(books.map((b) => b.publisher).filter(Boolean)))], [books]);
  const publishYears = useMemo(() => ['All', ...Array.from(new Set(books.map((b) => b.publishYear).filter(Boolean))).sort((a, b) => b - a)], [books]);

  // Popular books
  const popularBooks = useMemo(() => {
    const counts = {};
    (borrows || []).forEach((br) => { counts[br.bookId] = (counts[br.bookId] || 0) + 1; });
    (reservations || []).forEach((r) => { counts[r.bookId] = (counts[r.bookId] || 0) + 1; });
    return [...books].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  }, [books, borrows, reservations]);

  const recommendedBooks = useMemo(() => {
    return books.filter((b) => b.available > 0).slice(0, 4);
  }, [books]);

  const filteredBooks = useMemo(() => {
    let list = books;
    if (activeTab === 'available') {
      list = list.filter((b) => b.available > 0);
    } else if (activeTab === 'popular') {
      list = popularBooks;
    } else if (activeTab === 'recommended') {
      list = recommendedBooks;
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((b) =>
        b.title.toLowerCase().includes(s) ||
        b.author.toLowerCase().includes(s) ||
        (b.publisher && b.publisher.toLowerCase().includes(s)) ||
        (b.isbn && b.isbn.toLowerCase().includes(s))
      );
    }
    if (categoryFilter !== 'All') {
      list = list.filter((b) => b.category === categoryFilter);
    }
    if (publisherFilter !== 'All') {
      list = list.filter((b) => b.publisher === publisherFilter);
    }
    if (yearFilter !== 'All') {
      list = list.filter((b) => b.publishYear === parseInt(yearFilter));
    }
    return list;
  }, [books, activeTab, popularBooks, recommendedBooks, search, categoryFilter, publisherFilter, yearFilter]);

  const openReserveModal = (book) => {
    setReserveBook(book);
    setPickupDate(today());
    setError('');
  };

  const closeReserveModal = () => setReserveBook(null);

  const confirmReservation = () => {
    if (!reserveBook || !currentUser) return;
    if (pickupDate < minDate) return setError('Pickup date cannot be in the past.');
    if (pickupDate > maxDate) return setError('Pickup date cannot be more than 30 days ahead.');

    const res = addReservation(reserveBook.id, currentUser.id, pickupDate);
    if (res.ok) {
      closeReserveModal();
    } else {
      setError(res.error || 'Could not place reservation. Check limit.');
    }
  };

  const isBookedByMe = (bookId) => {
    if (!currentUser) return false;
    return (reservations || []).some((r) => r.bookId === bookId && r.memberId === currentUser.id && r.status === 'pending');
  };

  return (
    <div className="space-y-6">
      {/* Prominent Membership ID & Status Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-2xl p-6 shadow-md border border-blue-400/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider block">
              Library Membership Card
            </span>
            <h2 className="text-2xl font-black font-mono mt-1 text-white tracking-wide">
              {currentUser?.membershipId || 'LIB-MEMBER'}
            </h2>
            <p className="text-sm font-semibold text-blue-100 mt-0.5">{currentUser?.name}</p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center">
              <p className="text-blue-200 text-[11px] uppercase tracking-wide">Member Since</p>
              <p className="font-bold text-white mt-0.5">{formatDate(currentUser?.membershipDate)}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center">
              <p className="text-blue-200 text-[11px] uppercase tracking-wide">Valid Until</p>
              <p className={`font-bold mt-0.5 ${isExpired ? 'text-red-300' : 'text-emerald-300'}`}>
                {formatDate(currentUser?.membershipExpiryDate)}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-center">
              <p className="text-blue-200 text-[11px] uppercase tracking-wide">Status</p>
              <p className="font-bold text-white mt-0.5">
                {isExpired ? 'EXPIRED' : `${daysLeft}d Remaining`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expired Membership Alert */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-800 animate-in fade-in">
          <div className="flex items-center gap-3">
            <i className="fas fa-triangle-exclamation text-2xl text-red-600" />
            <div>
              <p className="font-bold text-sm">Membership Expired</p>
              <p className="text-xs text-red-700">
                Your library membership expired on {formatDate(currentUser?.membershipExpiryDate)}. Book reservations and borrowing privileges are temporarily suspended. Please contact library admin to renew.
              </p>
            </div>
          </div>
          <span className="text-xs bg-red-600 text-white font-bold px-3 py-1.5 rounded-xl whitespace-nowrap">
            Renewal: {formatCurrency(settings?.membershipRenewalFee || 500, settings?.currency)}
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: 'All Catalog', icon: 'fa-book-open' },
          { id: 'available', label: 'Books Available', icon: 'fa-circle-check' },
          { id: 'popular', label: 'Popular & Trending', icon: 'fa-fire' },
          { id: 'recommended', label: 'Recommendations', icon: 'fa-star' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search title, author, publisher, ISBN..."
              className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <select
          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {categories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
          value={publisherFilter}
          onChange={(e) => setPublisherFilter(e.target.value)}
        >
          <option value="All">All Publishers</option>
          {publishers.filter((p) => p !== 'All').map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="All">Publication Year</option>
          {publishYears.filter((y) => y !== 'All').map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Book Cards Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          <i className="fas fa-book-open text-5xl mb-3 block text-slate-300" />
          <p className="text-base font-medium">No matching books found.</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const booked = isBookedByMe(book.id);
            const isAvailable = book.available > 0;

            return (
              <div
                key={book.id}
                onClick={() => setDetailBook(book)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition relative overflow-hidden group cursor-pointer"
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

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
                  <div className="text-xs">
                    <span className={`inline-flex items-center gap-1 font-semibold ${isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                      <i className={`fas ${isAvailable ? 'fa-check-circle' : 'fa-times-circle'}`} />
                      {isAvailable ? `${book.available} Available` : 'Out of Stock'}
                    </span>
                  </div>

                  {booked ? (
                    <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1">
                      <i className="fas fa-clock" /> Reserved
                    </span>
                  ) : isExpired ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-400 border border-red-200 cursor-not-allowed"
                    >
                      <i className="fas fa-ban mr-1" /> Expired
                    </button>
                  ) : (
                    <button
                      disabled={!isAvailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        openReserveModal(book);
                      }}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
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

      {/* Book Detail Modal */}
      {detailBook && (
        <BookDetailModal
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onReserve={(b) => openReserveModal(b)}
        />
      )}

      {/* Reservation Date Picker Modal (Max 30 days) */}
      {reserveBook && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => e.target === e.currentTarget && closeReserveModal()}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <i className="fas fa-bookmark text-blue-600" />
              Select Pickup Date for Reservation
            </h3>

            <div className="flex gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-12 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                {reserveBook.coverImage ? (
                  <img src={reserveBook.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <i className="fas fa-book text-xl" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-800 truncate">{reserveBook.title}</p>
                <p className="text-xs text-slate-500">{reserveBook.author}</p>
                <span className="text-[11px] text-emerald-600 font-semibold">{reserveBook.available} copies available</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-3 flex items-center gap-2">
                <i className="fas fa-circle-exclamation flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Expected Pickup Date *
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  You can choose any pickup date between <strong>today</strong> and <strong>30 days ahead</strong> ({formatDate(maxDate)}).
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-1.5 text-blue-950">
                <div className="flex justify-between">
                  <span className="text-slate-600">Reservation Fee:</span>
                  <strong className="text-blue-900">{formatCurrency(settings?.reservationFee, settings?.currency)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hold Duration:</span>
                  <strong className="text-blue-900">{settings?.reservationHoldDays} days after pickup date</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeReserveModal}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmReservation}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md transition"
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
