// ── ID & date utilities ─────────────────────────────────────
export const uid = () =>
  Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);

export const today = () => new Date().toISOString().slice(0, 10);

export const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) => {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

export const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const isOverdue = (dueDate) => dueDate && dueDate < today();

export const formatCurrency = (n, symbol = '$') =>
  `${symbol}${(Number(n) || 0).toFixed(2)}`;

// ── Membership ID generator ─────────────────────────────────
// Format: LIB-YYYY-XXXXX  (e.g., LIB-2026-00042)
export const generateMembershipId = (existingIds = []) => {
  const year = new Date().getFullYear();
  const prefix = `LIB-${year}-`;
  const nums = existingIds
    .filter((id) => typeof id === 'string' && id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
};

// ── Tiered overdue fine calculator ──────────────────────────
// tiers: [{ days: 1, finePerDay: 0.25 }, { days: 7, finePerDay: 0.5 }, ...]
// Sorted ascending by `days`. The applicable rate is the highest tier
// whose `days` threshold is <= the number of days overdue.
export const calculateOverdueFine = (dueDate, tiers = []) => {
  if (!dueDate) return 0;
  const overdueDays = daysBetween(dueDate, today());
  if (overdueDays <= 0) return 0;

  const sorted = [...tiers].sort((a, b) => a.days - b.days);
  let rate = 0;
  for (const t of sorted) {
    if (overdueDays >= t.days) rate = t.finePerDay;
  }
  return overdueDays * rate;
};

// ── Password hashing (demo only – use bcrypt server-side!) ─
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(36)}`;
};

// ── Image file → base64 ─────────────────────────────────────
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
