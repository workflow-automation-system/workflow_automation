import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ChartSpline,
  CheckCircle2,
  Mail,
  MessageSquare,
  Network,
  Plus,
  Shield,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { canCreateWorkflow, isViewer, isAdmin, getRole } from '../utils/rbac';

const graphData = [62, 58, 68, 64, 74, 70, 78, 75, 82, 79, 86, 84];

const roleBanners = {
  ADMIN: {
    bg: 'border-[#292D32] bg-[#292D32]',
    text: 'text-white',
    icon: Shield,
    message: 'Administrator mode. You have full access to manage the platform, users, workflows, and settings.',
  },
  USER: null,
  VIEWER: {
    bg: 'border-[#E2E8F0] bg-white',
    text: 'text-[#5C5C5C]',
    icon: Eye,
    message: 'Read-only mode. You can review workflows and execution history, and execute only where access is granted.',
  },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = getRole(user);
  const banner = roleBanners[role];

  const points = graphData
    .map((value, index) => `${index * (100 / (graphData.length - 1))},${100 - value}`)
    .join(' ');

  return (
    <div className="space-y-6 font-urbanist">
      {banner ? (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${banner.bg}`}>
          <banner.icon size={16} className={banner.text} />
          <span className={`text-sm font-medium ${banner.text}`}>{banner.message}</span>
        </div>
      ) : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-[#292D32]">
            Welcome Back, {user?.name || 'Operator'}
          </h1>
          <p className="mt-2 text-lg text-[#5E6672]">Today's Business Automation Performance</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin(user) && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#292D32] transition-colors hover:border-[#D0FFA4]"
            >
              <Shield size={16} />
              Admin Console
            </button>
          )}
          {canCreateWorkflow(user) ? (
            <button
              type="button"
              onClick={() => navigate('/create-workflow')}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3C4249]"
            >
              <Plus size={16} />
              Create Workflow
            </button>
          ) : null}
        </div>
      </header>

      <section className="bento-grid grid-cols-1 gap-4 xl:grid-cols-12">
        <StatCard
          title="Active Workflows"
          value="98.6%"
          subtitle="Reliable execution across enterprise pipelines"
          icon={<CheckCircle2 size={18} />}
          className="xl:col-span-3"
        />
        <StatCard
          title="Today's Performance"
          value="86%"
          subtitle="Average SLA compliance in the last 24h"
          icon={<ChartSpline size={18} />}
          className="xl:col-span-3"
        />
        <StatCard
          title="Errors Today"
          value="6"
          subtitle="Escalated scenarios under active resolution"
          icon={<AlertTriangle size={18} />}
          className="xl:col-span-3"
        />

        <article className="enterprise-card xl:col-span-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-medium text-[#292D32]">Automation Flow Performance</h2>
              <p className="text-base text-[#5E6672]">
                Manage, monitor, and scale enterprise connections and data workflows across all business units.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-semibold text-[#5E6672]">
              <Network size={12} />
              Weekly Trend
            </span>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <svg viewBox="0 0 100 100" className="h-72 w-full">
              <defs>
                <linearGradient id="flowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D0FFA4" />
                  <stop offset="100%" stopColor="#292D32" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="0.6"
                points="0,90 100,90"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="0.6"
                points="0,70 100,70"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="0.6"
                points="0,50 100,50"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="0.6"
                points="0,30 100,30"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="none"
                stroke="url(#flowLine)"
                strokeWidth="1.8"
                points={points}
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </article>

        <article className="enterprise-card xl:col-span-4 p-6">
          <h2 className="text-2xl font-medium text-[#292D32]">Integrated Apps</h2>
          <p className="mt-1 text-base text-[#5E6672]">Connected services powering enterprise automations.</p>

          <div className="mt-5 space-y-3">
            <IntegratedAppRow
              icon={<Mail size={16} />}
              name="Gmail"
              detail="18 monitored inbox routes"
            />
            <IntegratedAppRow
              icon={<MessageSquare size={16} />}
              name="Slack"
              detail="11 active notification channels"
            />
            <IntegratedAppRow
              icon={<Network size={16} />}
              name="Notion"
              detail="9 synchronized workspace databases"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/app-connections')}
             className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#292D32] transition-colors hover:border-[#D0FFA4] hover:bg-[#F6F5FA]"
          >
            See All
            <ArrowRight size={14} />
          </button>
        </article>
      </section>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, className = '' }) => (
  <article className={`enterprise-card p-5 ${className}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-base text-[#5E6672]">{title}</p>
        <p className="mt-2 text-[36px] font-semibold leading-none text-[#292D32]">{value}</p>
        <p className="mt-2 text-sm text-[#8D95A1]">{subtitle}</p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D0FFA4] text-[#292D32]">
        {icon}
      </span>
    </div>
  </article>
);

const IntegratedAppRow = ({ icon, name, detail }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D0FFA4] text-[#292D32]">{icon}</span>
    <div>
      <p className="text-base font-medium text-[#292D32]">{name}</p>
      <p className="text-sm text-[#5E6672]">{detail}</p>
    </div>
  </div>
);

export default Dashboard;
