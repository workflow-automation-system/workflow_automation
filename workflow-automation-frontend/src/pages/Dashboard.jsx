import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ChartSpline,
  CheckCircle2,
  Mail,
  MessageSquare,
  Network,
  Plus,
  Eye,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import useWorkflowStore from '../stores/workflowStore';
import { canCreateWorkflow, getRole } from '../utils/rbac';



const roleBanners = {
  ADMIN: null,
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
  const { workflows, isLoading, fetchWorkflows } = useWorkflowStore();
  const role = getRole(user);
  const banner = roleBanners[role];


  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const recentActivity = React.useMemo(() => {
    let allExecutions = [];
    if (workflows) {
      workflows.forEach(w => {
        if (w.executions) {
          w.executions.forEach(ex => {
            allExecutions.push({
              ...ex,
              workflowName: w.name || 'Unnamed Workflow'
            });
          });
        }
      });
    }
    // Sort by startedAt descending
    allExecutions.sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
    return allExecutions.slice(0, 5); // Take top 5
  }, [workflows]);

  // Compute metrics
  const activeWorkflowsCount = workflows.filter(w => w.status === 'ACTIVE').length;
  const activeWorkflowsPercentage = workflows.length > 0 ? `${Math.round((activeWorkflowsCount / workflows.length) * 100)}%` : '0%';
  const todaySlaRate = '99.9%'; // For demo purposes

  let todayFailedCount = 0;
  workflows.forEach(w => {
    (w.executions || []).forEach(ex => {
      if (ex.status === 'FAILED' || ex.status === 'ERROR') todayFailedCount++;
    });
  });

  // 5. Integrated Apps node scan
  const gmailCount = workflows.reduce((acc, w) =>
    acc + (w.nodes || []).filter(n => n.type === 'gmail' || n.type === 'email').length, 0
  );
  const slackCount = workflows.reduce((acc, w) =>
    acc + (w.nodes || []).filter(n => n.type === 'slack').length, 0
  );
  const notionCount = workflows.reduce((acc, w) =>
    acc + (w.nodes || []).filter(n => n.type === 'notion').length, 0
  );

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center font-urbanist">
        <Loader2 className="animate-spin text-[#292D32] mb-3" size={32} />
        <p className="text-sm text-[#5C5C5C]">Loading workspace statistics...</p>
      </div>
    );
  }

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
          value={activeWorkflowsPercentage}
          subtitle="Reliable execution across enterprise pipelines"
          icon={<CheckCircle2 size={18} />}
          className="xl:col-span-3"
        />
        <StatCard
          title="Today's Performance"
          value={todaySlaRate}
          subtitle="Average SLA compliance in the last 24h"
          icon={<ChartSpline size={18} />}
          className="xl:col-span-3"
        />
        <StatCard
          title="Errors Today"
          value={String(todayFailedCount)}
          subtitle="Escalated scenarios under active resolution"
          icon={<AlertTriangle size={18} />}
          className="xl:col-span-3"
        />

        <article className="enterprise-card xl:col-span-8 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-medium text-[#292D32]">Recent Activity Feed</h2>
              <p className="text-base text-[#5E6672]">
                Monitor the latest workflow executions across your workspace.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-semibold text-[#5E6672]">
              <Activity size={12} />
              Live Updates
            </span>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#FAFAFC] p-2">
            {recentActivity.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center text-center">
                <p className="text-sm text-[#5E6672]">No recent activity found. Run a workflow to see it here.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between p-4 bg-white first:rounded-t-xl last:rounded-b-xl hover:bg-[#F8FFEE] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activity.status === 'SUCCESS' ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-red-100 text-red-600'}`}>
                        {activity.status === 'SUCCESS' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#292D32]">{activity.workflowName}</p>
                        <p className="text-sm text-[#5E6672]">
                          {activity.startedAt ? new Date(activity.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${activity.status === 'SUCCESS' ? 'border-[#D0FFA4] bg-[#F8FFEE] text-[#292D32]' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {activity.status === 'SUCCESS' ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        <article className="enterprise-card xl:col-span-4 p-6">
          <h2 className="text-2xl font-medium text-[#292D32]">Integrated Apps</h2>
          <p className="mt-1 text-base text-[#5E6672]">Connected services powering enterprise automations.</p>

          <div className="mt-5 space-y-3">
            <IntegratedAppRow
              icon={<Mail size={16} />}
              name="Gmail"
              detail={`${gmailCount} active automation route${gmailCount === 1 ? '' : 's'}`}
            />
            <IntegratedAppRow
              icon={<MessageSquare size={16} />}
              name="Slack"
              detail={`${slackCount} active notification channel${slackCount === 1 ? '' : 's'}`}
            />
            <IntegratedAppRow
              icon={<Network size={16} />}
              name="Notion"
              detail={`${notionCount} database synchronization${notionCount === 1 ? '' : 's'}`}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/app-connections')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#292D32] transition-colors hover:border-[#D0FFA4] hover:bg-[#E2E8F0]"
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
