const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value = '') => (value.startsWith('/') ? value : `/${value}`);

const explicitBaseUrl = process.env.REACT_APP_API_BASE_URL;
const rawGatewayUrl = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8085';
const rawPrefix = process.env.REACT_APP_API_PREFIX || '/api';

const gatewayUrl = trimTrailingSlash(rawGatewayUrl);
const prefix = trimTrailingSlash(ensureLeadingSlash(rawPrefix));

export const API_BASE_URL = explicitBaseUrl
  ? trimTrailingSlash(explicitBaseUrl)
  : `${gatewayUrl}${prefix}`;

export const WORKFLOWS_ENDPOINT = '/workflows';
export const WORKFLOW_CONFIGURATION_ENDPOINT = '/workflows/configuration';
export const EXECUTIONS_ENDPOINT = '/executions';
