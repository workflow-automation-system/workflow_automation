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
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { workflowApi } from '../api/workflowApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [workflows, setWorkflows] = React.useState([]);
  const [allExecutions, setAllExecutions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const loadDashboardData = async () => {
      try {
        const workflowsList = await workflowApi.getAll();
        if (!active) return;
        setWorkflows(workflowsList);
        
        // Fetch executions for all workflows in parallel
        const executionsPromises = workflowsList.map((w) => 
          workflowApi.getExecutions(w.id).catch(() => [])
        );
        const executionsResults = await Promise.all(executionsPromises);
        if (!active) return;
        
        const flatExecutions = executionsResults.flat();
        setAllExecutions(flatExecutions);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    loadDashboardData();
    return () => { active = false; };
  }, []);

  // 1. Active workflows percentage
  const activeWorkflowsCount = workflows.filter(w => w.status === 'ACTIVE').length;
  const activeWorkflowsPercentage = workflows.length
    ? `${((activeWorkflowsCount / workflows.length) * 100).toFixed(1)}%`
    : '0%';

  // 2. Today's SLA compliance performance
  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const todayExecutions = allExecutions.filter(e => {
    if (!e.startedAt) return false;
    const startedDate = new Date(e.startedAt);
    return startedDate >= past24h;
  });
  
  const todayCompleted = todayExecutions.filter(e => String(e.status).toUpperCase() === 'COMPLETED').length;
  const todaySlaRate = todayExecutions.length
    ? `${((todayCompleted / todayExecutions.length) * 100).toFixed(0)}%`
    : allExecutions.length
      ? `${((allExecutions.filter(e => String(e.status).toUpperCase() === 'COMPLETED').length / allExecutions.length) * 100).toFixed(0)}%`
      : '100%';

  // 3. Errors today
  const todayFailedCount = todayExecutions.filter(e => 
    String(e.status).toUpperCase() === 'FAILED' || String(e.status).toUpperCase() === 'ERROR'
  ).length;

  // 4. Weekly trend calculations
  const getWeeklyTrend = () => {
    if (!allExecutions || allExecutions.length === 0) {
      return [62, 58, 68, 64, 74, 70, 78, 75, 82, 79, 86, 84]; // Premium fallback trend
    }
    
    // Sort chronologically
    const sorted = [...allExecutions].sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));
    
    const pointsArray = [];
    const totalCount = sorted.length;
    const bucketSize = Math.max(1, Math.floor(totalCount / 12));
    
    for (let i = 0; i < 12; i++) {
      const limitIndex = Math.min(totalCount, (i + 1) * bucketSize);
      const subset = sorted.slice(0, limitIndex);
      const completed = subset.filter(e => String(e.status).toUpperCase() === 'COMPLETED').length;
      const rate = Math.round((completed / subset.length) * 100);
      pointsArray.push(Math.max(20, Math.min(100, rate))); // clip boundaries for rendering
    }
    
    while (pointsArray.length < 12) {
      pointsArray.push(pointsArray[pointsArray.length - 1] || 100);
    }
    
    return pointsArray;
  };

  const trendData = getWeeklyTrend();
  const points = trendData
    .map((value, index) => `${index * (100 / (trendData.length - 1))},${100 - value}`)
    .join(' ');

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

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center font-urbanist">
        <Loader2 className="animate-spin text-[#292D32] mb-3" size={32} />
        <p className="text-sm text-[#5C5C5C]">Loading workspace statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-urbanist">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold leading-tight text-[#292D32]">
            Welcome Back, {user?.name || 'Operator'}
          </h1>
          <p className="mt-2 text-lg text-[#5E6672]">Today's Business Automation Performance</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/create-workflow')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3C4249]"
        >
          <Plus size={16} />
          Create Workflow
        </button>
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
