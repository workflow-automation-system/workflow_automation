import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, FileText, Play, Save, Sparkles } from 'lucide-react';
import ConfigPanel from '../components/workflow/ConfigPanel';
import NodeSidebar from '../components/workflow/NodeSidebar';
import CustomNode from '../components/workflow/nodes/CustomNode';
import Toast from '../components/ui/Toast';
import { generateId } from '../mock/data';
import { workflowApi } from '../api/workflowApi';
import {
  createNodeDataFromFunction,
  FALLBACK_WORKFLOW_CONFIGURATION,
  getFunctionDefinition,
  normalizeWorkflowConfiguration,
  normalizeWorkflow,
} from '../services/workflowConverter';
import AiGeneratorModal from '../components/workflow/AiGeneratorModal';
import { useAuthStore } from '../stores/authStore';
import useWorkflowStore from '../stores/workflowStore';
import { canCreateWorkflow, canEditWorkflow } from '../utils/rbac';

const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE'];

const CreateWorkflow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');
  const fromTemplate = searchParams.get('fromTemplate') === 'true';

  const { createWorkflow, fetchWorkflowById, getWorkflowById, updateWorkflow, deleteWorkflow } = useWorkflowStore();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [aiModalOpen, setAiModalOpen] = React.useState(false);

  const handleUseAiWorkflow = (aiWorkflow) => {
    const normalized = normalizeWorkflow(aiWorkflow, workflowConfiguration);
    setName(normalized.name);
    setDescription(normalized.description || '');
    setNodes(normalized.nodes || []);
    setEdges(normalized.edges || []);
    setAiModalOpen(false);
  };
  const [loadingWorkflow, setLoadingWorkflow] = React.useState(false);
  const [loadingConfiguration, setLoadingConfiguration] = React.useState(false);
  const [workflowConfiguration, setWorkflowConfiguration] = React.useState(
    FALLBACK_WORKFLOW_CONFIGURATION
  );
  const [reactFlowInstance, setReactFlowInstance] = React.useState(null);
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });
  const existingWorkflow = workflowId ? getWorkflowById(workflowId) : null;
  const isCreateMode = !workflowId;
  const canCreate = canCreateWorkflow(user);
  const editorReadOnly = workflowId ? Boolean(existingWorkflow && !canEditWorkflow(existingWorkflow, user)) : false;

  const showToast = React.useCallback((message, tone = 'info') => {
    setToast({ open: true, message, tone });
  }, []);

  const nodeTypesMap = React.useMemo(() => {
    const map = {};
    const configuredFunctions = Array.isArray(workflowConfiguration?.functions)
      ? workflowConfiguration.functions
      : [];

    configuredFunctions.forEach((item) => {
      if (item?.key) {
        map[item.key] = CustomNode;
      }
    });

    nodes.forEach((node) => {
      if (node?.type) {
        map[node.type] = CustomNode;
      }
    });

    if (!Object.keys(map).length) {
      map.trigger = CustomNode;
    }

    return map;
  }, [nodes, workflowConfiguration]);

  React.useEffect(() => {
    let cancelled = false;

    const loadConfiguration = async () => {
      setLoadingConfiguration(true);

      try {
        const configuration = await workflowApi.getConfiguration();

        if (!cancelled) {
          setWorkflowConfiguration(normalizeWorkflowConfiguration(configuration));
        }
      } catch (error) {
        if (!cancelled) {
          setWorkflowConfiguration(FALLBACK_WORKFLOW_CONFIGURATION);
          showToast('Using fallback workflow configuration.', 'info');
        }
      } finally {
        if (!cancelled) {
          setLoadingConfiguration(false);
        }
      }
    };

    loadConfiguration();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const hydrateNodeWithConfiguration = React.useCallback(
    (node) => {
      if (!node) return node;

      const functionDefinition =
        getFunctionDefinition(workflowConfiguration, node.data?.functionKey || node.type) ||
        getFunctionDefinition(FALLBACK_WORKFLOW_CONFIGURATION, node.type);

      if (!functionDefinition) return node;

      return {
        ...node,
        type: functionDefinition.key,
        data: createNodeDataFromFunction(functionDefinition, node.data || {}),
      };
    },
    [workflowConfiguration]
  );

  React.useEffect(() => {
    setNodes((currentNodes) => currentNodes.map((node) => hydrateNodeWithConfiguration(node)));

    setSelectedNode((currentNode) =>
      currentNode ? hydrateNodeWithConfiguration(currentNode) : currentNode
    );
  }, [hydrateNodeWithConfiguration, setNodes]);

  React.useEffect(() => {
    let cancelled = false;

    const loadWorkflow = async () => {
      if (!workflowId) return;

      setLoadingWorkflow(true);

      try {
        let existingWorkflow = getWorkflowById(workflowId);

        if (!existingWorkflow) {
          existingWorkflow = await fetchWorkflowById(workflowId);
        }

        if (!cancelled && existingWorkflow) {
          setName(existingWorkflow.name || '');
          setDescription(existingWorkflow.description || '');
          setStatus((existingWorkflow.status || 'ACTIVE').toUpperCase());

          setNodes(
            Array.isArray(existingWorkflow.nodes)
              ? existingWorkflow.nodes.map((node) => hydrateNodeWithConfiguration(node))
              : []
          );

          setEdges(
            Array.isArray(existingWorkflow.edges)
              ? existingWorkflow.edges
              : Array.isArray(existingWorkflow.connections)
                ? existingWorkflow.connections
                : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err.message || 'Failed to load workflow', 'error');
        }
      } finally {
        if (!cancelled) {
          setLoadingWorkflow(false);
        }
      }
    };

    loadWorkflow();

    return () => {
      cancelled = true;
    };
  }, [
    fetchWorkflowById,
    getWorkflowById,
    hydrateNodeWithConfiguration,
    workflowId,
    setEdges,
    setNodes,
    showToast,
  ]);

  const onConnect = React.useCallback(
    (connection) => {
      if (editorReadOnly) return;
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: generateId('edge'),
            source: String(connection.source),
            target: String(connection.target),
            markerEnd: { type: MarkerType.ArrowClosed, color: '#D0FFA4' },
            style: { stroke: '#D0FFA4', strokeWidth: 2.2 },
          },
          eds
        )
      );
    },
    [editorReadOnly, setEdges]
  );

  const onDrop = React.useCallback(
    (event) => {
      if (editorReadOnly) return;
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const template = getFunctionDefinition(workflowConfiguration, type);
      if (!template) return;

      setNodes((currentNodes) => [
        ...currentNodes,
        {
          id: generateId('node'),
          type: template.key,
          position,
          data: createNodeDataFromFunction(template, template.defaultData),
        },
      ]);
    },
    [editorReadOnly, reactFlowInstance, setNodes, workflowConfiguration]
  );

  const handleSave = async () => {
    if (isCreateMode && !canCreate) {
      showToast('Viewer accounts cannot create workflows.', 'error');
      return;
    }

    if (!isCreateMode && editorReadOnly) {
      showToast('You do not have permission to modify this workflow.', 'error');
      return;
    }

    const trimmedName = name.trim();
    const normalizedStatus = String(status || '').toUpperCase();

    if (!trimmedName) {
      showToast('Workflow name is required before saving.', 'error');
      return;
    }

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      showToast('Status must be ACTIVE or INACTIVE.', 'error');
      return;
    }

    setSaving(true);

    const payload = {
      name: trimmedName,
      description: description.trim(),
      status: normalizedStatus,
      nodes,
      edges,
    };

    try {
      if (workflowId) {
        await updateWorkflow(workflowId, payload);
      } else {
        await createWorkflow(payload);
      }

      showToast('Workflow saved successfully.', 'success');
      navigate('/workflows');
    } catch (err) {
      showToast(err.message || 'Failed to save workflow', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (fromTemplate && workflowId) {
      try {
        setSaving(true);
        await deleteWorkflow(workflowId);
        showToast('Template usage canceled.', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to clean up template draft.', 'error');
      } finally {
        setSaving(false);
        navigate('/templates');
      }
    } else {
      navigate('/workflows');
    }
  };

  const handleDeleteNode = () => {
    if (!selectedNode || editorReadOnly) return;

    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNode.id));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
    );
    setSelectedNode(null);
  };

  const handleUpdateNodeData = (nodeId, updatedData) => {
    if (editorReadOnly) return;
    const nextData = updatedData && typeof updatedData === 'object' ? updatedData : {};
    const nextNodeType = nextData.__nodeType;
    const sanitizedData = { ...nextData };
    delete sanitizedData.__nodeType;

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
            ...node,
            type: nextNodeType || node.type,
            data: { ...node.data, ...sanitizedData },
          }
          : node
      )
    );

    setSelectedNode((current) =>
      current?.id === nodeId
        ? {
          ...current,
          type: nextNodeType || current.type,
          data: { ...current.data, ...sanitizedData },
        }
        : current
    );
  };

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col gap-4 font-urbanist">
      {isCreateMode && !canCreate ? (
        <div className="enterprise-card p-5 text-sm text-[#5C5C5C]">
          Viewer accounts cannot create workflows. You can still open shared workflows in read-only mode from the workflow list.
        </div>
      ) : null}

      {editorReadOnly ? (
        <div className="enterprise-card p-5 text-sm text-[#5C5C5C]">
          Read only mode is active for this workflow. Drag-and-drop, node edits, and save actions are disabled by RBAC.
        </div>
      ) : null}

      <header className="enterprise-card flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#5C5C5C] hover:border-[#D0FFA4]"
              aria-label="Back to workflows"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#D0FFA4]">
              <Play size={16} className="text-[#292D32]" />
            </div>

            <div className="flex flex-1 flex-col justify-center min-w-[300px]">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!isCreateMode && editorReadOnly}
                placeholder="Untitled Workflow"
                className="w-full bg-transparent text-lg font-semibold text-[#292D32] outline-none placeholder:text-[#8A8A8A]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D0FFA4] px-4 py-2 text-sm font-semibold text-[#292D32] hover:bg-[#BDEB94] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_0_12px_rgba(208,255,164,0.3)] focus:outline-none focus:ring-2 focus:ring-[#D0FFA4] focus:ring-offset-2"
            >
              <Sparkles size={14} className="text-[#292D32]" />
              Generate with AI
            </button>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value.toUpperCase())}
              disabled={!isCreateMode && editorReadOnly}
              className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#292D32]"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loadingWorkflow || loadingConfiguration || (isCreateMode ? !canCreate : editorReadOnly)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Workflow'}
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-[#E2E8F0]"></div>

        <div className="flex items-center gap-2 text-sm text-[#5C5C5C]">
          <FileText size={15} className="text-[#8A8A8A]" />
          <span className="font-semibold text-[#292D32]">Workflow Description</span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!isCreateMode && editorReadOnly}
            placeholder="Describe business intent, owner, and fallback behavior..."
            className="flex-1 bg-transparent text-sm text-[#292D32] focus:outline-none placeholder:text-[#8A8A8A] ml-2"
          />
        </div>
      </header>


      <div className="grid gap-4 xl:grid-cols-[290px_1fr_320px]">
        <NodeSidebar workflowConfiguration={workflowConfiguration} disabled={isCreateMode ? !canCreate : editorReadOnly} />

        <section className="enterprise-card flex min-h-[520px] flex-col overflow-hidden">


          <div className="canvas-grid-bg relative flex-1 bg-white">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onInit={setReactFlowInstance}
              onNodesChange={isCreateMode ? (canCreate ? onNodesChange : undefined) : (editorReadOnly ? undefined : onNodesChange)}
              onEdgesChange={isCreateMode ? (canCreate ? onEdgesChange : undefined) : (editorReadOnly ? undefined : onEdgesChange)}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              onDrop={onDrop}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = (isCreateMode ? canCreate : !editorReadOnly) ? 'move' : 'none';
              }}
              nodeTypes={nodeTypesMap}
              nodesDraggable={isCreateMode ? canCreate : !editorReadOnly}
              nodesConnectable={isCreateMode ? canCreate : !editorReadOnly}
              elementsSelectable
              fitView
              defaultEdgeOptions={{
                style: { stroke: '#D0FFA4', strokeWidth: 2.2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#D0FFA4' },
              }}
            >
              <Background gap={24} color="#E2E8F0" variant="lines" />
              <Controls />
            </ReactFlow>
          </div>
        </section>

        {selectedNode ? (
          <ConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={handleUpdateNodeData}
            onDelete={handleDeleteNode}
            workflowConfiguration={workflowConfiguration}
            readOnly={isCreateMode ? !canCreate : editorReadOnly}
          />
        ) : (
          <aside className="enterprise-card hidden p-4 text-sm text-[#5C5C5C] xl:block">
            <p className="text-sm font-semibold text-[#292D32]">Node Configuration</p>
            <p className="mt-2">
              Select a node to configure branching rules, data transformations, connector credentials, and error policy.
            </p>
          </aside>
        )}
      </div>

      {loadingWorkflow && workflowId ? (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#292D32] shadow-lg">
          Loading workflow...
        </div>
      ) : null}

      {loadingConfiguration ? (
        <div className="fixed bottom-16 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#292D32] shadow-lg">
          Syncing backend entities and functions...
        </div>
      ) : null}

      <Toast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />

      <AiGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onUseWorkflow={handleUseAiWorkflow}
      />
    </div>
  );
};

export default CreateWorkflow;
