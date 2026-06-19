import React from 'react';

const StatCard = ({ icon, label, value }) => (
  <article className="enterprise-card relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
    <div className="relative z-10 flex items-start gap-4">
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E2E8F0] text-[#292D32]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5C5C]">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[#292D32]">{value}</p>
      </div>
    </div>
  </article>
);

export default StatCard;
