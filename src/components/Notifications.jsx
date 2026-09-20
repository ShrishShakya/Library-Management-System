import React, { useEffect } from 'react';
import { useData } from '../hooks/useData';

const STYLES = {
  success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'fa-check-circle text-green-600', text: 'text-green-800' },
  error:   { bg: 'bg-red-50',   border: 'border-red-200',   icon: 'fa-circle-xmark text-red-600',   text: 'text-red-800' },
  warning: { bg: 'bg-yellow-50',border: 'border-yellow-200',icon: 'fa-triangle-exclamation text-yellow-600', text: 'text-yellow-800' },
  info:    { bg: 'bg-blue-50',  border: 'border-blue-200',  icon: 'fa-circle-info text-blue-600',   text: 'text-blue-800' },
};

export default function Notifications() {
  const { data, dismissNotification } = useData();
  const notifications = data.notifications || [];

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) =>
      setTimeout(() => dismissNotification(n.id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {notifications.map((n) => {
        const s = STYLES[n.type] || STYLES.info;
        return (
          <div
            key={n.id}
            className={`${s.bg} ${s.border} border rounded-lg shadow-lg p-3 flex items-start gap-3 animate-in slide-in-from-right`}
          >
            <i className={`fas ${s.icon} mt-0.5`} />
            <p className={`text-sm ${s.text} flex-1`}>{n.message}</p>
            <button
              className="text-slate-400 hover:text-slate-600"
              onClick={() => dismissNotification(n.id)}
            >
              <i className="fas fa-times text-xs" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
