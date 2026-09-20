import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';

export default function Settings() {
  const { data, updateSettings } = useData();
  const [form, setForm] = useState(data.settings);

  useEffect(() => { setForm(data.settings); }, [data.settings]);

  const setTier = (idx, key, value) => {
    const tiers = [...form.overdueFineTiers];
    tiers[idx] = { ...tiers[idx], [key]: Number(value) || 0 };
    setForm({ ...form, overdueFineTiers: tiers });
  };

  const addTier = () => {
    setForm({
      ...form,
      overdueFineTiers: [...form.overdueFineTiers, { days: 60, finePerDay: 3.0 }],
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Currency */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          <i className="fas fa-dollar-sign text-green-500 mr-2" />Currency
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Symbol</label>
          <input
            type="text" value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-32 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            maxLength={3}
          />
        </div>
      </div>

      {/* Reservation settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          <i className="fas fa-bookmark text-blue-500 mr-2" />Reservation / Booking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reservation fee</label>
            <input
              type="number" min="0" step="0.01" value={form.reservationFee}
              onChange={(e) => setForm({ ...form, reservationFee: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hold period (days)</label>
            <input
              type="number" min="1" value={form.reservationHoldDays}
              onChange={(e) => setForm({ ...form, reservationHoldDays: Number(e.target.value) || 1 })}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max per user</label>
            <input
              type="number" min="1" value={form.maxReservationsPerUser}
              onChange={(e) => setForm({ ...form, maxReservationsPerUser: Number(e.target.value) || 1 })}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Overdue fines */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">
            <i className="fas fa-clock text-red-500 mr-2" />Tiered Overdue Fines
          </h3>
          <button
            onClick={addTier}
            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
          >
            <i className="fas fa-plus mr-1" />Add tier
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          The more a book is overdue, the higher the per‑day fine. The applicable rate
          is the highest tier whose "days" threshold has been reached.
        </p>
        <div className="space-y-2">
          {form.overdueFineTiers.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-16">≥ days:</span>
              <input
                type="number" min="1" value={t.days}
                onChange={(e) => setTier(i, 'days', e.target.value)}
                className="w-20 border rounded-lg px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-slate-500">{form.currency}/day:</span>
              <input
                type="number" min="0" step="0.01" value={t.finePerDay}
                onChange={(e) => setTier(i, 'finePerDay', e.target.value)}
                className="w-24 border rounded-lg px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => removeTier(i)}
                className="text-red-400 hover:text-red-600 text-xs"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lost book */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">
          <i className="fas fa-circle-exclamation text-red-500 mr-2" />Lost Book Charges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lost book fine ({form.currency})
            </label>
            <input
              type="number" min="0" step="0.01" value={form.lostBookFine}
              onChange={(e) => setForm({ ...form, lostBookFine: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Processing fee ({form.currency})
            </label>
            <input
              type="number" min="0" step="0.01" value={form.lostBookProcessingFee}
              onChange={(e) => setForm({ ...form, lostBookProcessingFee: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition font-medium"
        >
          <i className="fas fa-save mr-2" />Save Settings
        </button>
      </div>
    </div>
  );
}
