import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GitBranch, Plus, Search, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';

const categories = [
  { name: 'All', count: 48 },
  { name: 'Operations', count: 10 },
  { name: 'Finance', count: 8 },
  { name: 'Sales', count: 9 },
  { name: 'Support', count: 7 },
  { name: 'IT', count: 14 },
];

const templates = [
  {
    id: 'tpl-1',
    name: 'Multi-Channel Incident Response',
    description: 'Trigger branch logic across Slack, ticketing, and status updates with automatic escalation fallback.',
    category: 'IT',
    rating: 4.9,
    runs: '3.2k',
    nodes: 14,
  },
  {
    id: 'tpl-2',
    name: 'Enterprise Lead Qualification',
    description: 'Route inbound leads through enrichment, scoring, and territory assignment with approval checkpoints.',
    category: 'Sales',
    rating: 4.8,
    runs: '2.1k',
    nodes: 11,
  },
  {
    id: 'tpl-3',
    name: 'Invoice Exception Handling',
    description: 'Map invoice fields, branch by risk score, and notify approvers when data quality checks fail.',
    category: 'Finance',
    rating: 4.7,
    runs: '1.6k',
    nodes: 12,
  },
  {
    id: 'tpl-4',
    name: 'Customer Escalation Pipeline',
    description: 'Monitor SLA breach signals and route high-priority support tickets to specialized response squads.',
    category: 'Support',
    rating: 4.7,
    runs: '2.8k',
    nodes: 9,
  },
];

const Templates = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const visibleTemplates =
    selectedCategory === 'All'
      ? templates
      : templates.filter((template) => template.category === selectedCategory);

  return (
    <div className="space-y-5 font-urbanist">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">Templates</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            Deploy pre-built enterprise blueprints for scalable automation programs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/create-workflow')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
        >
          <Plus size={16} />
          Create Custom
        </button>
      </div>

      <section className="enterprise-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#292D32]">Enterprise Template Library</h2>
            <p className="mt-1 text-sm text-[#5C5C5C]">
              Curated blueprints for branching logic, error handling, and governed data mapping patterns.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-center">
              <p className="text-xl font-bold text-[#292D32]">48+</p>
              <p className="text-xs text-[#5C5C5C]">Templates</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-center">
              <p className="text-xl font-bold text-[#292D32]">15k+</p>
              <p className="text-xs text-[#5C5C5C]">Deployments</p>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-center">
              <p className="text-xl font-bold text-[#292D32]">99%</p>
              <p className="text-xs text-[#5C5C5C]">Reliability</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search templates"
            className="w-full rounded-2xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-4 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.name}
            type="button"
            onClick={() => setSelectedCategory(category.name)}
            className={[
              'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
              selectedCategory === category.name
                ? 'border-[#292D32] bg-[#292D32] text-white'
                : 'border-[#E2E8F0] bg-white text-[#5C5C5C] hover:border-[#D0FFA4]',
            ].join(' ')}
          >
            {category.name}
            <span className="ml-2 text-xs opacity-70">{category.count}</span>
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTemplates.map((template) => (
          <article key={template.id} className="enterprise-card p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
                <Sparkles size={17} className="text-[#292D32]" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#D0FFA4] px-2 py-1 text-xs font-semibold text-[#292D32]">
                <Star size={12} />
                {template.rating}
              </span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-[#292D32]">{template.name}</h3>
            <p className="mt-2 text-sm text-[#5C5C5C]">{template.description}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#5C5C5C]">
              <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">{template.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                <GitBranch size={12} />
                {template.nodes} nodes
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                <Users size={12} />
                {template.runs} runs
              </span>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/create-workflow')}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#292D32] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249]"
              >
                Use Template
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm font-semibold text-[#292D32] hover:border-[#D0FFA4]"
              >
                <ShieldCheck size={14} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Templates;
