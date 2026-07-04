import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modalMarkup = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white border border-[#E2E8F0] rounded-3xl shadow-xl w-full ${sizes[size]} transform transition-all`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
};

Modal.Footer = ({ children, className = '' }) => (
  <div className={`flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] ${className}`}>
    {children}
  </div>
);

export default Modal;
