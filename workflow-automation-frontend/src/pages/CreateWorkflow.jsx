import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  addEdge,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, FileText, Play, Save, ShieldCheck, SplitSquareVertical } from 'lucide-react';
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
} from '../services/workflowConverter';
import useWorkflowStore from '../stores/workflowStore';

const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE'];

const CreateWorkflow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');

  const { createWorkflow, fetchWorkflowById, getWorkflowById, updateWorkflow } = useWorkflowStore();

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = React.useState(false);
  const [loadingConfiguration, setLoadingConfiguration] = React.useState(false);
  const [workflowConfiguration, setWorkflowConfiguration] = React.useState(
      FALLBACK_WORKFLOW_CONFIGURATION
  );
  const [reactFlowInstance, setReactFlowInstance] = React.useState(null);
  const [toast, setToast] = React.useState({ open: false, message: '', tone: 'info' });

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
      [setEdges]
  );

  const onDrop = React.useCallback(
      (event) => {
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
      [reactFlowInstance, setNodes, workflowConfiguration]
  );

  const handleSave = async () => {
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

  const handleDeleteNode = () => {
    if (!selectedNode) return;

    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNode.id));
    setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
    );
    setSelectedNode(null);
  };

  const handleUpdateNodeData = (nodeId, updatedData) => {
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
        <header className="enterprise-card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                  type="button"
                  onClick={() => navigate('/workflows')}
                  className="rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#5C5C5C] hover:border-[#D0FFA4]"
                  aria-label="Back to workflows"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#D0FFA4]">
                <Play size={16} className="text-[#292D32]" />
              </div>

              <div>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Untitled Workflow"
                    className="w-full bg-transparent text-lg font-semibold text-[#292D32] outline-none placeholder:text-[#8A8A8A]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value.toUpperCase())}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-semibold text-[#292D32]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>

              <button
                  type="button"
                  onClick={() => navigate('/workflows')}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
              >
                Cancel
              </button>

              <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loadingWorkflow || loadingConfiguration}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#292D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save Workflow'}
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[290px_1fr_320px]">
          <NodeSidebar workflowConfiguration={workflowConfiguration} />

          <section className="enterprise-card flex min-h-[520px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F6F5FA] px-4 py-3">
              <div className="flex items-center gap-2">
                <SplitSquareVertical size={16} className="text-[#292D32]" />
                <p className="text-sm font-semibold text-[#292D32]">
                  Workflow Canvas
                </p>
              </div>
              <span className="text-xs text-[#5C5C5C]">
              {nodes.length} nodes, {edges.length} connections
            </span>
            </div>

            <div className="canvas-grid-bg relative flex-1 bg-white">
              <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onInit={setReactFlowInstance}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, node) => setSelectedNode(node)}
                  onPaneClick={() => setSelectedNode(null)}
                  onDrop={onDrop}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  nodeTypes={nodeTypesMap}
                  fitView
                  defaultEdgeOptions={{
                    style: { stroke: '#D0FFA4', strokeWidth: 2.2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#D0FFA4' },
                  }}
              >
                <Background gap={24} color="#E2E8F0" />
                <Controls />
                <MiniMap nodeColor="#D0FFA4" maskColor="rgba(246, 245, 250, 0.7)" />
              </ReactFlow>

              <button
                  type="button"
                  className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#292D32] shadow-sm transition-colors hover:border-[#D0FFA4]"
              >
                AI + Help
              </button>

              <div className="absolute bottom-4 right-4 space-y-2">
                <div className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs shadow-sm">
                  <p className="font-semibold text-[#292D32]">Scenario 1</p>
                  <p className="text-[#5E6672]">Data mapping healthy</p>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs shadow-sm">
                  <p className="font-semibold text-[#292D32]">Scenario 2</p>
                  <p className="text-[#5E6672]">Fallback branch standby</p>
                </div>
              </div>
            </div>
          </section>

          {selectedNode ? (
              <ConfigPanel
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                  onUpdate={handleUpdateNodeData}
                  onDelete={handleDeleteNode}
                  workflowConfiguration={workflowConfiguration}
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

        <footer className="enterprise-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm text-[#5C5C5C]">
            <FileText size={15} className="text-[#292D32]" />
            Workflow Description
          </div>

          <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe business intent, owner, and fallback behavior..."
              className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
          />

          <div className="inline-flex items-center gap-1 rounded-full bg-[#D0FFA4] px-3 py-1 text-xs font-semibold text-[#292D32]">
            <ShieldCheck size={12} />
            Enterprise-ready
          </div>
        </footer>

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
      </div>
  );
};

export default CreateWorkflow;
