import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  GitBranch,
  Plus,
  Search,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import WorkflowCard from '../components/workflow/WorkflowCard';
import WorkflowCardSkeleton from '../components/workflow/WorkflowCardSkeleton';
import useWorkflowStore from '../stores/workflowStore';
import ExecuteWorkflowModal from '../components/workflow/ExecuteWorkflowModal';
import { useAuthStore } from '../stores/authStore';
import {
  canCreateWorkflow,
  canDeleteWorkflow,
  canEditWorkflow,
  canExecuteWorkflow,
  isViewer,
} from '../utils/rbac';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'INACTIVE', label: 'Inactive' },
];

const useDebouncedValue = (value, delay = 250) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
};

const formatDate = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
};

const Workflows = () => {
  const navigate = useNavigate();
  const {
    workflows,
    deleteWorkflow,
    executeWorkflow,
    fetchWorkflows,
    isLoading,
    error,
    toggleWorkflowStatus,
    clearError,
  } = useWorkflowStore();

  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [actionWorkflowId, setActionWorkflowId] = React.useState(null);
  const [deleteModal, setDeleteModal] = React.useState({ open: false, workflow: null });
  const [executeModal, setExecuteModal] = React.useState({ open: false, workflow: null });
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const showToast = React.useCallback((message, tone = 'info') => {
    setToast({ open: true, message, tone });
  }, []);

  const closeToast = React.useCallback(() => {
    setToast((current) => ({ ...current, open: false }));
  }, []);

  const { user } = useAuthStore();

  const refreshWorkflows = React.useCallback(async () => {
    try {
      await fetchWorkflows();
    } catch (err) {
      showToast(err.message || 'Failed to fetch workflows', 'error');
    } finally {
      setHasLoadedOnce(true);
    }
  }, [fetchWorkflows, showToast]);

  React.useEffect(() => {
    refreshWorkflows();
  }, [refreshWorkflows]);

  React.useEffect(() => () => clearError?.(), [clearError]);

  const filteredWorkflows = React.useMemo(() => {
    let result = Array.isArray(workflows) ? workflows : [];

    if (statusFilter !== 'ALL') {
      result = result.filter((workflow) => workflow.status === statusFilter);
    }

    const query = debouncedSearchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((workflow) => workflow.name?.toLowerCase().includes(query));
    }

    return result;
  }, [debouncedSearchQuery, statusFilter, workflows]);

  const stats = React.useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter((w) => w.status === 'ACTIVE').length;
    const executions = workflows.reduce((acc, w) => acc + (w.executionCount || 0), 0);

    return { total, active, executions };
  }, [workflows]);

  const totalPages = Math.ceil(filteredWorkflows.length / 6);

  const displayedWorkflows = React.useMemo(() => {
    const start = (currentPage - 1) * 6;
    return filteredWorkflows.slice(start, start + 6);
  }, [filteredWorkflows, currentPage]);

  const handleDeleteWorkflow = async () => {
    const workflowId = deleteModal.workflow?.id;
    if (!workflowId) return;

    setActionWorkflowId(workflowId);
    try {
      await deleteWorkflow(workflowId);
      setDeleteModal({ open: false, workflow: null });
      showToast('Workflow deleted successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete workflow', 'error');
    } finally {
      setActionWorkflowId(null);
    }
  };

  const handleToggleStatus = async (workflow) => {
    setActionWorkflowId(workflow.id);
    try {
      await toggleWorkflowStatus(workflow.id);
      showToast(
        workflow.status === 'ACTIVE' ? 'Workflow paused successfully.' : 'Workflow resumed successfully.',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionWorkflowId(null);
    }
  };

  const handleExecuteWorkflow = async (input) => {
    const workflow = executeModal.workflow;
    if (!workflow) return;

    setActionWorkflowId(workflow.id);
    try {
      await executeWorkflow(workflow.id, input);
      setExecuteModal({ open: false, workflow: null });
      showToast('Workflow execution started.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to execute workflow', 'error');
    } finally {
      setActionWorkflowId(null);
    }
  };

  return (
    <div className="space-y-5 font-urbanist">
      {isViewer(user) ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#5C5C5C]">
          Read only mode is active. Workflow editing controls are disabled for viewer accounts.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">Workflows</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            Build and operate enterprise automations with controlled branching, retry logic, and execution history.
          </p>
        </div>
        {canCreateWorkflow(user) && (
          <button
            type="button"
            onClick={() => navigate('/create-workflow')}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
          >
            <Plus size={16} />
            Create Workflow
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="enterprise-card border-[#D0FFA4] p-5">
          <p className="text-sm text-[#5C5C5C]">Total Workflows</p>
          <p className="mt-2 text-3xl font-bold text-[#292D32]">{stats.total}</p>
        </div>
        <div className="enterprise-card p-5">
          <p className="text-sm text-[#5C5C5C]">Active Scenarios</p>
          <p className="mt-2 text-3xl font-bold text-[#292D32]">{stats.active}</p>
        </div>
        <div className="enterprise-card p-5">
          <p className="text-sm text-[#5C5C5C]">Execution Count</p>
          <p className="mt-2 text-3xl font-bold text-[#292D32]">{stats.executions.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows"
            className="w-full rounded-2xl border border-[#E2E8F0] bg-white py-3 pl-10 pr-4 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status.key}
              type="button"
              onClick={() => setStatusFilter(status.key)}
              className={[
                'rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
                statusFilter === status.key
                  ? 'border-[#292D32] bg-[#292D32] text-white'
                  : 'border-[#E2E8F0] bg-white text-[#5C5C5C] hover:border-[#D0FFA4]',
              ].join(' ')}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {error && workflows.length === 0 && !isLoading ? (
        <section className="enterprise-card p-10 text-center">
          <AlertCircle size={28} className="mx-auto text-[#EF4444]" />
          <h3 className="mt-3 text-lg font-semibold text-[#292D32]">Failed to load workflows</h3>
          <p className="mt-2 text-sm text-[#5C5C5C]">{error}</p>
          <button
            type="button"
            onClick={refreshWorkflows}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3C4249]"
          >
            Retry
          </button>
        </section>
      ) : !hasLoadedOnce && isLoading ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <WorkflowCardSkeleton key={`skeleton-${index}`} />
          ))}
        </section>
      ) : filteredWorkflows.length === 0 ? (
        <section className="enterprise-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#D0FFA4]">
            <GitBranch size={24} className="text-[#292D32]" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#292D32]">No workflows found</h3>
          <p className="mt-2 text-sm text-[#5C5C5C]">
            {workflows.length === 0
              ? 'Create your first workflow to get started with automation.'
              : 'No workflow matches your current search/filter.'}
          </p>
          {canCreateWorkflow(user) ? (
            <button
              type="button"
              onClick={() => navigate('/create-workflow')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3C4249]"
            >
              <Plus size={16} />
              Create Workflow
            </button>
          ) : null}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              actionInProgress={actionWorkflowId === workflow.id}
              onView={() => navigate(`/workflow/${workflow.id}`)}
              onEdit={canEditWorkflow(workflow, user) ? () => navigate(`/create-workflow?id=${workflow.id}`) : undefined}
              onExecute={canExecuteWorkflow(workflow, user) ? () => setExecuteModal({ open: true, workflow }) : undefined}
              onToggle={canEditWorkflow(workflow, user) ? () => handleToggleStatus(workflow) : undefined}
              onDelete={canDeleteWorkflow(workflow, user) ? () => setDeleteModal({ open: true, workflow }) : undefined}
              formatDate={(w) => formatDate(w.createdAt || w.updatedAt || w.lastExecution || null)}
            />
          ))}
        </section>
      )}

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, workflow: null })} title="Delete Workflow">
        <p className="mb-5 text-sm text-[#5C5C5C]">
          Delete <strong className="text-[#292D32]">{deleteModal.workflow?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteModal({ open: false, workflow: null })}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteWorkflow}
            disabled={actionWorkflowId === deleteModal.workflow?.id}
            className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-70"
          >
            {actionWorkflowId === deleteModal.workflow?.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      <ExecuteWorkflowModal 
        isOpen={executeModal.open} 
        onClose={() => setExecuteModal({ open: false, workflow: null })}
        onExecute={handleExecuteWorkflow}
        workflow={executeModal.workflow}
        workflowName={executeModal.workflow?.name}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={closeToast}
      />
    </div>
  );
};

export default Workflows;
