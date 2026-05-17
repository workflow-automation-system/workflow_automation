import React from 'react';

const WorkflowCardSkeleton = () => (
  <article className="enterprise-card overflow-hidden">
    <div className="space-y-4 p-5">
      <div className="h-4 w-2/3 rounded bg-[#E2E8F0]" />
      <div className="h-7 w-20 rounded-full bg-[#E2E8F0]" />
      <div className="h-4 w-full rounded bg-[#E2E8F0]" />
      <div className="h-4 w-5/6 rounded bg-[#E2E8F0]" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-[#E2E8F0]" />
        <div className="h-4 w-24 rounded bg-[#E2E8F0]" />
      </div>
    </div>
    <div className="border-t border-[#E2E8F0] px-5 py-3">
      <div className="h-4 w-28 rounded bg-[#E2E8F0]" />
    </div>
  </article>
);

export default WorkflowCardSkeleton;
