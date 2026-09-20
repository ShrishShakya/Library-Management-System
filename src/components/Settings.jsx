import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { MAX_FINE_AMOUNT } from '../utils/helpers';

export default function Settings() {
  const { data, updateSettings } = useData();
  const [form, setForm] = useState(data.settings);

  useEffect(() => {
    setForm(data.settings);
  }, [data.settings]);

  const setTier = (idx, key, value) => {
    const tiers = [...form.overdueFineTiers];
    tiers[idx] = { ...tiers[idx], [key]: Number(value) || 0 };
    setForm({ ...form, overdueFineTiers: tiers });
  };

  const addTier = () => {
    setForm({
      ...form,
      overdueFineTiers: [...form.overdueFineTiers, { days: 60, finePerDay: 150.0 }],
    });
  };

  const removeTier = (idx) => {
    setForm({
      ...form,
      overdueFineTiers: form.overdueFineTiers.filter((_, i) => i !== idx),
    });
  };

  const handleSave = () => {
    updateSettings(form);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Library Configuration & Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure currency, membership validation, reservation rules, and fine structures.
        </p>
      </div>

      {/* Global Cap Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
        <i className="fas fa-shield-halved text-amber-600 text-base mt-0.5" />
        <div>
          <strong className="block text-sm mb-0.5 text-amber-950 font-bold">Global Fine Safety Limit (Cap)</strong>
          <span>All computed fines (overdue penalties, lost book charges, and administrative fees) are automatically capped at a maximum of <strong>{form.currency} {MAX_FINE_AMOUNT}</strong> per transaction to protect members.</span>
        </div>
      </div>

      {/* Currency & Localization */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <i className="fas fa-money-bill-wave text-emerald-600" />
          Currency & Localization
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Set the currency symbol applied across fines, reservation charges, and renewal fees.
        </p>
        <div className="max-w-xs">
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Currency Label / Symbol
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold text-slate-800"
              maxLength={8}
              placeholder="e.g. NRs."
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, currency: 'NRs.' })}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl text-slate-700 font-medium whitespace-nowrap"
            >
              Set NRs.
            </button>
          </div>
        </div>
      </div>

      {/* Membership Validation Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <i className="fas fa-id-card text-purple-600" />
          Membership Validity & Expiration Rules
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Set default membership duration and renewal charges for library members.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Default Membership Duration (Days)
            </label>
            <input
              type="number"
              min="30"
              value={form.membershipDurationDays || 365}
              onChange={(e) => setForm({ ...form, membershipDurationDays: Number(e.target.value) || 365 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">365 days = 1 Year validity</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Annual Renewal Fee ({form.currency})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.membershipRenewalFee || 500}
              onChange={(e) => setForm({ ...form, membershipRenewalFee: Number(e.target.value) || 0 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Charged when extending membership</span>
          </div>
        </div>
      </div>

      {/* Borrow Fee Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <i className="fas fa-money-bill-wave text-emerald-600" />
          Book Borrow Fees by Category
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Charged when a book is issued to a member. Academic books from Nepal have a discounted fee.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Standard Borrow Fee ({form.currency})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.borrowFee ?? 50}
              onChange={(e) => setForm({ ...form, borrowFee: Number(e.target.value) || 0 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold text-slate-800"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Applied to Fiction, Science, Programming, etc.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Academic (Nepal) Borrow Fee ({form.currency})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.borrowFeeAcademic ?? 10}
              onChange={(e) => setForm({ ...form, borrowFeeAcademic: Number(e.target.value) || 0 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold text-emerald-700"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Special student rate for Academic (Nepal) books</span>
          </div>
        </div>
      </div>

      {/* Reservation Settings (Free Holds) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <i className="fas fa-bookmark text-blue-600" />
          Book Reservations & Booking Holds
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Reservations are free holds. Books are held for members until the specified hold period expires.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Hold Period After Pickup Date (Days)
            </label>
            <input
              type="number"
              min="1"
              value={form.reservationHoldDays || 3}
              onChange={(e) => setForm({ ...form, reservationHoldDays: Number(e.target.value) || 1 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Days a reserved book is kept before auto-release</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Max Active Reservations Per Member
            </label>
            <input
              type="number"
              min="1"
              value={form.maxReservationsPerUser || 3}
              onChange={(e) => setForm({ ...form, maxReservationsPerUser: Number(e.target.value) || 1 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Maximum concurrent pending reservations per user</span>
          </div>
        </div>
      </div>

      {/* Tiered Overdue fines */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-clock text-rose-600" />
            Tiered Overdue Fine Structure
          </h3>
          <button
            onClick={addTier}
            className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
          >
            <i className="fas fa-plus mr-1" /> Add Rate Tier
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Overdue fines scale automatically based on days overdue (subject to {form.currency} {MAX_FINE_AMOUNT} maximum cap).
        </p>

        <div className="space-y-2.5">
          {form.overdueFineTiers.map((t, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 w-24">If overdue ≥</span>
              <input
                type="number"
                min="1"
                value={t.days}
                onChange={(e) => setTier(i, 'days', e.target.value)}
                className="w-20 border rounded-lg px-3 py-1 text-sm bg-white text-center font-bold"
              />
              <span className="text-xs text-slate-500">days:</span>

              <span className="text-xs font-semibold text-slate-600 ml-4">Charge ({form.currency}/day):</span>
              <input
                type="number"
                min="0"
                step="1"
                value={t.finePerDay}
                onChange={(e) => setTier(i, 'finePerDay', e.target.value)}
                className="w-28 border rounded-lg px-3 py-1 text-sm bg-white text-center font-bold text-rose-700"
              />

              <button
                onClick={() => removeTier(i)}
                className="text-slate-400 hover:text-red-600 text-sm ml-auto p-1.5"
                title="Remove Tier"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lost book charges */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <i className="fas fa-circle-exclamation text-rose-600" />
          Lost Book Charges & Processing Fees
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Penalties charged when a book is marked lost by library administration.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Base Replacement Fine ({form.currency})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.lostBookFine}
              onChange={(e) => setForm({ ...form, lostBookFine: Number(e.target.value) || 0 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Administrative Processing Fee ({form.currency})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.lostBookProcessingFee}
              onChange={(e) => setForm({ ...form, lostBookProcessingFee: Number(e.target.value) || 0 })}
              className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition font-bold text-sm shadow-md flex items-center gap-2"
        >
          <i className="fas fa-save" /> Save Settings
        </button>
      </div>
    </div>
  );
}
