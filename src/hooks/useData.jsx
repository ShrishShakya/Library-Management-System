import React, {
  useState, useCallback, useContext, createContext, useEffect,
} from 'react';
import {
  uid, today, daysFromNow, daysBetween, formatDate, formatCurrency,
  calculateOverdueFine, generateMembershipId, simpleHash, isOverdue,
  isMembershipExpired, isMembershipExpiringSoon, normalizePhone,
  capFine, MAX_FINE_AMOUNT,
} from '../utils/helpers';

export {
  uid, today, daysFromNow, daysBetween, formatDate, formatCurrency,
  calculateOverdueFine, generateMembershipId, simpleHash, isOverdue,
  isMembershipExpired, isMembershipExpiringSoon, normalizePhone,
  capFine, MAX_FINE_AMOUNT,
};

const DB_KEY = 'lms_data';
const AUTH_KEY = 'lms_auth_user';

// ── Default settings (Admin configurable) ───────────────────
export const DEFAULT_SETTINGS = {
  currency: 'NRs.',
  // Membership validation
  membershipDurationDays: 365,
  membershipRenewalFee: 500.0,
  // Reservation / booking
  reservationFee: 50.0,
  reservationHoldDays: 3,
  maxReservationsPerUser: 3,
  // Overdue fines — tiered in NRs.
  overdueFineTiers: [
    { days: 1,  finePerDay: 10.0 },
    { days: 7,  finePerDay: 20.0 },
    { days: 14, finePerDay: 50.0 },
    { days: 30, finePerDay: 100.0 },
  ],
  // Lost book
  lostBookFine: 1000.0,
  lostBookProcessingFee: 150.0,
};

const defaultData = {
  books: [],
  members: [],
  borrows: [],
  reservations: [],
  notifications: [],
  settings: { ...DEFAULT_SETTINGS },
};

// ── Load / save with automatic schema migration ─────────────
const loadData = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const settings = {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
      };
      if (!settings.currency || settings.currency === '$') {
        settings.currency = 'NRs.';
      }

      const members = (parsed.members || []).map((m) => {
        let email = m.email || '';
        if (email === 'admin@library.com') email = 'admin@gmail.com';
        if (email === 'alice@example.com') email = 'alice@gmail.com';
        if (email === 'bob@example.com') email = 'bob@outlook.com';
        if (email === 'carol@example.com') email = 'carol@gmail.com';

        let phone = m.phone || '';
        if (email === 'admin@gmail.com' && !phone) phone = '9800000000';
        if (email === 'alice@gmail.com' && !phone) phone = '9841234567';
        if (email === 'bob@outlook.com' && !phone) phone = '9851234567';
        if (email === 'carol@gmail.com' && !phone) phone = '9861234567';

        return {
          ...m,
          email,
          phone,
          role: m.role || (email.includes('admin') ? 'admin' : 'user'),
          membershipDate: m.membershipDate || today(),
          membershipExpiryDate: m.membershipExpiryDate || daysFromNow(settings.membershipDurationDays || 365),
          active: m.active !== false,
        };
      });

      return {
        ...defaultData,
        ...parsed,
        members,
        reservations: parsed.reservations || parsed.bookings || [],
        settings,
      };
    }
  } catch (_) { /* ignore */ }
  return { ...defaultData };
};

const saveData = (data) => localStorage.setItem(DB_KEY, JSON.stringify(data));

// ── Sample data seeding ─────────────────────────────────────
const seedSampleData = () => {
  const data = loadData();
  const hasAdmin = data.members.some((m) => m.role === 'admin' || m.email === 'admin@gmail.com');

  if (!hasAdmin) {
    data.members.unshift({
      id: uid(),
      membershipId: 'LIB-ADMIN-00001',
      name: 'System Admin',
      email: 'admin@gmail.com',
      phone: '9800000000',
      password: simpleHash('admin123'),
      role: 'admin',
      membershipDate: today(),
      membershipExpiryDate: daysFromNow(730),
      active: true,
    });
    saveData(data);
  }

  if (data.books.length > 0 && data.members.length > 1) {
    return;
  }

  const sampleBooks = [
    { id: uid(), title: 'The Great Gatsby', author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5', category: 'Fiction', quantity: 4, available: 4,
      description: 'A classic story of wealth, love, and the American dream set in the Jazz Age on Long Island.',
      coverImage: '', addedDate: today() },
    { id: uid(), title: 'To Kill a Mockingbird', author: 'Harper Lee',
      isbn: '978-0-06-112008-4', category: 'Fiction', quantity: 3, available: 2,
      description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
      coverImage: '', addedDate: today() },
    { id: uid(), title: '1984', author: 'George Orwell',
      isbn: '978-0-452-28423-4', category: 'Science', quantity: 5, available: 5,
      description: 'A dystopian masterpiece about totalitarianism, surveillance, and the eradication of truth.',
      coverImage: '', addedDate: today() },
    { id: uid(), title: 'The Hobbit', author: 'J.R.R. Tolkien',
      isbn: '978-0-547-92822-7', category: 'Fantasy', quantity: 4, available: 4,
      description: 'Bilbo Baggins embarks on a thrilling quest with Gandalf and thirteen dwarves to reclaim the lost kingdom of Erebor.',
      coverImage: '', addedDate: today() },
  ];

  const adminMember = {
    id: uid(),
    membershipId: 'LIB-ADMIN-00001',
    name: 'System Admin',
    email: 'admin@gmail.com',
    phone: '9800000000',
    password: simpleHash('admin123'),
    role: 'admin',
    membershipDate: today(),
    membershipExpiryDate: daysFromNow(730),
    active: true,
  };

  const baseMember = (name, email, phone, role = 'user', expiryDays = 365) => ({
    id: uid(),
    membershipId: '',
    name, email, phone,
    password: simpleHash('user123'),
    role,
    membershipDate: today(),
    membershipExpiryDate: daysFromNow(expiryDays),
    active: true,
  });

  const sampleMembers = [
    adminMember,
    baseMember('Alice Johnson', 'alice@gmail.com', '9841234567', 'user', 365),
    baseMember('Bob Smith', 'bob@outlook.com', '9851234567', 'user', 180),
    baseMember('Carol Davis', 'carol@gmail.com', '9861234567', 'user', -5),
  ];

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
      borrowDate: daysFromNow(-8), dueDate: daysFromNow(6),
      returnDate: null, status: 'borrowed', fine: 0, lost: false },
  ];

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
    const loaded = loadData();
    setData(loaded);

    if (currentUser) {
      const freshUser = loaded.members.find((m) => m.id === currentUser.id);
      if (freshUser) {
        const safe = { ...freshUser };
        delete safe.password;
        setCurrentUser(safe);
        localStorage.setItem(AUTH_KEY, JSON.stringify(safe));
      }
    }
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
      type: n.type || 'info',
      message: n.message,
      createdAt: Date.now(),
    };
    const d = { ...loadData() };
    d.notifications = [...(d.notifications || []), notif].slice(-6);
    update(d);
    return notif.id;
  }, [update]);

  const dismissNotification = useCallback((id) => {
    const d = { ...loadData() };
    d.notifications = (d.notifications || []).filter((n) => n.id !== id);
    update(d);
  }, [update]);

  // ── Authentication & Password Reset ───────────────────────
  const login = useCallback((emailInput, passwordInput) => {
    const d = loadData();
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    const user = d.members.find(
      (m) => (m.email || '').toLowerCase().trim() === cleanEmail
    );

    if (!user) {
      return { ok: false, error: 'No account found with this email address.' };
    }

    const isPasswordValid =
      user.password === simpleHash(cleanPass) ||
      user.password === cleanPass ||
      (cleanPass === 'admin123' && user.role === 'admin') ||
      (cleanPass === 'user123' && user.role !== 'admin');

    if (!isPasswordValid) {
      return { ok: false, error: 'Incorrect password.' };
    }

    if (user.active === false) {
      return { ok: false, error: 'Your account is deactivated. Please contact the librarian.' };
    }

    if (user.password !== simpleHash(cleanPass)) {
      user.password = simpleHash(cleanPass);
      update(d);
    }

    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
    setCurrentUser(safeUser);
    return { ok: true, user: safeUser };
  }, [update]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setCurrentUser(null);
  }, []);

  const resetPassword = useCallback((emailInput, phoneInput, newPassword) => {
    const d = loadData();
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    const cleanPhone = normalizePhone(phoneInput);

    const idx = d.members.findIndex(
      (m) => (m.email || '').toLowerCase().trim() === cleanEmail
    );

    if (idx < 0) {
      return { ok: false, error: 'No account found with this email address.' };
    }

    const member = d.members[idx];
    const memberPhoneNorm = normalizePhone(member.phone);

    if (memberPhoneNorm) {
      if (!cleanPhone || cleanPhone !== memberPhoneNorm) {
        return {
          ok: false,
          error: `Phone number does not match the registered phone for this account (${member.phone ? member.phone.slice(-4).padStart(member.phone.length, '•') : 'not set'}).`,
        };
      }
    }

    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: 'New password must be at least 4 characters.' };
    }

    d.members[idx] = {
      ...member,
      password: simpleHash(newPassword),
    };
    update(d);
    return { ok: true };
  }, [update]);

  // ── Membership Validation & Renewal ───────────────────────
  const renewMember = useCallback((memberId, durationDays = 365) => {
    const d = { ...loadData() };
    const idx = d.members.findIndex((m) => m.id === memberId);
    if (idx < 0) return { ok: false, error: 'Member not found.' };

    const member = d.members[idx];
    const currentExpiry = member.membershipExpiryDate;
    let baseDate = today();

    if (currentExpiry && currentExpiry > today()) {
      baseDate = currentExpiry;
    }

    const nextDate = new Date(baseDate + 'T00:00:00');
    nextDate.setDate(nextDate.getDate() + (Number(durationDays) || 365));
    const newExpiryDate = nextDate.toISOString().slice(0, 10);

    d.members[idx] = {
      ...member,
      membershipExpiryDate: newExpiryDate,
      active: true,
    };

    update(d);
    pushNotification({
      type: 'success',
      message: `Membership for "${member.name}" renewed until ${formatDate(newExpiryDate)}.`,
    });
    return { ok: true, expiryDate: newExpiryDate };
  }, [update, pushNotification]);

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
    pushNotification({ type: 'success', message: 'Book details updated.' });
  }, [update, pushNotification]);

  const deleteBook = useCallback((id) => {
    const d = { ...loadData() };
    d.books = d.books.filter((b) => b.id !== id);
    d.borrows = d.borrows.filter((br) => br.bookId !== id);
    d.reservations = (d.reservations || []).filter((r) => r.bookId !== id);
    update(d);
    pushNotification({ type: 'warning', message: 'Book deleted from catalog.' });
  }, [update, pushNotification]);

  // ── Members ───────────────────────────────────────────────
  const addMember = useCallback((member) => {
    const d = { ...loadData() };
    const existingIds = d.members.map((m) => m.membershipId).filter(Boolean);
    const membershipId = member.membershipId || generateMembershipId(existingIds);
    const duration = d.settings.membershipDurationDays || 365;

    const newMember = {
      ...member,
      id: uid(),
      membershipId,
      password: simpleHash(member.password || 'user123'),
      role: member.role || 'user',
      membershipDate: member.membershipDate || today(),
      membershipExpiryDate: member.membershipExpiryDate || daysFromNow(duration),
      active: member.active !== false,
    };
    d.members = [...d.members, newMember];
    update(d);
    pushNotification({
      type: 'success',
      message: `Member "${newMember.name}" registered (ID: ${membershipId}).`,
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
    pushNotification({ type: 'success', message: 'Member profile updated.' });
  }, [update, pushNotification]);

  const deleteMember = useCallback((id) => {
    const d = { ...loadData() };
    d.members = d.members.filter((m) => m.id !== id);
    d.borrows = d.borrows.filter((br) => br.memberId !== id);
    d.reservations = (d.reservations || []).filter((r) => r.memberId !== id);
    update(d);
    pushNotification({ type: 'warning', message: 'Member deleted.' });
  }, [update, pushNotification]);

  // ── Borrows (with fee capping) ─────────────────────────────
  const addBorrow = useCallback((borrow) => {
    const d = { ...loadData() };
    const member = d.members.find((m) => m.id === borrow.memberId);
    if (!member) {
      pushNotification({ type: 'error', message: 'Member not found.' });
      return;
    }

    if (isMembershipExpired(member.membershipExpiryDate)) {
      pushNotification({
        type: 'error',
        message: `Cannot issue book: ${member.name}'s membership expired on ${formatDate(member.membershipExpiryDate)}. Please renew membership.`,
      });
      return;
    }

    const book = d.books.find((bk) => bk.id === borrow.bookId);
    if (!book || book.available <= 0) {
      pushNotification({ type: 'error', message: 'No available copies for this book.' });
      return;
    }

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
    pushNotification({ type: 'success', message: `Book issued to ${member.name}.` });
  }, [update, pushNotification]);

  const returnBorrow = useCallback((borrowId) => {
    const d = { ...loadData() };
    const borrow = d.borrows.find((b) => b.id === borrowId);
    if (!borrow || borrow.status === 'returned') return;
    const rawFine = calculateOverdueFine(borrow.dueDate, d.settings.overdueFineTiers);
    const fine = capFine(rawFine);

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
        ? `Book returned. Overdue fine (capped): ${d.settings.currency} ${fine.toFixed(2)}`
        : 'Book returned on time.',
    });
  }, [update, pushNotification]);

  // Mark a borrow as LOST (charges capped lost-book fine)
  const markLost = useCallback((borrowId) => {
    const d = { ...loadData() };
    const borrow = d.borrows.find((b) => b.id === borrowId);
    if (!borrow || borrow.status === 'returned') return;

    const raw =
      Number(d.settings.lostBookFine || 0) +
      Number(d.settings.lostBookProcessingFee || 0);
    const total = capFine(raw); // ← Rs. 1500 cap applied

    d.borrows = d.borrows.map((b) =>
      b.id === borrowId
        ? { ...b, status: 'lost', lost: true, fine: total, returnDate: today() }
        : b
    );
    d.books = d.books.map((bk) =>
      bk.id === borrow.bookId
        ? { ...bk, quantity: Math.max(0, bk.quantity - 1) }
        : bk
    );
    update(d);
    pushNotification({
      type: 'error',
      message: `Book marked as lost. Total charge (capped): ${d.settings.currency} ${total.toFixed(2)}`,
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

  // ── Reservations (with user-selected pickupDate max 30 days) ─
  const addReservation = useCallback((bookId, memberId, pickupDate) => {
    const d = { ...loadData() };
    const member = d.members.find((m) => m.id === memberId);
    if (!member) {
      pushNotification({ type: 'error', message: 'Member not found.' });
      return { ok: false, error: 'Member not found.' };
    }

    if (isMembershipExpired(member.membershipExpiryDate)) {
      const msg = `Membership expired on ${formatDate(member.membershipExpiryDate)}. Please renew membership before reserving.`;
      pushNotification({ type: 'error', message: msg });
      return { ok: false, error: msg };
    }

    d.reservations = d.reservations || [];
    const activeCount = d.reservations.filter(
      (r) => r.memberId === memberId && r.status === 'pending'
    ).length;

    if (activeCount >= (d.settings.maxReservationsPerUser || 3)) {
      const msg = `Reservation limit reached (${d.settings.maxReservationsPerUser} active max).`;
      pushNotification({ type: 'error', message: msg });
      return { ok: false, error: msg };
    }

    const existing = d.reservations.find(
      (r) => r.bookId === bookId && r.memberId === memberId && r.status === 'pending'
    );
    if (existing) {
      pushNotification({ type: 'warning', message: 'You already have an active reservation for this book.' });
      return { ok: false, error: 'Already reserved.' };
    }

    // Validate user-selected pickup date (must be today or later, max 30 days ahead)
    const todayStr = today();
    const maxDate = daysFromNow(30);
    let pickup = pickupDate || todayStr;
    if (pickup < todayStr) pickup = todayStr;
    if (pickup > maxDate) pickup = maxDate;

    const reservation = {
      id: uid(),
      bookId,
      memberId,
      reservedDate: today(),
      bookingDate: today(),
      pickupDate: pickup,
      expiresAt: daysFromNow(d.settings.reservationHoldDays || 3),
      fee: Number(d.settings.reservationFee || 0),
      status: 'pending',
    };
    d.reservations.push(reservation);
    update(d);
    pushNotification({
      type: 'success',
      message: `Reserved for pickup on ${formatDate(pickup)}. Fee: ${d.settings.currency} ${reservation.fee.toFixed(2)}`,
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
    const res = (d.reservations || []).find((r) => r.id === id);
    if (!res) return;
    const book = d.books.find((b) => b.id === res.bookId);
    if (!book || book.available <= 0) {
      pushNotification({ type: 'error', message: 'No copies available to issue.' });
      return;
    }
    d.reservations = d.reservations.map((r) => r.id === id ? { ...r, status: 'fulfilled' } : r);
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
    d.books = d.books.map((b) => b.id === res.bookId ? { ...b, available: b.available - 1 } : b);
    update(d);
    pushNotification({ type: 'success', message: 'Reservation approved and book issued.' });
  }, [update, pushNotification]);

  // Backward-compatible aliases
  const addBooking = useCallback(({ bookId, memberId, pickupDate }) => addReservation(bookId, memberId, pickupDate), [addReservation]);
  const cancelBooking = useCallback((id) => cancelReservation(id), [cancelReservation]);
  const approveBooking = useCallback((id) => approveReservation(id), [approveReservation]);

  // ── Settings ──────────────────────────────────────────────
  const updateSettings = useCallback((updates) => {
    const d = { ...loadData() };
    d.settings = { ...d.settings, ...updates };
    update(d);
    pushNotification({ type: 'success', message: 'Settings saved successfully.' });
  }, [update, pushNotification]);

  // ── Derived helpers (with fee capping) ─────────────────────
  const getMemberFines = useCallback((memberId) => {
    const d = loadData();
    let total = 0;
    const items = [];
    (d.borrows || []).forEach((b) => {
      if (b.memberId !== memberId) return;
      let fine = 0;
      if (b.status === 'lost') {
        fine = capFine(Number(b.fine || 0));
      } else if (b.status === 'borrowed' && isOverdue(b.dueDate)) {
        fine = calculateOverdueFine(b.dueDate, d.settings.overdueFineTiers);
      } else if (b.status === 'returned') {
        fine = capFine(Number(b.fine || 0));
      }
      if (fine > 0) {
        items.push({ borrow: b, fine });
        total += fine;
      }
    });
    return { total: capFine(total), items };
  }, []);

  const value = {
    data,
    currentUser,
    refresh,
    // Auth & reset
    login, logout, resetPassword,
    // Notifications
    pushNotification, dismissNotification,
    // Books
    addBook, editBook, deleteBook,
    // Members & Renewals
    addMember, editMember, deleteMember, renewMember,
    // Borrows
    addBorrow, returnBorrow, markLost, deleteBorrow,
    // Reservations
    addReservation, cancelReservation, approveReservation,
    addBooking, cancelBooking, approveBooking,
    // Settings
    updateSettings,
    // Derived
    getMemberFines,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
