
const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://mymoney-full-mern.onrender.com/api'
).replace(/\/+$/, '');

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('mymoney_token');

  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  const data =
    response.status === 204
      ? {}
      : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

export const jsonBody = (value) => JSON.stringify(value);
