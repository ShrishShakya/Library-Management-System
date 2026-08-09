import React, { useState, useCallback, useContext, createContext, useEffect } from 'react';

// ----- Helpers -----
const uid = () => Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const DB_KEY = 'lms_data';
const AUTH_KEY = 'lms_auth_user';

const defaultData = { books: [], members: [], borrows: [], bookings: [] };

const loadData = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      let members = parsed.members || [];

      // Guarantee admin user exists
      const hasAdmin = members.some(m => m.email && m.email.toLowerCase() === 'admin@library.com');
      if (!hasAdmin) {
        members = [
          { id: 'admin_1', name: 'Library Admin', email: 'admin@library.com', phone: '555-0000', password: 'admin123', role: 'admin', active: true, membershipDate: '2025-01-01' },
          ...members
        ];
      }

      // Guarantee all members have passwords and roles
      members = members.map(m => ({
        ...m,
        password: m.password || (m.email && m.email.toLowerCase() === 'admin@library.com' ? 'admin123' : 'user123'),
        role: m.role || (m.email && m.email.toLowerCase() === 'admin@library.com' ? 'admin' : 'user')
      }));

      const fullData = { ...defaultData, ...parsed, members };
      saveData(fullData);
      return fullData;
    }
  } catch (_) {}
  return { ...defaultData };
};

const saveData = (data) => localStorage.setItem(DB_KEY, JSON.stringify(data));

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
};

const saveAuth = (user) => {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_KEY);
};

// Seed sample data
const seedSampleData = () => {
  const data = loadData();
  if (data.books.length > 0 || data.members.length > 0) return;

  const sampleBooks = [
    { id: uid(), title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', category: 'Fiction', publishYear: 1925, publisher: 'Charles Scribner\'s Sons', quantity: 4, available: 4, description: 'A story of the mysteriously wealthy Jay Gatsby...', addedDate: today() },
    { id: uid(), title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', category: 'Fiction', publishYear: 1960, publisher: 'J.B. Lippincott & Co.', quantity: 3, available: 2, description: 'Racial injustice and the loss of innocence.', addedDate: today() },
    { id: uid(), title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4', category: 'Literature', publishYear: 1949, publisher: 'Secker & Warburg', quantity: 5, available: 5, description: 'Totalitarian society ruled by Big Brother.', addedDate: today() },
    { id: uid(), title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0-316-76948-0', category: 'Fiction', publishYear: 1951, publisher: 'Little, Brown and Company', quantity: 2, available: 1, description: 'Holden Caulfield and teenage rebellion.', addedDate: today() },
    { id: uid(), title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0-132-35088-4', category: 'Programming', publishYear: 2008, publisher: 'Prentice Hall', quantity: 4, available: 4, description: 'A handbook of agile software craftsmanship.', addedDate: today() },
    { id: uid(), title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '978-0-062-31609-7', category: 'History & Geography', publishYear: 2011, publisher: 'Harvill Secker', quantity: 3, available: 3, description: 'Explores the history of humanity from Homo sapiens.', addedDate: today() },
    { id: uid(), title: 'Atomic Habits', author: 'James Clear', isbn: '978-0-735-21129-2', category: 'Self-help', publishYear: 2018, publisher: 'Penguin Random House', quantity: 5, available: 5, description: 'An easy & proven way to build good habits.', addedDate: today() },
    { id: uid(), title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0-547-92822-7', category: 'Literature', publishYear: 1937, publisher: 'George Allen & Unwin', quantity: 4, available: 4, description: 'Bilbo Baggins embarks on an adventure.', addedDate: today() },
  ];

  const sampleMembers = [
    { id: 'admin_1', name: 'Library Admin', email: 'admin@library.com', phone: '555-0000', password: 'admin123', role: 'admin', active: true, membershipDate: '2025-01-01' },
    { id: 'user_1', name: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101', password: 'user123', role: 'user', active: true, membershipDate: today() },
    { id: 'user_2', name: 'Bob Smith', email: 'bob@example.com', phone: '555-0102', password: 'user123', role: 'user', active: true, membershipDate: today() },
    { id: 'user_3', name: 'Carol Davis', email: 'carol@example.com', phone: '555-0103', password: 'user123', role: 'user', active: true, membershipDate: today() },
    { id: 'user_4', name: 'David Wilson', email: 'david@example.com', phone: '555-0104', password: 'user123', role: 'user', active: false, membershipDate: today() },
  ];

  const sampleBorrows = [
    { id: uid(), bookId: sampleBooks[1].id, memberId: sampleMembers[1].id, borrowDate: daysFromNow(-12), dueDate: daysFromNow(-2), returnDate: null, status: 'borrowed' },
    { id: uid(), bookId: sampleBooks[3].id, memberId: sampleMembers[2].id, borrowDate: daysFromNow(-8), dueDate: daysFromNow(2), returnDate: null, status: 'borrowed' },
    { id: uid(), bookId: sampleBooks[0].id, memberId: sampleMembers[3].id, borrowDate: daysFromNow(-20), dueDate: daysFromNow(-10), returnDate: daysFromNow(-8), status: 'returned' },
  ];

  const sampleBookings = [
    { id: uid(), bookId: sampleBooks[4].id, memberId: sampleMembers[1].id, bookingDate: today(), status: 'pending' }
  ];

  const bookMap = {};
  sampleBooks.forEach(b => bookMap[b.id] = b);
  sampleBorrows.forEach(br => {
    if (br.status === 'borrowed' && bookMap[br.bookId]) {
      bookMap[br.bookId].available -= 1;
    }
  });

  const newData = { books: sampleBooks, members: sampleMembers, borrows: sampleBorrows, bookings: sampleBookings };
  saveData(newData);
};

// ----- Context & Provider -----
const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => loadData());
  const [currentUser, setCurrentUser] = useState(() => loadAuth());

  // Seed on first mount
  useEffect(() => {
    seedSampleData();
    setData(loadData());
  }, []);

  const refresh = useCallback(() => setData(loadData()), []);
  const update = useCallback((newData) => { saveData(newData); setData(newData); }, []);

  // ----- Auth Handlers -----
  const login = useCallback((email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    const membersList = data.members.length > 0 ? data.members : loadData().members;
    const found = membersList.find(m => m.email && m.email.toLowerCase() === trimmedEmail && (m.password === password || (!m.password && (password === 'admin123' || password === 'user123'))));
    if (!found) {
      return { success: false, error: 'Invalid email or password.' };
    }
    if (found.active === false) {
      return { success: false, error: 'Your account is currently inactive. Please contact the administrator.' };
    }
    const authUser = { id: found.id, name: found.name, email: found.email, role: found.role || (found.email.toLowerCase() === 'admin@library.com' ? 'admin' : 'user') };
    setCurrentUser(authUser);
    saveAuth(authUser);
    return { success: true, user: authUser };
  }, [data.members]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    saveAuth(null);
  }, []);

  // ----- CRUD operations -----
  const addBook = useCallback((book) => {
    const d = { ...data, books: [...data.books, { ...book, id: uid(), addedDate: today() }] };
    update(d);
  }, [data, update]);

  const editBook = useCallback((id, updates) => {
    const d = { ...data, books: data.books.map(b => b.id === id ? { ...b, ...updates } : b) };
    update(d);
  }, [data, update]);

  const deleteBook = useCallback((id) => {
    const d = {
      ...data,
      books: data.books.filter(b => b.id !== id),
      borrows: data.borrows.filter(br => br.bookId !== id),
      bookings: (data.bookings || []).filter(bk => bk.bookId !== id)
    };
    update(d);
  }, [data, update]);

  const addMember = useCallback((member) => {
    const d = { ...data, members: [...data.members, { ...member, id: uid(), membershipDate: today() }] };
    update(d);
  }, [data, update]);

  const editMember = useCallback((id, updates) => {
    const d = { ...data, members: data.members.map(m => m.id === id ? { ...m, ...updates } : m) };
    update(d);
  }, [data, update]);

  const deleteMember = useCallback((id) => {
    const d = {
      ...data,
      members: data.members.filter(m => m.id !== id),
      borrows: data.borrows.filter(br => br.memberId !== id),
      bookings: (data.bookings || []).filter(bk => bk.memberId !== id)
    };
    update(d);
  }, [data, update]);

  const addBorrow = useCallback((borrow) => {
    const book = data.books.find(bk => bk.id === borrow.bookId);
    if (!book || book.available <= 0) return;
    const b = { ...borrow, id: uid(), borrowDate: today(), returnDate: null, status: 'borrowed' };
    const d = {
      ...data,
      borrows: [...data.borrows, b],
      books: data.books.map(bk => bk.id === borrow.bookId ? { ...bk, available: bk.available - 1 } : bk),
    };
    update(d);
  }, [data, update]);

  const returnBorrow = useCallback((borrowId) => {
    const borrow = data.borrows.find(b => b.id === borrowId);
    if (!borrow || borrow.status === 'returned') return;
    const d = {
      ...data,
      borrows: data.borrows.map(b => b.id === borrowId ? { ...b, returnDate: today(), status: 'returned' } : b),
      books: data.books.map(bk => bk.id === borrow.bookId ? { ...bk, available: bk.available + 1 } : bk),
    };
    update(d);
  }, [data, update]);

  const deleteBorrow = useCallback((borrowId) => {
    const borrow = data.borrows.find(b => b.id === borrowId);
    const d = { ...data, borrows: data.borrows.filter(b => b.id !== borrowId) };
    if (borrow && borrow.status === 'borrowed') {
      d.books = data.books.map(bk => bk.id === borrow.bookId ? { ...bk, available: bk.available + 1 } : bk);
    }
    update(d);
  }, [data, update]);

  // ----- Booking / Reservation Handlers -----
  const addBooking = useCallback(({ bookId, memberId }) => {
    const book = data.books.find(bk => bk.id === bookId);
    if (!book || book.available <= 0) return { success: false, error: 'Book is not available for booking.' };
    const existing = (data.bookings || []).find(b => b.bookId === bookId && b.memberId === memberId && b.status === 'pending');
    if (existing) return { success: false, error: 'You already have a pending booking for this book.' };

    const newBooking = { id: uid(), bookId, memberId, bookingDate: today(), status: 'pending' };
    const d = {
      ...data,
      bookings: [...(data.bookings || []), newBooking]
    };
    update(d);
    return { success: true };
  }, [data, update]);

  const cancelBooking = useCallback((bookingId) => {
    const d = {
      ...data,
      bookings: (data.bookings || []).map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
    };
    update(d);
  }, [data, update]);

  const approveBooking = useCallback((bookingId) => {
    const booking = (data.bookings || []).find(b => b.id === bookingId);
    if (!booking || booking.status !== 'pending') return;

    const book = data.books.find(bk => bk.id === booking.bookId);
    if (!book || book.available <= 0) return;

    const dueDate = daysFromNow(14);
    const newBorrow = { id: uid(), bookId: booking.bookId, memberId: booking.memberId, borrowDate: today(), dueDate, returnDate: null, status: 'borrowed' };

    const d = {
      ...data,
      borrows: [...data.borrows, newBorrow],
      books: data.books.map(bk => bk.id === booking.bookId ? { ...bk, available: bk.available - 1 } : bk),
      bookings: (data.bookings || []).map(b => b.id === bookingId ? { ...b, status: 'approved' } : b)
    };
    update(d);
  }, [data, update]);

  const value = {
    data,
    currentUser,
    login,
    logout,
    refresh,
    addBook,
    editBook,
    deleteBook,
    addMember,
    editMember,
    deleteMember,
    addBorrow,
    returnBorrow,
    deleteBorrow,
    addBooking,
    cancelBooking,
    approveBooking,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);

// Helper utilities for components
export const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
export const isOverdue = (dueDate) => dueDate && dueDate < today();
