import React, { useEffect, useState } from "react";
import CONFIG from "./config";

export default function App() {
  const [backendMessage, setBackendMessage] = useState("Loading...");

  useEffect(() => {
    fetch(`${CONFIG.BACKEND_URL}/`)
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.message))
      .catch(() => setBackendMessage("Failed to connect to backend"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-semibold text-center">Machinery Maintenance App</h1>
        <p className="text-center mt-2 text-sm text-gray-500">English / العربية (toggle coming later)</p>

        <div className="mt-6 space-y-4">
          <div className="text-sm text-gray-600">Backend Test:</div>
          <div className="p-4 bg-slate-100 rounded">
            <pre className="text-xs">{backendMessage}</pre>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          This is the Vite + Tailwind starter. Next step: add login & API wiring.
        </div>
      </div>
    </div>
  );
}
