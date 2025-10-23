// frontend/src/pages/Maintenance/Form.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCache } from "../../context/CacheContext";
import Navbar from "../../components/Navbar";
import CONFIG from "../../config";

/**
 * Maintenance Form page (uses CacheContext)
 *
 * Behavior:
 * - Date auto-filled and locked
 * - Model / Plate / Driver are interdependent (choose any order)
 * - Performed By dropdown contains supervisors & mechanics (and "Myself")
 * - Photos: upload or camera (input accept + capture)
 * - Submits to POST /api/add/Maintenance_Log (protected)
 */

export default function MaintenanceForm() {
  const { user } = useAuth();
  const {
    equipment,
    getModels,
    getPlatesByModel,
    getEquipmentByPlate,
    getDriversByPlate,
    getUsernames,
  } = useCache();

  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Description of Work": "",
    "Performed By": user?.full_name || "",
    Comments: "",
    "Photo Before": "",
    "Photo After": "",
    "Photo Repair/Problem": "",
  });

  const [models, setModels] = useState([]);
  const [plates, setPlates] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    // load models from cache
    setModels(getModels());
  }, [equipment]);

  // If model selected -> fill plates
  useEffect(() => {
    if (formData["Model / Type"]) {
      setPlates(getPlatesByModel(formData["Model / Type"]));
    } else {
      setPlates([]);
    }
    // if user cleared model, also clear plate/driver
    if (!formData["Model / Type"]) {
      setFormData((p) => ({ ...p, "Plate Number": "", Driver: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData["Model / Type"]]);

  // If plate selected -> auto-fill model and drivers
  useEffect(() => {
    if (formData["Plate Number"]) {
      const eq = getEquipmentByPlate(formData["Plate Number"]);
      if (eq) {
        setFormData((p) => ({
          ...p,
          "Model / Type": eq["Model / Type"] || p["Model / Type"],
        }));
        setDrivers(getDriversByPlate(formData["Plate Number"]));
      }
    } else {
      setDrivers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData["Plate Number"]]);

  // If driver selected and it uniquely identifies plate/model, fill them
  useEffect(() => {
    if (formData.Driver) {
      // find equipment rows that include this driver
      const found = equipment.filter(
        (e) => e["Driver 1"] === formData.Driver || e["Driver 2"] === formData.Driver
      );
      if (found.length === 1) {
        const eq = found[0];
        setFormData((p) => ({
          ...p,
          "Plate Number": eq["Plate Number"] || p["Plate Number"],
          "Model / Type": eq["Model / Type"] || p["Model / Type"],
        }));
        setDrivers([eq["Driver 1"], eq["Driver 2"]].filter(Boolean));
      } else if (found.length > 1) {
        // multiple vehicles with same driver (rare) -> set plates choices
        setPlates(found.map((f) => f["Plate Number"]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.Driver]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Convert selected file -> base64
  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((p) => ({ ...p, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/add/Maintenance_Log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Maintenance entry saved ✅");
        // reset form except date & Performed By
        setFormData({
          Date: new Date().toISOString().split("T")[0],
          "Model / Type": "",
          "Plate Number": "",
          Driver: "",
          "Description of Work": "",
          "Performed By": user?.full_name || "",
          Comments: "",
          "Photo Before": "",
          "Photo After": "",
          "Photo Repair/Problem": "",
        });
      } else {
        alert("Error: " + (data.message || "unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Submit failed");
    }
  };

  // PerformedBy dropdown candidates: supervisors & mechanics + Myself
  const usernames = getUsernames() || [];
  const performers = [
    ...(usernames.filter((u) => ["Supervisor", "Mechanic"].includes(u.Role)).map((u) => u.Name) || []),
  ];

  // if current user not listed, add them
  if (user?.full_name && !performers.includes(user.full_name)) {
    performers.unshift(user.full_name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto p-6">
        <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          Maintenance Form
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
          {/* Date */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Date</label>
            <input type="date" name="Date" value={formData.Date} readOnly className="w-full p-2 rounded bg-gray-800 text-gray-200 cursor-not-allowed" />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Model / Type</label>
            <select name="Model / Type" value={formData["Model / Type"]} onChange={handleChange} className="w-full p-2 rounded bg-gray-800">
              <option value="">Choose model</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Plate */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Plate Number</label>
            <select name="Plate Number" value={formData["Plate Number"]} onChange={handleChange} className="w-full p-2 rounded bg-gray-800">
              <option value="">Choose plate</option>
              {plates.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Driver</label>
            <select name="Driver" value={formData.Driver} onChange={handleChange} className="w-full p-2 rounded bg-gray-800">
              <option value="">Choose driver</option>
              {drivers.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description of Work</label>
            <textarea name="Description of Work" value={formData["Description of Work"]} onChange={handleChange} rows={3} className="w-full p-2 rounded bg-gray-800" />
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Performed By</label>
            <select name="Performed By" value={formData["Performed By"]} onChange={handleChange} className="w-full p-2 rounded bg-gray-800">
              <option value="">Choose</option>
              <option value={user?.full_name}>{user?.full_name} (me)</option>
              {performers.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Comments</label>
            <textarea name="Comments" value={formData.Comments} onChange={handleChange} rows={2} className="w-full p-2 rounded bg-gray-800" />
          </div>

          {/* Photos */}
          {["Photo Before", "Photo After", "Photo Repair/Problem"].map((field) => (
            <div key={field}>
              <label className="block text-sm text-gray-300 mb-1">{field}</label>
              <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageChange(e, field)} className="w-full text-sm text-gray-300" />
              {formData[field] ? (
                <img src={formData[field]} alt={field} className="mt-2 max-h-40 rounded" />
              ) : null}
            </div>
          ))}

          <div>
            <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-400 font-semibold">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
}
