const WORKFLOW_ENTITIES = ['TRIGGER', 'ACTION', 'CONDITION'];
const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE'];

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeTrim = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeKey = (value) => safeTrim(value).toLowerCase();

const inferEntityFromFunctionKey = (functionKey) => {
  const key = normalizeKey(functionKey);
  if (key === 'trigger') return 'TRIGGER';
  if (key === 'condition') return 'CONDITION';
  return 'ACTION';
};

export const normalizeEntity = (entity, functionKey = '') => {
  const candidate = safeTrim(entity).toUpperCase();
  if (WORKFLOW_ENTITIES.includes(candidate)) {
    return candidate;
  }
  return inferEntityFromFunctionKey(functionKey);
};

const fallbackFunctions = [
  {
    key: 'trigger',
    label: 'Trigger',
    entity: 'TRIGGER',
    description: 'Start the workflow when an enterprise event occurs',
    icon: 'Zap',
    color: '#D0FFA4',
    defaultData: {
      label: 'New Trigger',
      eventType: 'manual',
      conditions: [],
    },
  },
  {
    key: 'condition',
    label: 'Condition Branch',
    entity: 'CONDITION',
    description: 'Route records down different branches with logical conditions',
    icon: 'GitBranch',
    color: '#E2E8F0',
    defaultData: {
      label: 'Branch Condition',
      expression: 'order.total > 1000',
      truePath: 'High value',
      falsePath: 'Standard',
    },
  },
  {
    key: 'data_mapper',
    label: 'Data Mapper',
    entity: 'ACTION',
    description: 'Normalize source payloads to destination schemas',
    icon: 'Table2',
    color: '#E2E8F0',
    defaultData: {
      label: 'Map Fields',
      source: 'payload.customer',
      target: 'crm.contact',
      mappingMode: 'strict',
    },
  },
  {
    key: 'error_handler',
    label: 'Error Handler',
    entity: 'ACTION',
    description: 'Capture failures and execute retry or fallback policy',
    icon: 'ShieldAlert',
    color: '#D0FFA4',
    defaultData: {
      label: 'Handle Errors',
      policy: 'retry',
      retries: 3,
    },
  },
  {
    key: 'notion',
    label: 'Notion',
    entity: 'ACTION',
    description: 'Read and write pages or databases in Notion',
    icon: 'BookCopy',
    color: '#D0FFA4',
    defaultData: {
      label: 'Update Notion',
      action: 'create_page',
      database: '',
    },
  },
  {
    key: 'google_sheets',
    label: 'Google Sheets',
    entity: 'ACTION',
    description: 'Append rows and manage tabular data workflows',
    icon: 'Sheet',
    color: '#D0FFA4',
    defaultData: {
      label: 'Append Row',
      spreadsheetId: '',
      worksheet: 'Sheet1',
    },
  },
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    entity: 'ACTION',
    description: 'Generate or classify content with secure prompts',
    icon: 'Bot',
    color: '#D0FFA4',
    defaultData: {
      label: 'Generate Summary',
      model: 'gpt-5.4-mini',
      prompt: '',
    },
  },
  {
    key: 'slack',
    label: 'Slack',
    entity: 'ACTION',
    description: 'Send channel messages and incident updates',
    icon: 'MessageSquare',
    color: '#D0FFA4',
    defaultData: {
      label: 'Notify Channel',
      channel: '#ops-alerts',
      message: '',
    },
  },
  {
    key: 'email',
    label: 'Email',
    entity: 'ACTION',
    description: 'Send an email notification',
    icon: 'Mail',
    color: '#D0FFA4',
    defaultData: {
      label: 'Send Email',
      to: '',
      subject: '',
      body: '',
    },
  },
  {
    key: 'gmail',
    label: 'Email',
    entity: 'ACTION',
    description: 'Send an email through Gmail',
    icon: 'Mail',
    color: '#D0FFA4',
    defaultData: {
      label: 'Send Email',
      to: '',
      subject: '',
      body: '',
    },
  },
  {
    key: 'gmail_read',
    label: 'Read Email',
    entity: 'ACTION',
    description: 'Read latest emails from Gmail',
    icon: 'Mail',
    color: '#D0FFA4',
    defaultData: {
      label: 'Read Email',
      action: 'read_emails',
      query: 'is:unread',
      maxResults: 10,
    },
  },
  {
    key: 'webhook',
    label: 'Webhook',
    entity: 'ACTION',
    description: 'Call an external API or internal endpoint',
    icon: 'Globe',
    color: '#E2E8F0',
    defaultData: {
      label: 'HTTP Request',
      url: '',
      method: 'GET',
      headers: {},
      body: '',
    },
  },
  {
    key: 'delay',
    label: 'Delay',
    entity: 'ACTION',
    description: 'Pause execution before the next workflow step',
    icon: 'Clock',
    color: '#F6F5FA',
    defaultData: {
      label: 'Wait',
      duration: 5,
      unit: 'minutes',
    },
  },
];

const normalizeFunctionDefinition = (definition) => {
  const key = normalizeKey(definition?.key || definition?.type);
  if (!key) return null;

  const label = safeTrim(definition?.label) || key;
  const entity = normalizeEntity(definition?.entity, key);
  const icon = safeTrim(definition?.icon) || 'Zap';
  const color = safeTrim(definition?.color) || '#D0FFA4';
  const description = safeTrim(definition?.description);
  const defaultData = isObject(definition?.defaultData) ? { ...definition.defaultData } : {};

  if (!safeTrim(defaultData.label)) {
    defaultData.label = label;
  }

  return { key, label, entity, description, icon, color, defaultData };
};

const ensureFunctionFallbacks = (functions) => {
  const normalized = [];
  const seen = new Set();

  [...(functions || []), ...fallbackFunctions].forEach((definition) => {
    const next = normalizeFunctionDefinition(definition);
    if (!next || seen.has(next.key)) return;
    seen.add(next.key);
    normalized.push(next);
  });

  return normalized;
};

export const FALLBACK_WORKFLOW_CONFIGURATION = Object.freeze({
  entities: [...WORKFLOW_ENTITIES],
  functions: ensureFunctionFallbacks(fallbackFunctions),
});

export const normalizeWorkflowConfiguration = (configuration) => {
  const rawEntities = Array.isArray(configuration?.entities) ? configuration.entities : [];
  const entities = rawEntities
    .map((value) => safeTrim(value).toUpperCase())
    .filter((value, index, self) => WORKFLOW_ENTITIES.includes(value) && self.indexOf(value) === index);

  const resolvedEntities = entities.length ? entities : [...WORKFLOW_ENTITIES];
  const functions = ensureFunctionFallbacks(Array.isArray(configuration?.functions) ? configuration.functions : []);

  return { entities: resolvedEntities, functions };
};

export const getFunctionDefinition = (configuration, functionKey) => {
  const key = normalizeKey(functionKey);
  if (!key) return null;

  const functions = Array.isArray(configuration?.functions) ? configuration.functions : [];
  return functions.find((item) => item.key === key) || null;
};

export const getFirstFunctionForEntity = (configuration, entity) => {
  const normalizedEntity = normalizeEntity(entity);
  const functions = Array.isArray(configuration?.functions) ? configuration.functions : [];
  return functions.find((item) => item.entity === normalizedEntity) || functions[0] || null;
};

export const stripNodeMetaFields = (data = {}) => {
  const next = { ...data };
  delete next.label;
  delete next.entity;
  delete next.functionKey;
  delete next.functionLabel;
  delete next.icon;
  delete next.color;
  return next;
};

export const createNodeDataFromFunction = (functionDefinition, overrides = {}) => {
  const normalizedFunction = normalizeFunctionDefinition(functionDefinition) || normalizeFunctionDefinition(fallbackFunctions[0]);
  const baseData = {
    ...(isObject(normalizedFunction.defaultData) ? normalizedFunction.defaultData : {}),
    ...(isObject(overrides) ? overrides : {}),
  };

  return {
    ...baseData,
    label: safeTrim(baseData.label) || normalizedFunction.label,
    entity: normalizedFunction.entity,
    functionKey: normalizedFunction.key,
    functionLabel: normalizedFunction.label,
    icon: normalizedFunction.icon,
    color: normalizedFunction.color,
  };
};

export const parseBackendNodeConfig = (configValue) => {
  if (isObject(configValue)) return configValue;
  if (typeof configValue !== 'string') return {};
  try {
    const parsed = JSON.parse(configValue.trim());
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const buildBackendNodeConfig = (nodeData = {}, nodeType = '') => {
  const functionKey = normalizeKey(nodeData.functionKey || nodeType);
  const settings = stripNodeMetaFields(nodeData);

  if (functionKey === 'gmail' || functionKey === 'email') {
    return {
      functionKey,
      application: 'gmail',
      action: settings.action || 'send_email',
      to: settings.to || '',
      subject: settings.subject || '',
      body: settings.body || '',
    };
  }
  if (functionKey === 'gmail' || functionKey === 'email' || functionKey === 'gmail_read') {
    return {
      functionKey,
      application: 'gmail',
      action: settings.action || (functionKey === 'gmail_read' ? 'read_emails' : 'send_email'),
      to: settings.to || '',
      subject: settings.subject || '',
      body: settings.body || '',
      query: settings.query || 'is:unread',
      maxResults: settings.maxResults ?? 10,
    };
  }

  return { functionKey, settings };
};

// Workflow Normalization Logic

export const normalizeStatus = (status, fallback = 'INACTIVE') => {
  const normalized = String(status || fallback).toUpperCase();
  return ALLOWED_STATUSES.includes(normalized) ? normalized : fallback;
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getNodeId = (value, fallbackIndex = 0) => {
  return value !== null && value !== undefined && value !== '' ? String(value) : `node-${fallbackIndex + 1}`;
};

const parseNodeFromLegacyShape = (rawNode, index, configuration) => {
  const functionKey = normalizeKey(rawNode?.data?.functionKey || rawNode?.type);
  const functionDefinition =
    getFunctionDefinition(configuration, functionKey) ||
    getFirstFunctionForEntity(configuration, rawNode?.data?.entity);

  const fallbackDefinition = functionDefinition || {
    key: functionKey || 'trigger',
    label: safeTrim(rawNode?.data?.label) || 'Node',
    entity: normalizeEntity(rawNode?.data?.entity, functionKey),
    icon: 'Zap',
    color: '#D0FFA4',
    defaultData: {},
  };

  const data = createNodeDataFromFunction(fallbackDefinition, rawNode?.data || {});

  return {
    id: getNodeId(rawNode?.id ?? rawNode?.clientId, index),
    type: fallbackDefinition.key,
    position: {
      x: normalizeNumber(rawNode?.position?.x ?? rawNode?.positionX, 0),
      y: normalizeNumber(rawNode?.position?.y ?? rawNode?.positionY, 0),
    },
    data,
  };
};

const parseNodeFromBackendShape = (rawNode, index, configuration) => {
  const parsedConfig = parseBackendNodeConfig(rawNode?.config);
  const settings = isObject(parsedConfig.settings)
    ? parsedConfig.settings
    : isObject(parsedConfig.data)
      ? parsedConfig.data
      : parsedConfig.application === 'gmail'
        ? {
            action: parsedConfig.action,
            to: parsedConfig.to,
            subject: parsedConfig.subject,
            body: parsedConfig.body,
          }
        : {};
  const functionKey = normalizeKey(
    parsedConfig.functionKey || 
    parsedConfig.function || 
    (parsedConfig.application === 'gmail' ? 'email' : undefined) ||
    rawNode?.type
  );
  const functionDefinition =
    getFunctionDefinition(configuration, functionKey) ||
    getFirstFunctionForEntity(configuration, rawNode?.type);

  const fallbackDefinition = functionDefinition || {
    key: functionKey || 'trigger',
    label: safeTrim(rawNode?.name) || 'Node',
    entity: normalizeEntity(rawNode?.type, functionKey),
    icon: 'Zap',
    color: '#D0FFA4',
    defaultData: {},
  };

  const data = createNodeDataFromFunction(fallbackDefinition, {
    ...settings,
    label: safeTrim(rawNode?.name) || settings.label || fallbackDefinition.label,
  });

  return {
    id: getNodeId(rawNode?.id ?? rawNode?.clientId, index),
    type: fallbackDefinition.key,
    position: {
      x: normalizeNumber(rawNode?.positionX, 0),
      y: normalizeNumber(rawNode?.positionY, 0),
    },
    data,
  };
};

const normalizeWorkflowNode = (rawNode, index, configuration) => {
  if (!isObject(rawNode)) return parseNodeFromLegacyShape({}, index, configuration);
  const looksLikeLegacyNode = isObject(rawNode.position) || isObject(rawNode.data);
  return looksLikeLegacyNode
    ? parseNodeFromLegacyShape(rawNode, index, configuration)
    : parseNodeFromBackendShape(rawNode, index, configuration);
};

export const toBackendNodeRequest = (node, index) => {
  const data = isObject(node?.data) ? node.data : {};
  const functionKey = normalizeKey(data.functionKey || node?.type);
  const entity = normalizeEntity(data.entity, functionKey);
  const label = safeTrim(data.label) || `Node ${index + 1}`;
  const config = buildBackendNodeConfig(data, functionKey);

  const numericId = Number(node?.id);
  const requestPayload = {
    type: entity,
    name: label,
    config: JSON.stringify(config),
    positionX: normalizeNumber(node?.position?.x ?? node?.positionX, 0),
    positionY: normalizeNumber(node?.position?.y ?? node?.positionY, 0),
  };

  if (Number.isFinite(numericId) && numericId > 0) {
    requestPayload.id = numericId;
  } else if (node?.id !== undefined && node?.id !== null && node?.id !== '') {
    requestPayload.clientId = String(node.id);
  }

  return requestPayload;
};

const normalizeWorkflowEdge = (edge, index = 0) => {
  const source = edge?.source ?? edge?.sourceNodeId ?? edge?.sourceClientId;
  const target = edge?.target ?? edge?.targetNodeId ?? edge?.targetClientId;

  return {
    ...edge,
    id: String(edge?.id ?? `edge-${index + 1}`),
    source: source !== undefined && source !== null ? String(source) : '',
    target: target !== undefined && target !== null ? String(target) : '',
  };
};

export const normalizeWorkflow = (workflow = {}, configuration = FALLBACK_WORKFLOW_CONFIGURATION) => {
  const nodes = (Array.isArray(workflow.nodes) ? workflow.nodes : []).map((node, index) =>
    normalizeWorkflowNode(node, index, configuration)
  );
  const nodeCount = Number.isFinite(workflow.nodeCount) ? workflow.nodeCount : nodes.length;

  return {
    ...workflow,
    id: workflow.id ?? workflow.workflowId ?? null,
    name: safeTrim(workflow.name) || 'Untitled workflow',
    description: safeTrim(workflow.description),
    status: normalizeStatus(workflow.status),
    nodes,
    edges: (Array.isArray(workflow.edges)
      ? workflow.edges
      : Array.isArray(workflow.connections)
      ? workflow.connections
      : []
    ).map(normalizeWorkflowEdge),
    nodeCount,
    executionCount: Number.isFinite(workflow.executionCount) ? workflow.executionCount : 0,
    createdAt: workflow.createdAt || workflow.created_at || null,
    updatedAt: workflow.updatedAt || workflow.updated_at || null,
    lastExecution: workflow.lastExecution || workflow.lastExecutedAt || null,
  };
};

export const buildMutationPayload = (payload = {}, { requireName = true } = {}) => {
  const name = safeTrim(payload.name);
  const description = safeTrim(payload.description);
  const status = normalizeStatus(payload.status, 'ACTIVE');

  if (requireName && !name) throw new Error('Workflow name is required.');

  const nodes = (Array.isArray(payload.nodes) ? payload.nodes : []).map(toBackendNodeRequest);

  const connections = (Array.isArray(payload.edges) ? payload.edges : [])
    .map((edge) => {
      const sourceNodeId = Number(edge.source);
      const targetNodeId = Number(edge.target);
      return {
        sourceNodeId: Number.isFinite(sourceNodeId) ? sourceNodeId : null,
        targetNodeId: Number.isFinite(targetNodeId) ? targetNodeId : null,
        sourceClientId: Number.isFinite(sourceNodeId) ? null : String(edge.source || ''),
        targetClientId: Number.isFinite(targetNodeId) ? null : String(edge.target || ''),
      };
    })
    .filter(
      (connection) =>
        (Number.isFinite(connection.sourceNodeId) || connection.sourceClientId) &&
        (Number.isFinite(connection.targetNodeId) || connection.targetClientId)
    );

  return { name, description, status, nodes, connections };
};


export const extractPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!isObject(payload)) return payload ?? null;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.workflows)) return payload.workflows;
  if (isObject(payload.data)) return payload.data;
  return payload;
};
