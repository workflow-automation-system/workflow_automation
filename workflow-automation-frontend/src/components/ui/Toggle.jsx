import React from 'react';

const Toggle = ({ checked, onChange, label, disabled = false, className = '' }) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            w-11 h-6 rounded-full transition-colors
            ${checked ? 'bg-[#D0FFA4]' : 'bg-[var(--border)]'}
          `}
        />
        <div
          className={`
            absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
      )}
    </label>
  );
};

export default Toggle;
