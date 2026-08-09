import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          <i className="fas fa-book-open text-blue-500 mr-2" />
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
