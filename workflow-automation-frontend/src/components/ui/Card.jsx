import React from 'react';

const Card = ({ children, className = '', onClick, hoverable = false, ...props }) => {
  const baseStyles = 'enterprise-card rounded-[20px]';
  const hoverStyles = hoverable ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-b border-[var(--border)] ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`px-5 py-5 ${className}`}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`px-5 py-4 border-t border-[var(--border)] bg-[var(--surface-hover)] rounded-b-[20px] ${className}`}>
    {children}
  </div>
);

export default Card;
