import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../hooks/useData';
import {
  formatDate, generateMembershipId, isMembershipExpired,
  isMembershipExpiringSoon, daysBetween, daysFromNow, today,
} from '../utils/helpers';
import Modal from './Modal';

export default function Members() {
  const { data, addMember, editMember, deleteMember, renewMember } = useData();
  const location = useLocation();
  const members = data.members || [];
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    membershipExpiryDate: daysFromNow(365),
    active: true,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      openModal();
    }
  }, [location.search]);

  const filtered = useMemo(() => {
    let list = members;
    if (roleFilter !== 'all') {
      list = list.filter((m) => (m.role || 'user') === roleFilter);
    }
    if (statusFilter === 'active') {
      list = list.filter((m) => !isMembershipExpired(m.membershipExpiryDate) && m.active !== false);
    } else if (statusFilter === 'expired') {
      list = list.filter((m) => isMembershipExpired(m.membershipExpiryDate) || m.active === false);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          (m.email || '').toLowerCase().includes(s) ||
          (m.phone || '').includes(s) ||
          (m.membershipId || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [members, roleFilter, statusFilter, search]);

  const nextMembershipId = useMemo(
    () => generateMembershipId(members.map((m) => m.membershipId).filter(Boolean)),
    [members]
  );

  const openModal = (member = null) => {
    if (member) {
      setEditingId(member.id);
      setForm({
        name: member.name,
        email: member.email || '',
        phone: member.phone || '',
        password: '',
        role: member.role || 'user',
        membershipExpiryDate: member.membershipExpiryDate || daysFromNow(365),
        active: member.active !== false,
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        email: '',
        phone: '',
        password: 'user123',
        role: 'user',
        membershipExpiryDate: daysFromNow(data.settings?.membershipDurationDays || 365),
        active: true,
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      membershipExpiryDate: form.membershipExpiryDate,
      active: form.active,
    };
    if (form.password) payload.password = form.password;
    if (editingId) editMember(editingId, payload);
    else addMember(payload);
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this user? This will also remove their borrow history.')) {
      deleteMember(id);
    }
  };

  const handleRenew = (id) => {
    renewMember(id, data.settings?.membershipDurationDays || 365);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[220px] flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search by name, email, phone, ID..."
              className="w-full pl-8 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Regular Members</option>
          </select>

          <select
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Members</option>
            <option value="expired">Expired Members</option>
          </select>
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-1.5 shadow-sm"
          onClick={() => openModal()}
        >
          <i className="fas fa-user-plus mr-1" /> Add Member / Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-users text-4xl block mb-2" />
              <p>No members or administrators found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Membership ID</th>
                  <th className="px-4 py-3 text-left">Name & Role</th>
                  <th className="px-4 py-3 text-left">Contact Info</th>
                  <th className="px-4 py-3 text-left">Joined Date</th>
                  <th className="px-4 py-3 text-left">Membership Expiration</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((m) => {
                  const isAdmin = m.role === 'admin';
                  const expired = !isAdmin && isMembershipExpired(m.membershipExpiryDate);
                  const expiringSoon = !isAdmin && !expired && isMembershipExpiringSoon(m.membershipExpiryDate);
                  const daysLeft = m.membershipExpiryDate ? daysBetween(today(), m.membershipExpiryDate) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                        {m.membershipId || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div>
                          {isAdmin ? (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <i className="fas fa-shield-halved text-[9px]" /> Administrator
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-1">
                              <i className="fas fa-user text-[9px]" /> Member
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-700 font-medium">{m.email || '—'}</div>
                        <div className="text-xs text-slate-400">{m.phone || 'No phone'}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(m.membershipDate)}
                      </td>

                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="text-xs text-slate-400">Permanent Access</span>
                        ) : expired ? (
                          <div>
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Expired ({formatDate(m.membershipExpiryDate)})
                            </span>
                          </div>
                        ) : expiringSoon ? (
                          <div>
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              Expiring in {daysLeft} days ({formatDate(m.membershipExpiryDate)})
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              Active · {daysLeft} days left ({formatDate(m.membershipExpiryDate)})
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5">
                        {!isAdmin && (
                          <button
                            className="text-emerald-700 hover:text-emerald-900 text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition font-medium"
                            onClick={() => handleRenew(m.id)}
                            title="Renew Membership (+1 Year)"
                          >
                            <i className="fas fa-arrows-rotate mr-1 text-[10px]" /> Renew
                          </button>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded-lg transition"
                          onClick={() => openModal(m)}
                          title="Edit Profile"
                        >
                          <i className="fas fa-pen" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 text-xs bg-red-50 px-2 py-1 rounded-lg transition"
                          onClick={() => handleDelete(m.id)}
                          title="Delete Member"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Account' : 'Add New Member / Administrator'}>
        {!editingId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-sm">
            <i className="fas fa-id-card text-blue-600 mr-2" />
            Assigned Membership ID: <strong className="font-mono text-blue-900">{nextMembershipId}</strong>
            <span className="block text-xs text-slate-500 mt-1">
              Joined date is automatically set to today. Membership validity defaults to 1 year.
            </span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Account Role *</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">Library Member (Regular User)</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Alice Johnson"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. alice@gmail.com or @outlook.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. 9841234567"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {editingId ? 'Change Password (leave empty to keep current)' : 'Password'}
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Defaults to user123"
            />
          </div>

          {form.role !== 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Membership Valid Until (Expiration Date)
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.membershipExpiryDate || ''}
                onChange={(e) => setForm({ ...form, membershipExpiryDate: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Account Status</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.active ? 'active' : 'inactive'}
              onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Suspended / Deactivated</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50 text-sm font-medium"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-sm"
            onClick={handleSubmit}
          >
            {editingId ? 'Save Changes' : 'Register Account'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
