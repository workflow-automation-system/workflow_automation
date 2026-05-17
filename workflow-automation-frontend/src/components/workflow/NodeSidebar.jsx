import React from 'react';
import {
  BookCopy,
  Bot,
  Clock,
  GitBranch,
  Globe,
  Mail,
  MessageSquare,
  Sheet,
  ShieldAlert,
  Sparkles,
  Table2,
  Zap,
} from 'lucide-react';
import { FALLBACK_WORKFLOW_CONFIGURATION } from '../../services/workflowConverter';

const iconMap = {
  Zap,
  GitBranch,
  Table2,
  ShieldAlert,
  BookCopy,
  Sheet,
  Bot,
  MessageSquare,
  Mail,
  Globe,
  Clock,
};

const getNodeColor = (nodeDefinition) => nodeDefinition?.color || '#D0FFA4';

const NodeSidebar = ({ workflowConfiguration }) => {
  const nodeFunctions =
    Array.isArray(workflowConfiguration?.functions) && workflowConfiguration.functions.length > 0
      ? workflowConfiguration.functions
      : FALLBACK_WORKFLOW_CONFIGURATION.functions;

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="enterprise-card h-full w-full min-w-[270px] max-w-[290px] overflow-hidden">
      <div className="border-b border-[#E2E8F0] p-5">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#292D32]" />
          <h3 className="text-sm font-semibold text-[#292D32]">Entities & Functions</h3>
        </div>
        <p className="text-xs text-[#5C5C5C]">
          Drag backend-defined functions into the canvas to compose enterprise automation flows.
        </p>
      </div>

      <div className="max-h-[calc(100vh-18rem)] space-y-2 overflow-y-auto p-4">
        {nodeFunctions.map((node) => {
          const Icon = iconMap[node.icon] || Zap;
          return (
            <button
              key={node.key}
              type="button"
              draggable
              onDragStart={(event) => onDragStart(event, node.key)}
              className="flex w-full cursor-grab items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 text-left transition-colors hover:border-[#D0FFA4]"
            >
              <span
                className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0]"
                style={{ backgroundColor: getNodeColor(node) }}
              >
                <Icon size={16} className="text-[#292D32]" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#292D32]">{node.label}</span>
                <span className="mt-0.5 block text-xs text-[#5C5C5C]">
                  {node.description || node.entity}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#E2E8F0] p-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-xs text-[#5C5C5C]">
          Functions and entities are loaded from backend workflow configuration.
        </div>
      </div>
    </aside>
  );
};

export default NodeSidebar;
