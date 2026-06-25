import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Background, Controls, MarkerType, MiniMap, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Pause,
  Play,
  Trash2,
  Workflow,
  Eye,
  Loader2,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import CustomNode from '../components/workflow/nodes/CustomNode';
import PermissionManager from '../components/workflow/PermissionManager';
import useWorkflowStore from '../stores/workflowStore';
import ExecuteWorkflowModal from '../components/workflow/ExecuteWorkflowModal';
import ExecutionStepsModal from '../components/workflow/ExecutionStepsModal';
import { useAuthStore } from '../stores/authStore';
import {
  canDeleteWorkflow,
  canEditWorkflow,
  canExecuteWorkflow,
} from '../utils/rbac';
import { downloadWorkflowJson } from '../services/workflowImportExport';
const formatDate = (value) => {
  if (!value) return 'Never';
  let date;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    date = new Date(year, month - 1, day, hour, minute, second);
  } else {
    date = new Date(value);
  }
  return Number.isNaN(date.getTime()) ? 'Never' : date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const WorkflowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    workflows,
    executions,
    executionSteps,
    deleteWorkflow,
    executeWorkflow,
    fetchExecutions,
    fetchWorkflowById,
    fetchExecutionSteps,
    toggleWorkflowStatus,
    isLoading,
  } = useWorkflowStore();

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showExecuteModal, setShowExecuteModal] = React.useState(false);
  const [showStepsModal, setShowStepsModal] = React.useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = React.useState(null);
  const [loadingWorkflow, setLoadingWorkflow] = React.useState(false);
  const [loadingExecutions, setLoadingExecutions] = React.useState(false);
  const [action, setAction] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });
  const { user } = useAuthStore();

  React.useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  const workflow = React.useMemo(
    () => workflows.find((item) => String(item.id) === String(id)),
    [id, workflows]
  );

  const showToast = React.useCallback((message, tone = 'info') => {
    setToast({ open: true, message, tone });
  }, []);

  const refreshExecutions = React.useCallback(async () => {
    if (!id) return;

    setLoadingExecutions(true);
    try {
      await fetchExecutions(id);
    } catch (err) {
      showToast(err.message || 'Failed to load execution history', 'error');
    } finally {
      setLoadingExecutions(false);
    }
  }, [fetchExecutions, id, showToast]);

  React.useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!id) return;

      setLoadingWorkflow(true);
      try {
        await fetchWorkflowById(id);
        await fetchExecutions(id);
      } catch (err) {
        if (!cancelled) {
          showToast(err.message || 'Failed to load workflow data', 'error');
        }
      } finally {
        if (!cancelled) {
          setLoadingWorkflow(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [fetchExecutions, fetchWorkflowById, id, showToast]);

  const isActive = workflow?.status === 'ACTIVE';

  const totalPages = Math.ceil(executions.length / 4);
  const displayedExecutions = React.useMemo(() => {
    const start = (currentPage - 1) * 4;
    return executions.slice(start, start + 4);
  }, [executions, currentPage]);

  const nodes = React.useMemo(() => (workflow?.nodes || []).map((node) => ({
    ...node,
    data: {
      ...node.data,
      label: node.data?.label || node.type,
    },
  })), [workflow?.nodes]);

  const nodeTypesMap = React.useMemo(() => nodes.reduce(
    (accumulator, node) => ({
      ...accumulator,
      [node.type]: CustomNode,
    }),
    { trigger: CustomNode }
  ), [nodes]);

  const edges = React.useMemo(() => (workflow?.edges || []).map((edge) => ({
    ...edge,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#D0FFA4' },
    style: { stroke: '#D0FFA4', strokeWidth: 2.2 },
  })), [workflow?.edges]);

  const handleToggleStatus = async () => {
    if (!workflow) return;

    setAction('toggle');

    try {
      await toggleWorkflowStatus(workflow.id);
      showToast(
        workflow.status === 'ACTIVE' ? 'Workflow paused successfully.' : 'Workflow resumed successfully.',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to update workflow status', 'error');
    } finally {
      setAction('');
    }
  };

  const handleExecuteWorkflow = async (input) => {
    if (!workflow) return;

    setAction('execute');

    try {
      await executeWorkflow(workflow.id, input);
      await refreshExecutions();
      showToast('Workflow execution started.', 'success');
      // Refresh history after a short delay to allow backend to start processing
      setTimeout(() => fetchExecutions(workflow.id), 1000);
    } catch (err) {
      if (err.message && err.message.startsWith('MISSING_INTEGRATION:')) {
        showToast(
          <span>
            You are not connected to this app please go to page app connecion and add it <Link to="/integrations" className="underline font-medium text-blue-600">here</Link>
          </span>,
          'error'
        );
      } else {
        showToast(err.message || 'Failed to execute workflow', 'error');
      }
    } finally {
      setAction('');
    }
  };

  const handleViewSteps = async (executionId) => {
    setSelectedExecutionId(executionId);
    setShowStepsModal(true);
    await fetchExecutionSteps(executionId);
  };

  const handleDeleteWorkflow = async () => {
    if (!workflow) return;

    setAction('delete');

    try {
      await deleteWorkflow(workflow.id);
      showToast('Workflow deleted successfully.', 'success');
      navigate('/workflows');
    } catch (err) {
      showToast(err.message || 'Failed to delete workflow', 'error');
      setAction('');
    }
  };
  const handleExport = async () => {
    if (!workflow) return;

    try {
      let fullWorkflow = workflow;

      if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
        fullWorkflow = await fetchWorkflowById(workflow.id);
      }

      const fileName = downloadWorkflowJson(fullWorkflow || workflow);
      showToast(`Exported as ${fileName}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to export workflow', 'error');
    }
  };
  if (loadingWorkflow && !workflow) {
    return (
      <div className="enterprise-card flex h-72 flex-col items-center justify-center text-center font-urbanist">
        <Loader2 className="animate-spin text-[#292D32] mb-3" size={32} />
        <p className="text-sm text-[#5C5C5C]">Loading workflow details...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="enterprise-card flex h-72 flex-col items-center justify-center text-center font-urbanist">
        <Workflow size={28} className="text-[#5C5C5C]" />
        <h2 className="mt-3 text-lg font-semibold text-[#292D32]">Workflow not found</h2>
        <p className="mt-1 text-sm text-[#5C5C5C]">The requested workflow does not exist in your workspace.</p>
        <button
          type="button"
          onClick={() => navigate('/workflows')}
          className="mt-4 rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3C4249]"
        >
          Back to Workflows
        </button>
      </div>
    );
  }
  const canEdit = canEditWorkflow(workflow, user);
  const canDelete = canDeleteWorkflow(workflow, user);
  const canExecute = canExecuteWorkflow(workflow, user);

  return (
    <div className="space-y-5 font-urbanist">
      {workflow.readOnly ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#5C5C5C]">
          Read only mode is active for this workflow. Edit, delete, and builder mutations are blocked by RBAC.
        </div>
      ) : null}

      <header className="enterprise-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/workflows')}
              className="rounded-full bg-[#E2E8F0] p-2 text-[#5C5C5C] transition-colors hover:bg-[#CBD5E1]"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-[#292D32]">{workflow.name}</h1>
              <span
                className={[
                  'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  isActive
                    ? 'bg-[#D0FFA4] text-[#292D32]'
                    : 'bg-gray-100 text-[#5C5C5C]',
                ].join(' ')}
              >
                {isActive ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canExecute ? (
              <button
                type="button"
                onClick={() => setShowExecuteModal(true)}
                disabled={action !== ''}
                className="inline-flex items-center gap-2 rounded-lg bg-[#292D32] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
              >
                <Play size={14} />
                {action === 'execute' ? 'Executing...' : 'Execute'}
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={action !== ''}
                className={[
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60',
                  isActive
                    ? 'border border-[#E2E8F0] bg-white text-[#5C5C5C] hover:border-[#D0FFA4]'
                    : 'bg-[#D0FFA4] text-[#292D32] hover:bg-[#BDEB94]',
                ].join(' ')}
              >
                {isActive ? <Pause size={14} /> : <Play size={14} />}
                {isActive ? 'Disable' : 'Enable'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleExport}
              disabled={action !== ''}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-semibold text-[#292D32] hover:border-[#D0FFA4] disabled:opacity-60"
            >
              <Download size={14} />
              Export JSON
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/create-workflow?id=${workflow.id}`)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-semibold text-[#292D32] hover:border-[#D0FFA4]"
                >
                  <Edit size={14} />
                  Edit
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-[#EF4444] hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7 xl:col-span-8">
          <section className="enterprise-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-[#292D32]">Execution History</h2>
              </div>
            </div>

            {loadingExecutions && executions.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 size={20} className="mx-auto animate-spin text-[#5C5C5C]" />
                <p className="mt-2 text-sm text-[#5C5C5C]">Loading executions...</p>
              </div>
            ) : executions.length === 0 ? (
              <div className="p-8 text-center">
                <Clock size={20} className="mx-auto text-[#5C5C5C]" />
                <p className="mt-2 text-sm text-[#5C5C5C]">No executions recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E2E8F0]">
                  <thead className="bg-white">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-[#5C5C5C]">
                      <th className="px-5 py-3">Execution ID</th>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Finished At</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-[#FAFAFC]">
                    {displayedExecutions.map((execution) => {
                      const executionStatus = String(execution.status || '').toLowerCase();
                      const isSuccess = executionStatus === 'completed';
                      const isRunning = executionStatus === 'running';

                      return (
                        <tr key={execution.id} className="hover:bg-white transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-[#292D32]">#{execution.id}</td>
                          <td className="px-5 py-3 text-sm text-[#5C5C5C]">{formatDate(execution.startedAt)}</td>
                          <td className="px-5 py-3">
                            <span
                              className={[
                                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                                isSuccess
                                  ? 'bg-[#D0FFA4] text-[#292D32]'
                                  : isRunning
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'border border-red-200 bg-red-50 text-[#EF4444]',
                              ].join(' ')}
                            >
                              {isSuccess ? <CheckCircle2 size={12} /> : isRunning ? <Loader2 size={12} className="animate-spin" /> : <AlertCircle size={12} />}
                              {execution.status || 'unknown'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-[#5C5C5C]">{execution.finishedAt ? formatDate(execution.finishedAt) : '-'}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleViewSteps(execution.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#292D32] hover:underline"
                            >
                              <Eye size={14} />
                              View Logs
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="border-t border-[#E2E8F0] bg-white">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="enterprise-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-[#292D32]">Workflow Canvas</h2>
              </div>
            </div>
            <div className="h-[250px] bg-[#FAFAFC]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypesMap}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background gap={24} color="#E2E8F0" variant="lines" />
                <Controls showInteractive={false} />
                <MiniMap nodeColor="#D0FFA4" maskColor="rgba(246, 245, 250, 0.7)" />
              </ReactFlow>
            </div>
          </section>
        </div>

        <div className="space-y-5 lg:col-span-5 xl:col-span-4">
          <section className="enterprise-card p-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#292D32]">About</h2>
            <p className="text-sm text-[#5C5C5C]">
              {workflow.description || 'No description available for this workflow.'}
            </p>
          </section>

          {workflow.canShare ? (
            <section className="enterprise-card overflow-hidden">
              <div className="border-b border-[#E2E8F0] px-5 py-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#292D32]">Access Control</h2>
              </div>
              <div className="p-5">
                <PermissionManager workflowId={workflow.id} canManagePermissions={workflow.canShare} />
              </div>
            </section>
          ) : null}
        </div>
      </div>
      <ExecuteWorkflowModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onExecute={handleExecuteWorkflow}
        workflow={workflow}
        workflowName={workflow.name}
      />

      <ExecutionStepsModal
        isOpen={showStepsModal}
        onClose={() => setShowStepsModal(false)}
        steps={executionSteps}
        executionId={selectedExecutionId}
        isLoading={isLoading}
      />

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Workflow">
        <p className="mb-5 text-sm text-[#5C5C5C]">
          Delete <strong className="text-[#292D32]">{workflow.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteWorkflow}
            disabled={action === 'delete'}
            className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-60"
          >
            {action === 'delete' ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      <Toast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </div>
  );
};

export default WorkflowDetail;