import { API_BASE_URL } from './config';
import { clearStoredSession } from '../utils/session';

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

  if (response.status === 401) {
    clearStoredSession();
    window.location.assign('/login');
    throw new Error('Your session expired. Please sign in again.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return response.json().catch(() => null);
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

export async function disconnectGoogle(userId) {
  return request(`/integrations/google/disconnect?userId=${userId}`, { method: 'DELETE' });
}
export async function testGoogleConnection(userId) {
  return request(`/integrations/google/test?userId=${userId}`);
}
export async function disconnectSlack(userId) {
  return request(`/integrations/slack/disconnect?userId=${userId}`, { method: 'DELETE' });
}
export async function testSlackConnection(userId) {
  return request(`/integrations/slack/test?userId=${userId}`);
}
export async function disconnectNotion(userId) {
  return request(`/integrations/notion/disconnect?userId=${userId}`, { method: 'DELETE' });
}
export async function testNotionConnection(userId) {
  return request(`/integrations/notion/test?userId=${userId}`);
}

export const integrationApi = {
  getGoogleAuthUrl,
  getGoogleStatus,
  disconnectGoogle,
  testGoogleConnection,
  getSlackAuthUrl,
  getSlackStatus,
  disconnectSlack,
  testSlackConnection,
  getNotionAuthUrl,
  getNotionStatus,
  disconnectNotion,
  testNotionConnection,
};