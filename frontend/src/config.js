// frontend/src/config.js
// Central API client for all frontend requests

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Wrapper around fetch that:
 * - uses the correct API base URL
 * - attaches the JWT access token automatically
 * - sends cookies (refresh_token) cross‑site
 * - silently refreshes the access token on 401
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('polynous_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // First attempt
  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include', // required for cross‑site cookie
  });

  // If 401 and we had a token, try refreshing it
  if (response.status === 401 && token) {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      const newToken = data.access_token;
      localStorage.setItem('polynous_token', newToken);

      // Retry original request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      // Refresh failed → force logout
      localStorage.clear();
      window.location.href = '/auth';
      throw new Error('Session expired');
    }
  }

  return response;
}