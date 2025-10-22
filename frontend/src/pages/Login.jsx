// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { login } from "../api/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Logging in...");
    try {
      const result = await login(username, password);
      if (result && result.status === "success") {
        // Save token and user
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user || {}));
        setStatus(`Logged in as ${result.user.username} (${result.user.role})`);
      } else {
        setStatus(result.message || JSON.stringify(result));
      }
    } catch (err) {
      setStatus("Network error: " + String(err));
    }
  };

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 420, margin: "40px auto", padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Username (as in Users sheet)"
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Password"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ padding: "8px 16px" }}>
            Log in
          </button>
        </div>
      </form>

      <div style={{ marginTop: 16 }}>
        <strong>Status:</strong> <span>{status}</span>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: "#555" }}>
        Tip: use a user from your Users sheet (Username / Password). After login the token is stored in localStorage as <code>token</code>.
      </div>
    </div>
  );
}
