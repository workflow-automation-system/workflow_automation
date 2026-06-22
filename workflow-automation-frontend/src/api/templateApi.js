 import { API_BASE_URL } from './config';

async function request(path, options = {}) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || 'GET',
        headers: {
            Accept: 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Template request failed: ${response.status}`);
    }

    return response.status === 204 ? null : response.json();
}

export const templateApi = {
    getAll: () => request('/templates'),

    getById: (id) => request(`/templates/${id}`),

    getByUser: (userId) => request(`/templates/user/${userId}`),
};

export default templateApi;
