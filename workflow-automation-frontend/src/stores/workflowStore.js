import { create } from 'zustand';
import { workflowApi } from '../api/workflowApi';

const toErrorMessage = (error, fallback) => error?.message || fallback;

const normalizeStatus = (status) => (String(status || 'INACTIVE').toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');

const upsertWorkflow = (workflows, nextWorkflow) => {
  if (!nextWorkflow?.id) {
    return workflows;
  }

  const index = workflows.findIndex((workflow) => String(workflow.id) === String(nextWorkflow.id));
  if (index === -1) {
    return [nextWorkflow, ...workflows];
  }

  const cloned = [...workflows];
  cloned[index] = nextWorkflow;
  return cloned;
};

const useWorkflowStore = create((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  executions: [],
  executionSteps: [],
  isLoading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const workflows = await workflowApi.getAll();
      set({ workflows, isLoading: false });
      return workflows;
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to fetch workflows'), isLoading: false });
      throw error;
    }
  },

  getWorkflows: () => get().workflows,

  fetchWorkflowById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await workflowApi.getById(id);

      set((state) => ({
        workflows: workflow ? upsertWorkflow(state.workflows, workflow) : state.workflows,
        currentWorkflow: workflow,
        isLoading: false,
      }));

      return workflow;
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to fetch workflow'), isLoading: false });
      throw error;
    }
  },

  getWorkflowById: (id) => get().workflows.find((workflow) => String(workflow.id) === String(id)),

  setCurrentWorkflow: (workflow) => {
    set({ currentWorkflow: workflow });
  },

  createWorkflow: async (workflowData) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await workflowApi.create(workflowData);

      set((state) => ({
        workflows: workflow ? upsertWorkflow(state.workflows, workflow) : state.workflows,
        currentWorkflow: workflow,
        isLoading: false,
      }));

      return workflow;
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to create workflow'), isLoading: false });
      throw error;
    }
  },

  updateWorkflow: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const existingWorkflow = get().workflows.find((workflow) => String(workflow.id) === String(id));
      const mergedPayload = {
        name: updates?.name ?? existingWorkflow?.name ?? '',
        description: updates?.description ?? existingWorkflow?.description ?? '',
        status: normalizeStatus(updates?.status ?? existingWorkflow?.status),
        nodes: Array.isArray(updates?.nodes) ? updates.nodes : existingWorkflow?.nodes,
        edges: Array.isArray(updates?.edges) ? updates.edges : existingWorkflow?.edges,
      };

      const responseWorkflow = await workflowApi.update(id, mergedPayload);
      const workflow = responseWorkflow || {
        ...existingWorkflow,
        ...mergedPayload,
        id: existingWorkflow?.id ?? id,
      };

      set((state) => {
        const workflows = state.workflows.map((w) =>
          String(w.id) === String(id) ? workflow : w
        );
        const currentWorkflow = String(state.currentWorkflow?.id) === String(id)
          ? workflow
          : state.currentWorkflow;

        return { workflows, currentWorkflow, isLoading: false };
      });

      return workflow;
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to update workflow'), isLoading: false });
      throw error;
    }
  },

  deleteWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await workflowApi.delete(id);

      set((state) => ({
        workflows: state.workflows.filter((w) => String(w.id) !== String(id)),
        currentWorkflow: String(state.currentWorkflow?.id) === String(id) ? null : state.currentWorkflow,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to delete workflow'), isLoading: false });
      throw error;
    }
  },

  toggleWorkflowStatus: async (id) => {
    const workflow = get().workflows.find((item) => String(item.id) === String(id));
    if (!workflow) {
      throw new Error('Workflow not found.');
    }

    const nextStatus = workflow.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return get().updateWorkflow(id, {
      name: workflow.name,
      description: workflow.description,
      status: nextStatus,
      nodes: workflow.nodes,
      edges: workflow.edges,
    });
  },

  executeWorkflow: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const result = await workflowApi.execute(id, input);
      
      // Since execution is async on backend, we might not get immediate status
      // We trigger a fetch of executions to update history
      get().fetchExecutions(id);

      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to execute workflow'), isLoading: false });
      throw error;
    }
  },

  fetchExecutions: async (workflowId) => {
    try {
      const executions = await workflowApi.getExecutions(workflowId);
      set({ executions });
      return executions;
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      return [];
    }
  },

  fetchExecutionSteps: async (executionId) => {
    set({ isLoading: true });
    try {
      const steps = await workflowApi.getSteps(executionId);
      set({ executionSteps: steps, isLoading: false });
      return steps;
    } catch (error) {
      set({ error: toErrorMessage(error, 'Failed to fetch execution steps'), isLoading: false });
      return [];
    }
  },

  clearExecutionSteps: () => {
    set({ executionSteps: [] });
  },

  addExecution: (workflowId, execution) => {
    set((state) => ({
      workflows: state.workflows.map((w) =>
        String(w.id) === String(workflowId)
          ? {
              ...w,
              executions: [execution, ...(w.executions || [])],
              lastExecution: execution.timestamp,
            }
          : w
      ),
    }));
  },

  getFilteredWorkflows: (status, searchQuery) => {
    let workflows = get().workflows;

    if (status && String(status).toUpperCase() !== 'ALL') {
      const expectedStatus = normalizeStatus(status, status.toUpperCase());
      workflows = workflows.filter((w) => w.status === expectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      workflows = workflows.filter(
        (w) =>
          w.name?.toLowerCase().includes(query)
      );
    }

    return workflows;
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useWorkflowStore;
