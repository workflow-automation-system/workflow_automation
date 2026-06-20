import React from 'react';
import Modal from '../ui/Modal';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const NODE_META_FIELDS = new Set(['label', 'entity', 'functionKey', 'functionLabel', 'icon', 'color']);

const collectVariables = (value, variables = new Set()) => {
  if (typeof value === 'string') {
    for (const match of value.matchAll(VARIABLE_PATTERN)) {
      if (match[1]) {
        variables.add(match[1]);
      }
    }
    return variables;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectVariables(item, variables));
    return variables;
  }

  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectVariables(item, variables));
  }

  return variables;
};

const buildExecutionInput = (workflow) => {
  const variables = new Set();
  (workflow?.nodes || []).forEach((node) => collectVariables(node?.data, variables));

  const initialInput = Array.from(variables).reduce((accumulator, variableName) => {
    accumulator[variableName] = '';
    return accumulator;
  }, {});

  return JSON.stringify(initialInput, null, 2);
};

const formatNodeSettings = (node) => {
  const data = node?.data && typeof node.data === 'object' ? node.data : {};
  const settings = Object.entries(data)
    .filter(([key, value]) => !NODE_META_FIELDS.has(key) && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);

  return settings.length ? settings.join(', ') : 'No extra settings';
};

const ExecuteWorkflowModal = ({ isOpen, onClose, onExecute, workflow, workflowName }) => {
  const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : [];

  React.useEffect(() => {
    if (!isOpen) return;
  }, [isOpen, workflow]);

  const handleExecute = () => {
    onExecute({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Execute: ${workflowName}`}>
      <div className="space-y-4 font-urbanist">
        <p className="text-sm text-[#5C5C5C]">
          Review the workflow details below before executing it manually.
        </p>

        {nodes.length ? (
          <div className="space-y-2 rounded-xl border border-[#E2E8F0] bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
              Workflow Nodes
            </p>
            <div className="max-h-36 space-y-2 overflow-y-auto">
              {nodes.map((node, index) => (
                <div key={node.id || index} className="text-sm">
                  <p className="font-semibold text-[#292D32]">
                    {node.data?.label || node.name || `Node ${index + 1}`}
                  </p>
                  <p className="text-xs text-[#5C5C5C]">
                    {node.data?.functionLabel || node.data?.functionKey || node.type} - {formatNodeSettings(node)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="rounded-xl bg-[#292D32] px-6 py-2 text-sm font-semibold text-white hover:bg-[#3C4249]"
          >
            Run Workflow
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExecuteWorkflowModal;
