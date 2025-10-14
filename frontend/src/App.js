import React, { useEffect, useState } from "react";
import CONFIG from "./config";

function App() {
  const [backendMessage, setBackendMessage] = useState("Loading...");

  useEffect(() => {
    fetch(`${CONFIG.BACKEND_URL}/`)
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch(() => setBackendMessage("Failed to connect to backend"));
  }, []);

  return (
    <div style={{ fontFamily: "Arial", textAlign: "center", marginTop: "50px" }}>
      <h1>Machinery Maintenance App</h1>
      <p>English / العربية toggle coming soon 🇬🇧 🇸🇦</p>
      <hr style={{ width: "300px" }} />
      <h3>Backend Test:</h3>
      <p>{backendMessage}</p>
    </div>
  );
}

export default App;
