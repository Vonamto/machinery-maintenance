// frontend/src/api/api.js
import CONFIG from "../config";

/**
 * Simple API helper using fetch (no extra dependencies).
 * Exports: login(), fetchWithAuth()
 */

export async function login(username, password) {
  const body = {
    // backend accepts both lowercase and capitalized keys; we'll use capitalized
    Username: username,
    Password: password
  };

  const res = await fetch(`${CONFIG.BACKEND_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // return parsed JSON (backend returns {status, token, user} or error)
  return res.json();
}

/**
 * Helper: perform GET to protected endpoint with stored token.
 * Example usage: fetchWithAuth('/api/protected')
 */
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
