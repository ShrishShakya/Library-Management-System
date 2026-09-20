import React from 'react';
import { useNavigate } from 'react-router-dom';

const ACTIONS = [
  { label: 'Add Book',  icon: 'fa-book-medical', color: 'bg-blue-500',    route: '/books?action=add' },
  { label: 'Add Member',icon: 'fa-user-plus',    color: 'bg-purple-500',  route: '/members?action=add' },
  { label: 'Issue Book',icon: 'fa-handshake',    color: 'bg-green-500',   route: '/borrows?action=borrow' },
  { label: 'Return Book',icon:'fa-rotate-left',  color: 'bg-amber-500',   route: '/borrows?action=return' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        <i className="fas fa-bolt text-amber-500 mr-2" />Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.route)}
            className={`${a.color} text-white rounded-lg py-3 px-4 flex flex-col items-center gap-1 hover:opacity-90 transition shadow-sm`}
          >
            <i className={`fas ${a.icon} text-lg`} />
            <span className="text-xs font-medium">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
