import React, { useState, useMemo } from 'react';
import { useData, formatDate } from '../hooks/useData';
import Modal from './Modal';

export default function Members() {
  const { data, addMember, editMember, deleteMember } = useData();
  const members = data.members || [];
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    active: true
  });

  const filtered = useMemo(() => {
    let list = members;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || m.phone.includes(s));
    }
    if (roleFilter !== 'All') {
      list = list.filter(m => (m.role || 'user') === roleFilter);
    }
    return list;
  }, [members, search, roleFilter]);

  const openModal = (member = null) => {
    if (member) {
      setEditingId(member.id);
      setForm({
        name: member.name,
        email: member.email || '',
        phone: member.phone || '',
        password: member.password || 'user123',
        role: member.role || 'user',
        active: member.active !== false
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        email: '',
        phone: '',
        password: 'user123',
        role: 'user',
        active: true
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || '',
      password: form.password.trim() || 'user123',
      role: form.role,
      active: form.active
    };
    if (editingId) editMember(editingId, payload);
    else addMember(payload);
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this member? This will also remove their borrow and booking history.')) deleteMember(id);
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] flex gap-2">
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm flex items-center gap-1 shadow-sm" onClick={() => openModal()}>
          <i className="fas fa-user-plus mr-1" /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <i className="fas fa-users text-4xl block mb-2" />
              <p>{search || roleFilter !== 'All' ? 'No matching members found.' : 'No members registered yet.'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 max-w-[150px] truncate font-medium text-slate-900" title={m.name}>{m.name}</td>
                    <td className="px-4 py-3 text-slate-600">{m.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{m.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        <i className={`fas ${m.role === 'admin' ? 'fa-user-shield' : 'fa-user'} mr-1`} />
                        {m.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {m.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(m.membershipDate)}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button className="text-blue-500 hover:text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded" onClick={() => openModal(m)} title="Edit Member"><i className="fas fa-pen" /></button>
                      <button className="text-red-500 hover:text-red-700 text-xs bg-red-50 px-2 py-1 rounded" onClick={() => handleDelete(m.id)} title="Delete Member"><i className="fas fa-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Member' : 'Add New Member'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name *</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Full name" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address *</label>
            <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="user@example.com" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Phone number" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Login Password *</label>
              <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Password" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Account Role</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                <option value="user">User / Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.active ? 'active' : 'inactive'} onChange={(e) => setForm({...form, active: e.target.value === 'active'})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-3 border-t">
          <button className="px-4 py-2 rounded-lg border text-slate-600 hover:bg-slate-50 text-sm" onClick={closeModal}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium" onClick={handleSubmit}>{editingId ? 'Update Member' : 'Add Member'}</button>
        </div>
      </Modal>
    </div>
  );
}
