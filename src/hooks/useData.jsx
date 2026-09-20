import React, {
  useState, useCallback, useContext, createContext, useEffect,
} from 'react';
import {
  uid, today, daysFromNow, daysBetween, formatDate, formatCurrency,
  calculateOverdueFine, generateMembershipId, simpleHash, isOverdue,
} from '../utils/helpers';

export {
  uid, today, daysFromNow, daysBetween, formatDate, formatCurrency,
  calculateOverdueFine, generateMembershipId, simpleHash, isOverdue,
};

const DB_KEY = 'lms_data';
const AUTH_KEY = 'lms_auth_user';

// ── Default settings (admin can override) ───────────────────
export const DEFAULT_SETTINGS = {
  currency: '$',
  // Reservation / booking
  reservationFee: 2.0,
  reservationHoldDays: 3,
  maxReservationsPerUser: 3,
  // Overdue fines — tiered: the more overdue, the higher the per-day rate
  overdueFineTiers: [
    { days: 1,  finePerDay: 0.25 },
    { days: 7,  finePerDay: 0.5  },
    { days: 14, finePerDay: 1.0  },
    { days: 30, finePerDay: 2.0  },
  ],
  // Lost book
  lostBookFine: 25.0,
  lostBookProcessingFee: 5.0,
};

const defaultData = {
  books: [],
  members: [],
  borrows: [],
  reservations: [],
  notifications: [],
  settings: { ...DEFAULT_SETTINGS },
};

// ── Load / save ─────────────────────────────────────────────
const loadData = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultData,
        ...parsed,
        reservations: parsed.reservations || parsed.bookings || [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      };
    }
  } catch (_) { /* ignore */ }
  return { ...defaultData };
};

const saveData = (data) => localStorage.setItem(DB_KEY, JSON.stringify(data));

// ── Sample data seeding ─────────────────────────────────────
const seedSampleData = () => {
  const data = loadData();
  if (data.books.length > 0 || data.members.length > 0) {
    // ensure admin exists
    if (!data.members.find((m) => m.email === 'admin@library.com')) {
      data.members.push({
        id: uid(),
        membershipId: 'LIB-ADMIN-00001',
        name: 'Admin',
        email: 'admin@library.com',
        phone: '',
        password: simpleHash('admin123'),
        role: 'admin',
        membershipDate: today(),
        active: true,
      });
      saveData(data);
    }
    return;
  }

  const adminMember = {
    id: uid(),
    membershipId: 'LIB-ADMIN-00001',
    name: 'Admin',
    email: 'admin@library.com',
    phone: '',
    password: simpleHash('admin123'),
    role: 'admin',
    membershipDate: today(),
    active: true,
  };

  const sampleBooks = [
    { id: uid(), title: 'The Great Gatsby', author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5', category: 'Fiction', quantity: 4, available: 4,
      description: 'A story of the mysteriously wealthy Jay Gatsby...',
      coverImage: '', addedDate: today() },
    { id: uid(), title: 'To Kill a Mockingbird', author: 'Harper Lee',
      isbn: '978-0-06-112008-4', category: 'Fiction', quantity: 3, available: 2,
      description: 'Racial injustice and the loss of innocence.',
      coverImage: '', addedDate: today() },
    { id: uid(), title: '1984', author: 'George Orwell',
      isbn: '978-0-452-28423-4', category: 'Science', quantity: 5, available: 5,
      description: 'Totalitarian society ruled by Big Brother.',
      coverImage: '', addedDate: today() },
    { id: uid(), title: 'The Hobbit', author: 'J.R.R. Tolkien',
      isbn: '978-0-547-92822-7', category: 'Fantasy', quantity: 4, available: 4,
      description: 'Bilbo Baggins embarks on an adventure.',
      coverImage: '', addedDate: today() },
  ];

  const baseMember = (name, email, phone) => ({
    id: uid(),
    membershipId: '', // filled below
    name, email, phone,
    password: simpleHash('user123'),
    role: 'user',
    membershipDate: today(),
    active: true,
  });

  const sampleMembers = [
    adminMember,
    baseMember('Alice Johnson', 'alice@example.com', '555-0101'),
    baseMember('Bob Smith', 'bob@example.com', '555-0102'),
    baseMember('Carol Davis', 'carol@example.com', '555-0103'),
  ];

  // Generate membership IDs
  let existingIds = sampleMembers.map((m) => m.membershipId).filter(Boolean);
  sampleMembers.forEach((m) => {
    if (!m.membershipId) {
      m.membershipId = generateMembershipId(existingIds);
      existingIds.push(m.membershipId);
    }
  });

  const sampleBorrows = [
    { id: uid(), bookId: sampleBooks[1].id, memberId: sampleMembers[1].id,
      borrowDate: daysFromNow(-20), dueDate: daysFromNow(-6),
      returnDate: null, status: 'borrowed', fine: 0, lost: false },
    { id: uid(), bookId: sampleBooks[3].id, memberId: sampleMembers[2].id,
      borrowDate: daysFromNow(-8), dueDate: daysFromNow(2),
      returnDate: null, status: 'borrowed', fine: 0, lost: false },
  ];

  // Update availability
  const bookMap = {};
  sampleBooks.forEach((b) => (bookMap[b.id] = b));
  sampleBorrows.forEach((br) => {
    if (br.status === 'borrowed' && bookMap[br.bookId]) {
      bookMap[br.bookId].available -= 1;
    }
  });

  const newData = {
    books: sampleBooks,
    members: sampleMembers,
    borrows: sampleBorrows,
    reservations: [],
    notifications: [],
    settings: { ...DEFAULT_SETTINGS },
  };
  saveData(newData);
};

// ── Context ─────────────────────────────────────────────────
const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => loadData());
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => {
    seedSampleData();
    setData(loadData());
  }, []);

  const refresh = useCallback(() => setData(loadData()), []);
  const update = useCallback((newData) => {
    saveData(newData);
    setData(newData);
  }, []);

  // ── Notifications ─────────────────────────────────────────
  const pushNotification = useCallback((n) => {
    const notif = {
      id: uid(),
      type: n.type || 'info', // success | error | warning | info
      message: n.message,
      createdAt: Date.now(),
    };
    const d = { ...loadData() };
    d.notifications = [...(d.notifications || []), notif].slice(-5);
    update(d);
    return notif.id;
  }, [update]);

  const dismissNotification = useCallback((id) => {
    const d = { ...loadData() };
    d.notifications = (d.notifications || []).filter((n) => n.id !== id);
    update(d);
  }, [update]);

  // ── Auth ──────────────────────────────────────────────────
  const login = useCallback((email, password) => {
    const d = loadData();
    const user = d.members.find(
      (m) => m.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (!user) return { ok: false, error: 'No account found with that email.' };
    if (user.password !== simpleHash(password)) {
      return { ok: false, error: 'Incorrect password.' };
    }
    if (user.active === false) {
      return { ok: false, error: 'Account is deactivated.' };
    }
    const safe = { ...user };
    delete safe.password;
    localStorage.setItem(AUTH_KEY, JSON.stringify(safe));
    setCurrentUser(safe);
    return { ok: true, user: safe };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
  }, []);

  // Password reset: verifies email+phone, sets a new password
  const resetPassword = useCallback((email, phone, newPassword) => {
    const d = loadData();
    const idx = d.members.findIndex(
      (m) => m.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (idx < 0) return { ok: false, error: 'No account with that email.' };
    if ((d.members[idx].phone || '').trim() !== (phone || '').trim()) {
      return { ok: false, error: 'Phone number does not match our records.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters.' };
    }
    d.members[idx] = { ...d.members[idx], password: simpleHash(newPassword) };
    update(d);
    return { ok: true };
  }, [update]);

  // ── Books ─────────────────────────────────────────────────
  const addBook = useCallback((book) => {
    const d = { ...loadData() };
    d.books = [...d.books, { ...book, id: uid(), addedDate: today() }];
    update(d);
    pushNotification({ type: 'success', message: `Book "${book.title}" added.` });
  }, [update, pushNotification]);

  const editBook = useCallback((id, updates) => {
    const d = { ...loadData() };
    d.books = d.books.map((b) => (b.id === id ? { ...b, ...updates } : b));
    update(d);
    pushNotification({ type: 'success', message: 'Book updated.' });
  }, [update, pushNotification]);

  const deleteBook = useCallback((id) => {
    const d = { ...loadData() };
    d.books = d.books.filter((b) => b.id !== id);
    d.borrows = d.borrows.filter((br) => br.bookId !== id);
    d.reservations = (d.reservations || []).filter((r) => r.bookId !== id);
    update(d);
    pushNotification({ type: 'warning', message: 'Book deleted.' });
  }, [update, pushNotification]);

  // ── Members ───────────────────────────────────────────────
  const addMember = useCallback((member) => {
    const d = { ...loadData() };
    const existingIds = d.members.map((m) => m.membershipId).filter(Boolean);
    const membershipId = member.membershipId || generateMembershipId(existingIds);
    const newMember = {
      ...member,
      id: uid(),
      membershipId,
      password: simpleHash(member.password || 'user123'),
      role: member.role || 'user',
      membershipDate: today(),
      active: member.active !== false,
    };
    d.members = [...d.members, newMember];
    update(d);
    pushNotification({
      type: 'success',
      message: `Member added — ID: ${membershipId}`,
    });
    return newMember;
  }, [update, pushNotification]);

  const editMember = useCallback((id, updates) => {
    const d = { ...loadData() };
    d.members = d.members.map((m) => {
      if (m.id !== id) return m;
      const next = { ...m, ...updates };
      if (updates.password) next.password = simpleHash(updates.password);
      return next;
    });
    update(d);
    pushNotification({ type: 'success', message: 'Member updated.' });
  }, [update, pushNotification]);

  const deleteMember = useCallback((id) => {
    const d = { ...loadData() };
    d.members = d.members.filter((m) => m.id !== id);
    d.borrows = d.borrows.filter((br) => br.memberId !== id);
    d.reservations = (d.reservations || []).filter((r) => r.memberId !== id);
    update(d);
    pushNotification({ type: 'warning', message: 'Member deleted.' });
  }, [update, pushNotification]);

  // ── Borrows ───────────────────────────────────────────────
  const addBorrow = useCallback((borrow) => {
    const d = { ...loadData() };
    const book = d.books.find((bk) => bk.id === borrow.bookId);
    if (!book || book.available <= 0) {
      pushNotification({ type: 'error', message: 'No copies available.' });
      return;
    }
    // If member has an active reservation for this book, fulfil it
    const reservation = (d.reservations || []).find(
      (r) => r.bookId === borrow.bookId &&
             r.memberId === borrow.memberId &&
             r.status === 'pending'
    );
    if (reservation) {
      d.reservations = d.reservations.map((r) =>
        r.id === reservation.id ? { ...r, status: 'fulfilled' } : r
      );
    }
    d.borrows = [...d.borrows, {
      ...borrow,
      id: uid(),
      borrowDate: today(),
      returnDate: null,
      status: 'borrowed',
      fine: 0,
      lost: false,
    }];
    d.books = d.books.map((bk) =>
      bk.id === borrow.bookId ? { ...bk, available: bk.available - 1 } : bk
    );
    update(d);
    pushNotification({ type: 'success', message: `Book issued to member.` });
  }, [update, pushNotification]);

  // Return a book & compute fine
  const returnBorrow = useCallback((borrowId) => {
    const d = { ...loadData() };
    const borrow = d.borrows.find((b) => b.id === borrowId);
    if (!borrow || borrow.status === 'returned') return;
    const fine = calculateOverdueFine(borrow.dueDate, d.settings.overdueFineTiers);
    d.borrows = d.borrows.map((b) =>
      b.id === borrowId
        ? { ...b, returnDate: today(), status: 'returned', fine }
        : b
    );
    d.books = d.books.map((bk) =>
      bk.id === borrow.bookId ? { ...bk, available: bk.available + 1 } : bk
    );
    update(d);
    pushNotification({
      type: fine > 0 ? 'warning' : 'success',
      message: fine > 0
        ? `Book returned. Overdue fine: ${d.settings.currency}${fine.toFixed(2)}`
        : 'Book returned on time.',
    });
  }, [update, pushNotification]);

  // Mark a borrow as LOST (charges lost-book fine)
  const markLost = useCallback((borrowId) => {
    const d = { ...loadData() };
    const borrow = d.borrows.find((b) => b.id === borrowId);
    if (!borrow || borrow.status === 'returned') return;
    const total =
      Number(d.settings.lostBookFine || 0) +
      Number(d.settings.lostBookProcessingFee || 0);
    d.borrows = d.borrows.map((b) =>
      b.id === borrowId
        ? { ...b, status: 'lost', lost: true, fine: total, returnDate: today() }
        : b
    );
    // Lost copy is removed from inventory permanently
    d.books = d.books.map((bk) =>
      bk.id === borrow.bookId
        ? { ...bk, quantity: Math.max(0, bk.quantity - 1) }
        : bk
    );
    update(d);
    pushNotification({
      type: 'error',
      message: `Book marked as lost. Charge: ${d.settings.currency}${total.toFixed(2)}`,
    });
  }, [update, pushNotification]);

  const deleteBorrow = useCallback((borrowId) => {
    const d = { ...loadData() };
    const borrow = d.borrows.find((b) => b.id === borrowId);
    d.borrows = d.borrows.filter((b) => b.id !== borrowId);
    if (borrow && borrow.status === 'borrowed') {
      d.books = d.books.map((bk) =>
        bk.id === borrow.bookId ? { ...bk, available: bk.available + 1 } : bk
      );
    }
    update(d);
    pushNotification({ type: 'warning', message: 'Borrow record deleted.' });
  }, [update, pushNotification]);

  // ── Reservations / Bookings ───────────────────────────────
  const addReservation = useCallback((bookId, memberId) => {
    const d = { ...loadData() };
    d.reservations = d.reservations || [];

    // Check user limit
    const activeCount = d.reservations.filter(
      (r) => r.memberId === memberId && r.status === 'pending'
    ).length;
    if (activeCount >= d.settings.maxReservationsPerUser) {
      pushNotification({
        type: 'error',
        message: `Reservation limit reached (${d.settings.maxReservationsPerUser}).`,
      });
      return { ok: false, success: false, error: `Reservation limit reached (${d.settings.maxReservationsPerUser}).` };
    }

    // Check if already reserved
    const existing = d.reservations.find(
      (r) => r.bookId === bookId && r.memberId === memberId && r.status === 'pending'
    );
    if (existing) {
      pushNotification({ type: 'warning', message: 'Already reserved.' });
      return { ok: false, success: false, error: 'Already reserved.' };
    }

    const reservation = {
      id: uid(),
      bookId,
      memberId,
      reservedDate: today(),
      bookingDate: today(), // alias for compatibility
      expiresAt: daysFromNow(d.settings.reservationHoldDays),
      fee: Number(d.settings.reservationFee || 0),
      status: 'pending',
    };
    d.reservations.push(reservation);
    update(d);
    pushNotification({
      type: 'success',
      message: `Reserved. Fee: ${d.settings.currency}${reservation.fee.toFixed(2)}`,
    });
    return { ok: true, success: true, reservation };
  }, [update, pushNotification]);

  const cancelReservation = useCallback((id) => {
    const d = { ...loadData() };
    d.reservations = (d.reservations || []).map((r) =>
      r.id === id ? { ...r, status: 'cancelled' } : r
    );
    update(d);
    pushNotification({ type: 'info', message: 'Reservation cancelled.' });
  }, [update, pushNotification]);

  const approveReservation = useCallback((id) => {
    const d = { ...loadData() };
    const res = (d.reservations || []).find(r => r.id === id);
    if (!res) return;
    const book = d.books.find(b => b.id === res.bookId);
    if (!book || book.available <= 0) {
      pushNotification({ type: 'error', message: 'No copies available to issue.' });
      return;
    }
    d.reservations = d.reservations.map(r => r.id === id ? { ...r, status: 'approved' } : r);
    // Also issue borrow
    const dueDate = daysFromNow(14);
    d.borrows = [...d.borrows, {
      id: uid(),
      bookId: res.bookId,
      memberId: res.memberId,
      borrowDate: today(),
      dueDate,
      returnDate: null,
      status: 'borrowed',
      fine: 0,
      lost: false,
    }];
    d.books = d.books.map(b => b.id === res.bookId ? { ...b, available: b.available - 1 } : b);
    update(d);
    pushNotification({ type: 'success', message: 'Reservation approved & book issued.' });
  }, [update, pushNotification]);

  // Backward-compatible booking aliases
  const addBooking = useCallback(({ bookId, memberId }) => addReservation(bookId, memberId), [addReservation]);
  const cancelBooking = useCallback((id) => cancelReservation(id), [cancelReservation]);
  const approveBooking = useCallback((id) => approveReservation(id), [approveReservation]);

  // ── Settings ──────────────────────────────────────────────
  const updateSettings = useCallback((updates) => {
    const d = { ...loadData() };
    d.settings = { ...d.settings, ...updates };
    update(d);
    pushNotification({ type: 'success', message: 'Settings saved.' });
  }, [update, pushNotification]);

  // ── Derived helpers ───────────────────────────────────────
  const getMemberFines = useCallback((memberId) => {
    const d = loadData();
    let total = 0;
    const items = [];
    d.borrows.forEach((b) => {
      if (b.memberId !== memberId) return;
      let fine = 0;
      if (b.status === 'lost') {
        fine = Number(b.fine || 0);
      } else if (b.status === 'borrowed' && isOverdue(b.dueDate)) {
        fine = calculateOverdueFine(b.dueDate, d.settings.overdueFineTiers);
      } else if (b.status === 'returned') {
        fine = Number(b.fine || 0);
      }
      if (fine > 0) {
        items.push({ borrow: b, fine });
        total += fine;
      }
    });
    return { total, items };
  }, []);

  const value = {
    data,
    currentUser,
    refresh,
    // auth
    login, logout, resetPassword,
    // notifications
    pushNotification, dismissNotification,
    // books
    addBook, editBook, deleteBook,
    // members
    addMember, editMember, deleteMember,
    // borrows
    addBorrow, returnBorrow, markLost, deleteBorrow,
    // reservations & bookings
    addReservation, cancelReservation, approveReservation,
    addBooking, cancelBooking, approveBooking,
    // settings
    updateSettings,
    // derived
    getMemberFines,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
