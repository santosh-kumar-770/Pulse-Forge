const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('pulseforge_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('pulseforge_token');
    localStorage.removeItem('pulseforge_user');
    window.dispatchEvent(new Event('pulseforge-auth-logout'));
    throw new Error('Session expired. Please log in again.');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (url, options) => apiRequest(url, { method: 'GET', ...options }),
  post: (url, body, options) => apiRequest(url, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (url, body, options) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (url, body, options) => apiRequest(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: (url, options) => apiRequest(url, { method: 'DELETE', ...options }),
};
