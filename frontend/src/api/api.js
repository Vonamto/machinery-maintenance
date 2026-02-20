// frontend/src/api/api.js
import CONFIG from '../config';

// Helper function to check if token is expired
function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiresAt;
  } catch (e) {
    console.error('Invalid token format:', e);
    return true; // Treat invalid tokens as expired
  }
}

// Helper function to clear auth and redirect to login
function handleExpiredToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Login API
export async function login(username, password) {
  const body = { Username: username, Password: password };
  const res = await fetch(`${CONFIG.BACKEND_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  // backend returns JSON: { status, token, user } or { error }
  return res.json();
}

// Generic authorized fetch helper
export async function fetchWithAuth(path, opts = {}) {
  const token = localStorage.getItem('token');
  
  // Check if token exists and is not expired
  if (!token || isTokenExpired(token)) {
    handleExpiredToken();
    return; // Stop execution
  }
  
  const headers = { ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${CONFIG.BACKEND_URL}${path}`, { ...opts, headers });
  
  // Handle 401 responses from backend
  if (res.status === 401) {
    handleExpiredToken();
    return;
  }
  
  return res;
}

// Fetch all Users (Supervisor only, contains passwords so only supervisor should call)
export async function fetchUsers(token) {
  const res = await fetch(`${CONFIG.BACKEND_URL}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Users list');
  return await res.json();
}

// Fetch safe usernames (no passwords) for dropdowns
export async function fetchUsernames(token) {
  const res = await fetch(`${CONFIG.BACKEND_URL}/api/usernames`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch usernames list');
  return await res.json();
}

// =====================================================
// ✅ NEW: Suivi (Machinery Tracking) API Functions
// =====================================================

// Fetch Machinery Types for dropdowns
export async function fetchMachineryTypes() {
  const res = await fetchWithAuth('/api/machinery-types', {
    method: 'GET',
  });
  if (!res) return [];
  if (!res.ok) throw new Error('Failed to fetch machinery types');
  return await res.json();
}

// Fetch Suivi data
export async function fetchSuivi() {
  const res = await fetchWithAuth('/api/suivi', {
    method: 'GET',
  });
  if (!res) return [];
  if (!res.ok) throw new Error('Failed to fetch Suivi data');
  return await res.json();
}

// Add Suivi entry
export async function addSuiviEntry(data) {
  const res = await fetchWithAuth('/api/add/Suivi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res) return { status: 'error', message: 'No response from server' };
  if (!res.ok) throw new Error('Failed to add Suivi entry');
  return await res.json();
}

// Update Suivi entry
export async function updateSuiviEntry(rowIndex, data) {
  const res = await fetchWithAuth(`/api/edit/Suivi/${rowIndex}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res) return { status: 'error', message: 'No response from server' };
  if (!res.ok) throw new Error('Failed to update Suivi entry');
  return await res.json();
}

// Delete Suivi entry
export async function deleteSuiviEntry(rowIndex) {
  const res = await fetchWithAuth(`/api/delete/Suivi/${rowIndex}`, {
    method: 'DELETE',
  });
  if (!res) return { status: 'error', message: 'No response from server' };
  if (!res.ok) throw new Error('Failed to delete Suivi entry');
  return await res.json();
}
