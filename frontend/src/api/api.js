// frontend/src/api/api.js
import CONFIG from "../config";

/**
 * Simple API helper using fetch (no extra dependencies).
 * Exports: login(), fetchWithAuth(), fetchEquipmentList(), fetchUsers(), fetchUsernames()
 */

// Login API
export async function login(username, password) {
  const body = {
    Username: username,
    Password: password,
  };

  const res = await fetch(`${CONFIG.BACKEND_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // backend returns JSON: { status, token, user } or error
  return res.json();
}

// Generic authorized fetch helper
export async function fetchWithAuth(path, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = opts.headers || {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${CONFIG.BACKEND_URL}${path}`, {
    ...opts,
    headers,
  });

  return res;
}

/**
 * Fetch Equipment List (for dropdowns)
 * Return shape: array of objects matching sheet rows
 */
export async function fetchEquipmentList(token) {
  const res = await fetch(`${CONFIG.BACKEND_URL}/api/equipment`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch Equipment_List");
  return await res.json();
}

/**
 * Fetch all Users (Supervisor only, contains passwords so only supervisor should call)
 */
export async function fetchUsers(token) {
  const res = await fetch(`${CONFIG.BACKEND_URL}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch Users list");
  return await res.json();
}

/**
 * Fetch safe usernames (no passwords) for dropdowns
 */
export async function fetchUsernames(token) {
  const res = await fetch(`${CONFIG.BACKEND_URL}/api/usernames`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch usernames list");
  return await res.json();
}
