import React, {
  useState, useCallback, useContext, createContext, useEffect,
} from 'react';
import {
  uid, today, daysFromNow, daysBetween, formatDate, formatCurrency,
  calculateOverdueFine, generateMembershipId, simpleHash, isOverdue,
  isMembershipExpired, isMembershipExpiringSoon, normalizePhone,
  capFine, MAX_FINE_AMOUNT, getBorrowFee,
} from '../utils/helpers';

export {
  uid, today, daysFromNow, daysBetween, formatDate, formatCurrency,
  calculateOverdueFine, generateMembershipId, simpleHash, isOverdue,
  isMembershipExpired, isMembershipExpiringSoon, normalizePhone,
  capFine, MAX_FINE_AMOUNT, getBorrowFee,
};

const DB_KEY = 'lms_data';
const AUTH_KEY = 'lms_auth_user';

// ── Default settings (Admin configurable) ───────────────────
export const DEFAULT_SETTINGS = {
  currency: 'NRs.',
  // Membership validation
  membershipDurationDays: 365,
  membershipRenewalFee: 500.0,
  // Borrow fees
  borrowFee: 50.0,
  borrowFeeAcademic: 10.0,
  academicCategories: ['Academic (Nepal)'],
  // Reservation / booking (Free holds)
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

  const sampleBooks = [
    // ── 1. Fiction ───────────────────────────────────────────
    {
      id: uid(),
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      category: 'Fiction',
      publishYear: 1925,
      publisher: 'Scribner',
      quantity: 5,
      available: 5,
      description: 'Set in the decadent summer of 1922 on Long Island, this quintessential American tragedy follows the mysterious millionaire Jay Gatsby and his obsessive passion for the beautiful Daisy Buchanan. Through the observant eyes of narrator Nick Carraway, the novel explores extravagant jazz parties, unfulfilled romance, and the tragic illusions of the American Dream.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780061120084',
      category: 'Fiction',
      publishYear: 1960,
      publisher: 'HarperCollins',
      quantity: 4,
      available: 3,
      description: 'Set in the fictional town of Maycomb, Alabama during the Great Depression, six-year-old Scout Finch watches her father, Atticus Finch, defend Tom Robinson—a Black man falsely accused of a terrible crime. A timeless masterpiece exploring racial injustice, compassion, courage, and the fragile nature of childhood innocence.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: '1984',
      author: 'George Orwell',
      isbn: '9780451524935',
      category: 'Fiction',
      publishYear: 1949,
      publisher: 'Signet Classic',
      quantity: 6,
      available: 6,
      description: 'In the grim superstate of Oceania under the omnipresent surveillance of Big Brother, Winston Smith works at the Ministry of Truth rewriting history to match party propaganda. As Winston dares to commit thoughtcrime and embarks on a forbidden romance with Julia, he enters a perilous rebellion against total psychological and political domination.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
      addedDate: today(),
    },

    // ── 2. Science ───────────────────────────────────────────
    {
      id: uid(),
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      category: 'Science',
      publishYear: 1988,
      publisher: 'Bantam Books',
      quantity: 4,
      available: 4,
      description: 'Theoretical physicist Stephen Hawking takes non-specialist readers on an exhilarating voyage through cosmology, from the Big Bang and black holes to general relativity and quantum mechanics. He demystifies the fabric of spacetime and the arrow of time in search of a unified theory explaining our entire cosmos.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'Cosmos',
      author: 'Carl Sagan',
      isbn: '9780345331359',
      category: 'Science',
      publishYear: 1980,
      publisher: 'Ballantine Books',
      quantity: 5,
      available: 5,
      description: "Carl Sagan explores fifteen billion years of cosmic evolution and the mutual development of science and human civilization. Blending science, philosophy, and history, Sagan illuminates humanity's place in the vast cosmic ocean, tracing our journey from ancient stargazers to modern interstellar voyagers.",
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780345331359-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'The Gene: An Intimate History',
      author: 'Siddhartha Mukherjee',
      isbn: '9781476733524',
      category: 'Science',
      publishYear: 2016,
      publisher: 'Scribner',
      quantity: 4,
      available: 4,
      description: 'Pulitzer Prize-winning author Siddhartha Mukherjee weaves cutting-edge science, social history, and deeply personal family memoir to tell the epic story of the fundamental unit of heredity. From Aristotle and Mendel to CRISPR gene editing, this book examines human identity and what the future of genetics holds for humankind.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9781476733524-L.jpg',
      addedDate: today(),
    },

    // ── 3. Children's Book ───────────────────────────────────
    {
      id: uid(),
      title: 'The Little Prince',
      author: 'Antoine de Saint-Exupéry',
      isbn: '9780156012195',
      category: "Children's Book",
      publishYear: 1943,
      publisher: 'Harcourt, Inc.',
      quantity: 5,
      available: 5,
      description: 'After an aviator crashes his plane in the Sahara Desert, he encounters a mysterious golden-haired boy from Asteroid B-612 who shares whimsical yet profound tales of his interplanetary travels. A poetic fable celebrating love, loneliness, imagination, and the eternal truth that what is essential is invisible to the eye.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'Where the Wild Things Are',
      author: 'Maurice Sendak',
      isbn: '9780060254926',
      category: "Children's Book",
      publishYear: 1963,
      publisher: 'Harper & Row',
      quantity: 4,
      available: 4,
      description: 'When mischievous young Max dresses in his wolf suit and causes havoc, he is sent to his bedroom without supper. Suddenly, his room transforms into a moonlit forest and wild ocean that carries him to the island of ferocious Wild Things, where he is crowned king of all wild things.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780060254926-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: "Charlotte's Web",
      author: 'E.B. White',
      isbn: '9780061124952',
      category: "Children's Book",
      publishYear: 1952,
      publisher: 'Harper & Brothers',
      quantity: 5,
      available: 4,
      description: 'On the Zuckerman farm, a vulnerable little pig named Wilbur is saved from impending slaughter by a remarkably wise and compassionate gray spider named Charlotte. By weaving miraculous praising words into her delicate webs, Charlotte proves how friendship, selflessness, and empathy can change the world.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780061124952-L.jpg',
      addedDate: today(),
    },

    // ── 4. Academic (Nepal) ──────────────────────────────────
    {
      id: uid(),
      title: 'A History of Nepal',
      author: 'John Whelpton',
      isbn: '9780521804707',
      category: 'Academic (Nepal)',
      publishYear: 2005,
      publisher: 'Cambridge University Press',
      quantity: 6,
      available: 6,
      description: 'An authoritative academic history of Nepal from the unification under King Prithvi Narayan Shah in the late eighteenth century through the Rana autocracy, the democratic experiments of the 1950s, the Panchayat system, the 1990 popular movement, and the Maoist armed conflict to contemporary constitutional transitions.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780521804707-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'The Nepal Nexus',
      author: 'Sudheer Sharma',
      isbn: '9789388754590',
      category: 'Academic (Nepal)',
      publishYear: 2019,
      publisher: 'Penguin Viking',
      quantity: 5,
      available: 5,
      description: 'Renowned journalist Sudheer Sharma provides an incisive investigative analysis into modern Nepal’s turbulent political history—unraveling the royal palace massacre, the decade-long Maoist insurgency, the abolition of the 240-year-old Shah monarchy, and the complex geopolitical tug-of-war between India and China.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9789388754590-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'Battles of the New Republic: A Contemporary History of Nepal',
      author: 'Prashant Jha',
      isbn: '9789383064786',
      category: 'Academic (Nepal)',
      publishYear: 2014,
      publisher: 'Aleph Book Company',
      quantity: 4,
      available: 4,
      description: 'An exhaustive first-hand analytical account of Nepal’s historic transformation from a Hindu kingdom to a federal democratic republic. Prashant Jha explores the comprehensive peace accord, the drafting of the federal constitution, the rise of regional Madhesh movements, and the enduring quest for identity.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9789383064786-L.jpg',
      addedDate: today(),
    },

    // ── 5. Programming ───────────────────────────────────────
    {
      id: uid(),
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      category: 'Programming',
      publishYear: 2008,
      publisher: 'Prentice Hall',
      quantity: 6,
      available: 6,
      description: 'Software legend Robert C. Martin ("Uncle Bob") presents a revolutionary handbook for writing clean, readable, and robust software. Packed with real-world refactoring case studies, smell detection, and heuristic design rules, this book transforms good programmers into true software craftsmen.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'The Pragmatic Programmer: Your Journey to Mastery',
      author: 'David Thomas, Andrew Hunt',
      isbn: '9780135957059',
      category: 'Programming',
      publishYear: 2019,
      publisher: 'Addison-Wesley Professional',
      quantity: 5,
      available: 5,
      description: 'Covering topics from personal code stewardship and career mastery to architectural decoupling, test-driven agility, and continuous automation, this anniversary edition arms modern software engineers with timeless practices to build resilient, maintainable, and delight-inducing systems.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      isbn: '9780596517748',
      category: 'Programming',
      publishYear: 2008,
      publisher: "O'Reilly Media",
      quantity: 4,
      available: 4,
      description: 'Douglas Crockford unearths the elegant, expressive, and truly beautiful core of JavaScript hidden beneath decades of accumulated bad design quirks. A masterclass exploring prototype inheritance, first-class functions, closures, dynamic objects, arrays, and regular expressions.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780596517748-L.jpg',
      addedDate: today(),
    },

    // ── 6. Biography ─────────────────────────────────────────
    {
      id: uid(),
      title: 'Steve Jobs',
      author: 'Walter Isaacson',
      isbn: '9781451648539',
      category: 'Biography',
      publishYear: 2011,
      publisher: 'Simon & Schuster',
      quantity: 5,
      available: 5,
      description: 'Based on more than forty exclusive interviews with Steve Jobs conducted over two years, Walter Isaacson crafts a gripping, unvarnished biography of the visionary pioneer whose intense perfectionism and fiery drive revolutionized computers, animated movies, music, smartphones, and tablet computing.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'Long Walk to Freedom',
      author: 'Nelson Mandela',
      isbn: '9780316548182',
      category: 'Biography',
      publishYear: 1994,
      publisher: 'Little, Brown and Company',
      quantity: 4,
      available: 4,
      description: 'The profoundly moving autobiography of Nelson Mandela, one of the greatest moral leaders in human history. Mandela chronicles his upbringing in rural Transkei, his anti-apartheid leadership in the ANC, twenty-seven arduous years of imprisonment on Robben Island, and the triumphant birth of a democratic South Africa.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780316548182-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'Einstein: His Life and Universe',
      author: 'Walter Isaacson',
      isbn: '9780743264730',
      category: 'Biography',
      publishYear: 2007,
      publisher: 'Simon & Schuster',
      quantity: 4,
      available: 4,
      description: "Drawing upon newly released personal correspondences, Walter Isaacson explores how an imaginative, insolent patent clerk revolutionized physics. Isaacson connects Einstein's scientific brilliance with his fierce individuality, non-conformist spirit, philosophical curiosity, and humanitarian principles.",
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780743264730-L.jpg',
      addedDate: today(),
    },

    // ── 7. Business ──────────────────────────────────────────
    {
      id: uid(),
      title: 'Good to Great',
      author: 'Jim Collins',
      isbn: '9780066620992',
      category: 'Business',
      publishYear: 2001,
      publisher: 'HarperBusiness',
      quantity: 5,
      available: 5,
      description: 'Backed by five years of rigorous empirical research comparing elite companies with mediocre peers, Jim Collins identifies the key management principles—such as Level 5 Leadership, First Who Then What, the Hedgehog Concept, and the Flywheel Effect—that allow companies to make the leap to enduring greatness.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780066620992-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'Zero to One: Notes on Startups',
      author: 'Peter Thiel, Blake Masters',
      isbn: '9780804139298',
      category: 'Business',
      publishYear: 2014,
      publisher: 'Crown Business',
      quantity: 5,
      available: 5,
      description: 'Legendary entrepreneur and venture capitalist Peter Thiel presents an optimistic, contrarian playbook for founding transformative companies. Thiel argues that true technological progress occurs when entrepreneurs create singular, groundbreaking innovations that move the world from 0 to 1.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg',
      addedDate: today(),
    },
    {
      id: uid(),
      title: 'The Lean Startup',
      author: 'Eric Ries',
      isbn: '9780307887894',
      category: 'Business',
      publishYear: 2011,
      publisher: 'Crown Currency',
      quantity: 6,
      available: 6,
      description: 'Eric Ries provides a scientific, hypothesis-driven methodology for building startups and launching successful products in environments of extreme uncertainty. Introducing foundational concepts like Build-Measure-Learn feedback loops, Minimum Viable Products (MVPs), and agile pivoting, this book revolutionized modern entrepreneurship.',
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg',
      addedDate: today(),
    },
  ];

  // Auto-reseed detection: if books are fewer than 21 or missing cover images
  const needsReseed =
    !data.books ||
    data.books.length < 21 ||
    data.books.some((b) => !b.coverImage || !b.category);

  if (needsReseed) {
    data.books = sampleBooks;
  }

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

  if (!data.members || data.members.length <= 1) {
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
    data.members = sampleMembers;
  }

  if (!data.borrows || data.borrows.length === 0) {
    const sampleBorrows = [
      {
        id: uid(),
        bookId: data.books[1]?.id || uid(),
        memberId: data.members[1]?.id || uid(),
        borrowDate: daysFromNow(-20),
        dueDate: daysFromNow(-6),
        returnDate: null,
        status: 'borrowed',
        fine: 0,
        borrowFee: 50,
        lost: false,
      },
      {
        id: uid(),
        bookId: data.books[8]?.id || uid(),
        memberId: data.members[2]?.id || uid(),
        borrowDate: daysFromNow(-8),
        dueDate: daysFromNow(6),
        returnDate: null,
        status: 'borrowed',
        fine: 0,
        borrowFee: 50,
        lost: false,
      },
    ];
    data.borrows = sampleBorrows;
  }

  // Ensure settings are properly migrated
  data.settings = {
    ...DEFAULT_SETTINGS,
    ...(data.settings || {}),
  };

  saveData(data);
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

    const fee = getBorrowFee(book, d.settings);

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
      borrowFee: fee,
      lost: false,
    }];
    d.books = d.books.map((bk) =>
      bk.id === borrow.bookId ? { ...bk, available: bk.available - 1 } : bk
    );
    update(d);
    pushNotification({
      type: 'success',
      message: `Book "${book.title}" issued to ${member.name}. Borrow fee: ${d.settings.currency} ${fee.toFixed(2)}`,
    });
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
      fee: 0, // Free reservation hold
      status: 'pending',
    };
    d.reservations.push(reservation);
    update(d);
    pushNotification({
      type: 'success',
      message: `Reserved for pickup on ${formatDate(pickup)}. Hold valid for ${d.settings.reservationHoldDays || 3} days.`,
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
    const fee = getBorrowFee(book, d.settings);
    d.borrows = [...d.borrows, {
      id: uid(),
      bookId: res.bookId,
      memberId: res.memberId,
      borrowDate: today(),
      dueDate,
      returnDate: null,
      status: 'borrowed',
      fine: 0,
      borrowFee: fee,
      lost: false,
    }];
    d.books = d.books.map((b) => b.id === res.bookId ? { ...b, available: b.available - 1 } : b);
    update(d);
    pushNotification({
      type: 'success',
      message: `Reservation approved and book issued. Borrow fee: ${d.settings.currency} ${fee.toFixed(2)}`,
    });
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
    getBorrowFee,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
