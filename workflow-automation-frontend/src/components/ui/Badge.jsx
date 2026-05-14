import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-white text-[var(--text-primary)] border-[#E2E8F0]',
    primary: 'bg-[#D0FFA4] text-[#292D32] border-[#E2E8F0]',
    success: 'bg-[#D0FFA4] text-[#292D32] border-[#E2E8F0]',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    active: 'bg-[#D0FFA4] text-[#292D32] border-[#E2E8F0]',
    inactive: 'bg-white text-[#5C5C5C] border-[#E2E8F0]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
