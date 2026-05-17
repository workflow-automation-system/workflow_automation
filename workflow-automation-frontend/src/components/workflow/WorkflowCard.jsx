import React from 'react';
import {
  ArrowRight,
  Clock,
  Edit,
  Eye,
  GitBranch,
  MoreVertical,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';

const isActiveWorkflow = (workflow) => workflow?.status === 'ACTIVE';

const getNodeCount = (workflow) => {
  if (Number.isFinite(workflow?.nodeCount)) {
    return workflow.nodeCount;
  }
  return Array.isArray(workflow?.nodes) ? workflow.nodes.length : 0;
};

const WorkflowCard = ({
  workflow,
  actionInProgress,
  onView,
  onEdit,
  onExecute,
  onToggle,
  onDelete,
  formatDate,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const isActive = isActiveWorkflow(workflow);
  const nodeCount = getNodeCount(workflow);

  return (
    <article className="enterprise-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#D0FFA4]">
              <GitBranch size={18} className="text-[#292D32]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#292D32]">{workflow.name}</p>
              <span
                className={[
                  'inline-flex rounded-full px-2 py-1 text-[11px] font-semibold',
                  isActive
                    ? 'bg-[#D0FFA4] text-[#292D32]'
                    : 'border border-[#E2E8F0] bg-white text-[#5C5C5C]',
                ].join(' ')}
              >
                {isActive ? 'Running' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              disabled={actionInProgress}
              onClick={() => setShowMenu((prev) => !prev)}
              className="rounded-lg p-1.5 text-[#5C5C5C] hover:bg-white"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onView();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#292D32] hover:bg-[#F6F5FA]"
                >
                  <Eye size={14} />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#292D32] hover:bg-[#F6F5FA]"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onExecute();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#292D32] hover:bg-[#F6F5FA]"
                >
                  <Play size={14} />
                  Execute
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggle();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#292D32] hover:bg-[#F6F5FA]"
                >
                  {isActive ? <Pause size={14} /> : <Play size={14} />}
                  {isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-[#5C5C5C]">
          {workflow.description || 'No description has been provided for this workflow.'}
        </p>

        <div className="mt-4 flex items-center justify-between text-xs text-[#5C5C5C]">
          <span className="inline-flex items-center gap-1">
            <GitBranch size={12} />
            {nodeCount} nodes
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {formatDate(workflow)}
          </span>
        </div>
      </div>

      <div className="border-t border-[#E2E8F0] px-5 py-3">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#292D32] hover:text-[#3C4249]"
        >
          Open Workflow
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
};

export default WorkflowCard;
