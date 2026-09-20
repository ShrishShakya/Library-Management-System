import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { formatDate, generateMembershipId } from '../utils/helpers';
import Modal from './Modal';

export default function Members() {
  const { data, addMember, editMember, deleteMember } = useData();
  const members = data.members || [];
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', active: true,
  });

  const filtered = useMemo(() => {
    let list = members;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) ||
          m.phone.includes(s) ||
          (m.membershipId || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [members, search]);

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
        active: member.active !== false,
      });
    } else {
      setEditingId(null);
      setForm({ name: '', email: '', phone: '', password: 'user123', active: true });
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
      active: form.active,
    };
    if (form.password) payload.password = form.password;
    if (editingId) editMember(editingId, payload);
    else addMember(payload);
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this member? This will also remove their borrow history.')) {
      deleteMember(id);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name, email, membership ID..."
          className="flex-1 min-w-[200px] border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
          onClick={() => openModal()}
        >
          <i className="fas fa-user-plus mr-1" /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-users text-4xl block mb-2" />
              <p>No members found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Membership ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {m.membershipId || '—'}
                      {m.role === 'admin' && (
                        <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px]">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[150px] truncate">{m.name}</td>
                    <td className="px-4 py-3">{m.email || '—'}</td>
                    <td className="px-4 py-3">{m.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        m.active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {m.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {formatDate(m.membershipDate)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        className="text-blue-500 hover:text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded"
                        onClick={() => openModal(m)}
                      >
                        <i className="fas fa-pen" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 text-xs bg-red-50 px-2 py-1 rounded"
                        onClick={() => handleDelete(m.id)}
                      >
                        <i className="fas fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Member' : 'Add New Member'}>
        {!editingId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm">
            <i className="fas fa-id-card text-blue-500 mr-2" />
            Membership ID: <strong className="font-mono">{nextMembershipId}</strong>
            <span className="block text-xs text-slate-500 mt-1">
              Membership date will be set automatically to today.
            </span>
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 mt-2">Full Name *</label>
        <input
          type="text"
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <label className="block text-sm font-medium text-slate-700 mt-2">Email *</label>
        <input
          type="email"
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <label className="block text-sm font-medium text-slate-700 mt-2">Phone</label>
        <input
          type="text"
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <label className="block text-sm font-medium text-slate-700 mt-2">
          {editingId ? 'New Password (leave blank to keep)' : 'Initial Password'}
        </label>
        <input
          type="text"
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Defaults to user123"
        />

        <label className="block text-sm font-medium text-slate-700 mt-2">Status</label>
        <select
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.active ? 'active' : 'inactive'}
          onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex justify-end gap-3 mt-4">
          <button
            className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-50 text-sm"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm"
            onClick={handleSubmit}
          >
            {editingId ? 'Update' : 'Add Member'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
