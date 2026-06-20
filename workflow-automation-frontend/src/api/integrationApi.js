import { API_BASE_URL } from './config';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json();
}

export async function getGoogleAuthUrl(userId) {
  return request(`/integrations/google/auth-url?userId=${userId}`);
}

export async function getGoogleStatus(userId) {
  return request(`/integrations/google/status?userId=${userId}`);
}

export async function getSlackAuthUrl(userId) {
  return request(`/integrations/slack/auth-url?userId=${userId}`);
}

export async function getSlackStatus(userId) {
  return request(`/integrations/slack/status?userId=${userId}`);
}

export async function getNotionAuthUrl(userId) {
  return request(`/integrations/notion/auth-url?userId=${userId}`);
}

export async function getNotionStatus(userId) {
  return request(`/integrations/notion/status?userId=${userId}`);
}

export const integrationApi = {
  getGoogleAuthUrl,
  getGoogleStatus,
  getSlackAuthUrl,
  getSlackStatus,
  getNotionAuthUrl,
  getNotionStatus,
};