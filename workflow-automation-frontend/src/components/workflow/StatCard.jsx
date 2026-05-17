import React from 'react';

const StatCard = ({ label, value }) => (
  <article className="enterprise-card p-4">
    <p className="text-xs uppercase tracking-[0.06em] text-[#5C5C5C]">{label}</p>
    <p className="mt-2 text-xl font-bold text-[#292D32]">{value}</p>
  </article>
);

export default StatCard;
