// Mock workflow data
export const mockWorkflows = [
  {
    id: 'wf-001',
    name: 'Email Notification Workflow',
    description: 'Sends automated email notifications when new orders are received',
    status: 'active',
    createdAt: '2026-03-15T10:30:00Z',
    updatedAt: '2026-03-27T08:15:00Z',
    lastExecution: '2026-03-27T10:30:00Z',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'New Order', eventType: 'order_created' } },
      { id: 'node-2', type: 'email', position: { x: 300, y: 100 }, data: { label: 'Send Email', to: 'customer@example.com', subject: 'Order Confirmation', body: 'Your order has been received.' } },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
    ],
    executions: [
      { id: 'exec-1', timestamp: '2026-03-27T10:30:00Z', status: 'success', duration: '1.2s', trigger: 'order_created' },
      { id: 'exec-2', timestamp: '2026-03-26T14:20:00Z', status: 'success', duration: '0.9s', trigger: 'order_created' },
      { id: 'exec-3', timestamp: '2026-03-25T09:45:00Z', status: 'success', duration: '1.5s', trigger: 'order_created' },
    ],
  },
  {
    id: 'wf-002',
    name: 'Webhook Data Sync',
    description: 'Syncs data between external services via webhooks',
    status: 'active',
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-03-25T16:30:00Z',
    lastExecution: '2026-03-27T09:00:00Z',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Webhook Trigger', eventType: 'webhook' } },
      { id: 'node-2', type: 'webhook', position: { x: 300, y: 100 }, data: { label: 'API Call', url: 'https://api.example.com/sync', method: 'POST' } },
      { id: 'node-3', type: 'delay', position: { x: 500, y: 100 }, data: { label: 'Wait', duration: 5, unit: 'minutes' } },
      { id: 'node-4', type: 'email', position: { x: 700, y: 100 }, data: { label: 'Confirmation', to: 'admin@example.com', subject: 'Sync Complete', body: 'Data sync finished.' } },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
      { id: 'edge-2', source: 'node-2', target: 'node-3' },
      { id: 'edge-3', source: 'node-3', target: 'node-4' },
    ],
    executions: [
      { id: 'exec-1', timestamp: '2026-03-27T09:00:00Z', status: 'success', duration: '5.2s', trigger: 'webhook' },
      { id: 'exec-2', timestamp: '2026-03-26T09:00:00Z', status: 'failed', duration: '2.1s', trigger: 'webhook' },
    ],
  },
  {
    id: 'wf-003',
    name: 'Scheduled Report Generation',
    description: 'Generates and emails weekly reports every Monday at 9 AM',
    status: 'inactive',
    createdAt: '2026-03-05T08:00:00Z',
    updatedAt: '2026-03-20T11:00:00Z',
    lastExecution: '2026-03-20T09:00:00Z',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'Schedule', eventType: 'schedule', schedule: '0 9 * * 1' } },
      { id: 'node-2', type: 'webhook', position: { x: 300, y: 100 }, data: { label: 'Fetch Data', url: 'https://api.example.com/report', method: 'GET' } },
      { id: 'node-3', type: 'email', position: { x: 500, y: 100 }, data: { label: 'Send Report', to: 'team@example.com', subject: 'Weekly Report', body: 'Please find the weekly report attached.' } },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
      { id: 'edge-2', source: 'node-2', target: 'node-3' },
    ],
    executions: [
      { id: 'exec-1', timestamp: '2026-03-20T09:00:00Z', status: 'success', duration: '45.3s', trigger: 'schedule' },
    ],
  },
  {
    id: 'wf-004',
    name: 'Customer Onboarding Flow',
    description: 'Automated onboarding emails for new customers',
    status: 'active',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-27T07:00:00Z',
    lastExecution: '2026-03-27T11:00:00Z',
    nodes: [
      { id: 'node-1', type: 'trigger', position: { x: 100, y: 100 }, data: { label: 'New Customer', eventType: 'customer_created' } },
      { id: 'node-2', type: 'email', position: { x: 300, y: 50 }, data: { label: 'Welcome Email', to: '{{customer.email}}', subject: 'Welcome!', body: 'Welcome to our platform!' } },
      { id: 'node-3', type: 'delay', position: { x: 500, y: 50 }, data: { label: 'Wait 24h', duration: 24, unit: 'hours' } },
      { id: 'node-4', type: 'email', position: { x: 700, y: 50 }, data: { label: 'Follow-up', to: '{{customer.email}}', subject: 'Getting Started', body: 'How are you doing?' } },
    ],
    edges: [
      { id: 'edge-1', source: 'node-1', target: 'node-2' },
      { id: 'edge-2', source: 'node-2', target: 'node-3' },
      { id: 'edge-3', source: 'node-3', target: 'node-4' },
    ],
    executions: [
      { id: 'exec-1', timestamp: '2026-03-27T11:00:00Z', status: 'success', duration: '0.8s', trigger: 'customer_created' },
      { id: 'exec-2', timestamp: '2026-03-26T15:30:00Z', status: 'success', duration: '1.1s', trigger: 'customer_created' },
    ],
  },
];

// Node types configuration
export const nodeTypes = [
  {
    type: 'trigger',
    label: 'Trigger',
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
    type: 'condition',
    label: 'Condition Branch',
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
    type: 'data_mapper',
    label: 'Data Mapper',
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
    type: 'error_handler',
    label: 'Error Handler',
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
    type: 'notion',
    label: 'Notion',
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
    type: 'google_sheets',
    label: 'Google Sheets',
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
    type: 'chatgpt',
    label: 'ChatGPT',
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
    type: 'slack',
    label: 'Slack',
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
    type: 'email',
    label: 'Email',
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
    type: 'webhook',
    label: 'Webhook',
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
    type: 'delay',
    label: 'Delay',
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

// Dashboard statistics
export const dashboardStats = {
  totalWorkflows: 5,
  activeWorkflows: 3,
  totalExecutions: 142,
  successRate: 94.5,
};

// Generate unique ID
export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
