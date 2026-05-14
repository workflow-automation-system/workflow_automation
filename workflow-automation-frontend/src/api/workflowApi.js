import {
  API_BASE_URL,
  EXECUTIONS_ENDPOINT,
  WORKFLOW_CONFIGURATION_ENDPOINT,
  WORKFLOWS_ENDPOINT,
} from './config';
import authService from '../services/authService';
import {
  FALLBACK_WORKFLOW_CONFIGURATION,
  normalizeWorkflowConfiguration,
  normalizeWorkflow,
  buildMutationPayload,
  extractPayload,
} from '../services/workflowConverter';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const AUTH_STORAGE_KEY = 'auth-storage';
let userIdResolutionPromise = null;

function readStoredUserId() {
  try {
    const rawState = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawState) {
      return null;
    }

    const parsed = JSON.parse(rawState);
    const storedId = parsed?.state?.user?.id;
    const numericId = Number(storedId);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  } catch {
    return null;
  }
}

function persistUserId(user) {
  if (!isObject(user) || user.id === undefined || user.id === null) {
    return;
  }

  try {
    const rawState = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawState) {
      return;
    }

    const parsed = JSON.parse(rawState);
    const nextState = {
      ...parsed,
      state: {
        ...parsed?.state,
        user: {
          ...(parsed?.state?.user || {}),
          id: user.id,
          email: user.email ?? parsed?.state?.user?.email,
          name: user.name ?? parsed?.state?.user?.name,
          role: user.role ?? parsed?.state?.user?.role,
        },
      },
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Ignore malformed persisted state and fall back to fetching again later.
  }
}

async function getCurrentUserId() {
  const storedUserId = readStoredUserId();
  if (storedUserId) {
    return storedUserId;
  }

  if (!localStorage.getItem('token')) {
    throw new Error('You must be logged in to manage workflows.');
  }

  if (!userIdResolutionPromise) {
    userIdResolutionPromise = authService
      .me()
      .then((user) => {
        const numericId = Number(user?.id);
        if (!Number.isFinite(numericId) || numericId <= 0) {
          throw new Error('Unable to resolve the current user for workflow ownership.');
        }

        persistUserId(user);
        return numericId;
      })
      .finally(() => {
        userIdResolutionPromise = null;
      });
  }

  return userIdResolutionPromise;
}

async function withCurrentUserPath(builder) {
  const userId = await getCurrentUserId();
  return builder(userId);
}

async function parseJsonSafely(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text || null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const hasBody = options.body !== undefined && options.body !== null;

  const token = localStorage.getItem('token');
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorPayload = await parseJsonSafely(response);
      const backendMessage =
        typeof errorPayload === 'string'
          ? errorPayload
          : errorPayload?.message || errorPayload?.error;

      throw new Error(
        backendMessage || `Request failed (${response.status} ${response.statusText})`
      );
    }

    return parseJsonSafely(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Network error. Check if API Gateway is running on http://localhost:8085 and supports CORS preflight (OPTIONS).'
      );
    }
    throw error;
  }
}

export async function getWorkflowConfiguration() {
  const response = await request(WORKFLOW_CONFIGURATION_ENDPOINT);
  const payload = extractPayload(response);
  return normalizeWorkflowConfiguration(payload);
}

export async function getWorkflows() {
  const response = await request(await withCurrentUserPath((userId) => `${WORKFLOWS_ENDPOINT}/user/${userId}`));
  const payload = extractPayload(response);
  const workflows = Array.isArray(payload) ? payload : [];
  return workflows.map((workflow) => normalizeWorkflow(workflow, FALLBACK_WORKFLOW_CONFIGURATION));
}

export async function createWorkflow(payload) {
  const userId = await getCurrentUserId();
  const response = await request(WORKFLOWS_ENDPOINT, {
    method: 'POST',
    body: {
      ...buildMutationPayload(payload),
      userId,
    },
  });

  const normalized = extractPayload(response);
  return isObject(normalized)
    ? normalizeWorkflow(normalized, FALLBACK_WORKFLOW_CONFIGURATION)
    : null;
}

export async function getWorkflowById(id) {
  const response = await request(
    await withCurrentUserPath((userId) => `${WORKFLOWS_ENDPOINT}/${id}/user/${userId}`)
  );
  const normalized = extractPayload(response);
  return isObject(normalized)
    ? normalizeWorkflow(normalized, FALLBACK_WORKFLOW_CONFIGURATION)
    : null;
}

export async function updateWorkflow(id, payload) {
  const response = await request(await withCurrentUserPath((userId) => `${WORKFLOWS_ENDPOINT}/${id}/user/${userId}`), {
    method: 'PUT',
    body: buildMutationPayload(payload),
  });

  const normalized = extractPayload(response);
  return isObject(normalized)
    ? normalizeWorkflow(normalized, FALLBACK_WORKFLOW_CONFIGURATION)
    : null;
}

export async function deleteWorkflow(id) {
  return request(await withCurrentUserPath((userId) => `${WORKFLOWS_ENDPOINT}/${id}/user/${userId}`), {
    method: 'DELETE',
  });
}

export async function executeWorkflow(id, input) {
  return request(`${WORKFLOWS_ENDPOINT}/${id}/execute`, {
    method: 'POST',
    body: { input },
  });
}

export async function getExecutions(workflowId) {
  const response = await request(`${EXECUTIONS_ENDPOINT}/workflow/${workflowId}`);
  return extractPayload(response);
}

export async function getExecutionSteps(executionId) {
  const response = await request(`${EXECUTIONS_ENDPOINT}/${executionId}/steps`);
  return extractPayload(response);
}

export const workflowApi = {
  getAll: getWorkflows,
  getById: getWorkflowById,
  create: createWorkflow,
  update: updateWorkflow,
  delete: deleteWorkflow,
  execute: executeWorkflow,
  getExecutions: getExecutions,
  getSteps: getExecutionSteps,
  getConfiguration: getWorkflowConfiguration,
};

export default workflowApi;
