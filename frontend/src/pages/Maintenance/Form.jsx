// frontend/src/pages/Maintenance/Form.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
// Import the custom hook instead of the context object
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";

/**
 * Add Maintenance Log Form
 * - Date auto-filled but editable
 * - Model / Plate / Driver interdependent dropdowns
 * - Performed By dropdown shows users with Role Supervisor or Mechanic
 * - Photo upload (file or camera) -> base64 preview
 * - Submits to POST /api/add/Maintenance_Log (protected)
 */

export default function MaintenanceForm() {
  // Use the custom hook
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();

  const todayDate = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    Date: todayDate,
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

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Load models from cache
  useEffect(() => {
    const models = cache.getModels ? cache.getModels() : [];
    setModelOptions(models);
  }, [cache]);

  // When model changes → update plates
  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }
    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);
  }, [form["Model / Type"], cache]);

  // When plate changes → update model & drivers
  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      setDriverOptions([]);
      return;
    }
    const eq = cache.getEquipmentByPlate ? cache.getEquipmentByPlate(plate) : null;
    if (eq) {
      setForm((p) => ({
        ...p,
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      const drivers = cache.getDriversByPlate ? cache.getDriversByPlate(plate) : [];
      setDriverOptions(drivers);
    }
  }, [form["Plate Number"], cache]);

  // When driver changes → try to fill model & plate
  useEffect(() => {
    const driver = form.Driver;
    if (!driver) return;

    const allEquipment = cache.getEquipment ? cache.getEquipment() : cache.equipment || [];
    const matches = (allEquipment || []).filter(
      (e) => e["Driver 1"] === driver || e["Driver 2"] === driver || e["Driver"] === driver
    );

    if (matches.length === 1) {
      const eq = matches[0];
      setForm((p) => ({
        ...p,
        "Plate Number": eq["Plate Number"] || p["Plate Number"],
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions([matches[0]["Driver 1"], matches[0]["Driver 2"]].filter(Boolean));
    } else if (matches.length > 1) {
      setPlateOptions(matches.map((m) => m["Plate Number"]));
      setDriverOptions([
        ...new Set(matches.flatMap((m) => [m["Driver 1"], m["Driver 2"]]).filter(Boolean)),
      ]);
    } else {
      setPlateOptions([]);
    }
  }, [form.Driver, cache]);

  // Generic change handler
  const handleChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Convert file to base64
  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver) {
      alert("Please choose at least Model, Plate Number, or Driver.");
      return;
    }
    if (!form["Description of Work"]) {
      alert("Please enter a description of work.");
      return;
    }
    if (!form["Performed By"]) {
      alert("Please select who performed the work.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/add/Maintenance_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.status === "success") {
        alert("✅ Maintenance log added successfully.");
        navigate("/maintenance");
      } else {
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Network error submitting form.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get performer names (Supervisor + Mechanic)
  const cachedUsers = cache.getUsernames ? cache.getUsernames() : cache.usernames || [];
  const performers = (cachedUsers || [])
    .filter((u) => u.Role && ["Supervisor", "Mechanic"].includes(u.Role))
    .map((u) => u.Name || u["Full Name"])
    .filter(Boolean);

  if (user?.full_name && !performers.includes(user.full_name)) {
    performers.unshift(user.full_name);
  }

  return (
    // Apply main theme background and text color
    <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
      <Navbar user={user} />

      <div className="max-w-3xl mx-auto p-6">
        {/* Back button - Apply theme color */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-theme-primary-500 hover:text-theme-primary-400 mb-4 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Title - Keep the gradient for visual appeal */}
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Add Maintenance Log
        </h1>

        <form
          onSubmit={handleSubmit}
          // Apply theme colors for form container
          className="space-y-5 bg-theme-background-surface p-6 rounded-2xl border border-theme-border-light shadow-lg"
        >
          {/* Date */}
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Date</label>
            <input
              type="date"
              name="Date"
              value={form.Date}
              onChange={(e) => handleChange("Date", e.target.value)}
              // Apply theme colors for input
              className="w-full p-2 rounded bg-theme-background-secondary text-theme-text-primary border border-theme-border-light"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Model / Type</label>
            <select
              value={form["Model / Type"]}
              onChange={(e) => handleChange("Model / Type", e.target.value)}
              // Apply theme colors for select
              className="w-full p-2 rounded bg-theme-background-secondary text-theme-text-primary"
            >
              <option value="">— Choose Model —</option>
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Plate */}
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Plate Number</label>
            <select
              value={form["Plate Number"]}
              onChange={(e) => handleChange("Plate Number", e.target.value)}
              // Apply theme colors for select
              className="w-full p-2 rounded bg-theme-background-secondary text-theme-text-primary"
            >
              <option value="">— Choose Plate —</option>
              {plateOptions.length
                ? plateOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                : cache.getEquipment
                ? (cache.getEquipment() || []).map((e) => (
                    <option key={e["Plate Number"]} value={e["Plate Number"]}>
                      {e["Plate Number"]}
                    </option>
                  ))
                : null}
            </select>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Driver</label>
            <select
              value={form.Driver}
              onChange={(e) => handleChange("Driver", e.target.value)}
              // Apply theme colors for select
              className="w-full p-2 rounded bg-theme-background-secondary text-theme-text-primary"
            >
              <option value="">— Choose Driver —</option>
              {driverOptions.length
                ? driverOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))
                : Array.from(
                    new Set(
                      (cache.getEquipment ? cache.getEquipment() : cache.equipment || [])
                        .flatMap((eq) => [eq["Driver 1"], eq["Driver 2"], eq["Driver"]])
                        .filter(Boolean)
                    )
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Description of Work</label>
            <textarea
              rows={3}
              value={form["Description of Work"]}
              onChange={(e) => handleChange("Description of Work", e.target.value)}
              // Apply theme colors for textarea
              className="w-full p-2 rounded bg-theme-background-secondary text-theme-text-primary"
              placeholder="Describe the maintenance performed..."
            />
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Performed By</label>
            <select
              value={form["Performed By"]}
              onChange={(e) => handleChange("Performed By", e.target.value)}
              // Apply theme colors for select
              className="w-full p-2 rounded bg-theme-background-secondary text-theme-text-primary"
            >
              <option value="">— Select Performer —</option>
              {performers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Comments</label>
            <textarea
              rows={2}
              value={form.Comments}
              onChange={(e) => handleChange("Comments", e.target.value)}
              // Apply theme colors for textarea
              className="w-full p-2 rounded bg-theme-background-secondary text-theme-text-primary"
            />
          </div>

          {/* Photos */}
          {["Photo Before", "Photo After", "Photo Repair/Problem"].map((field) => (
            <div key={field}>
              <label className="block text-sm text-theme-text-secondary mb-2">{field}</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-theme-primary-600 hover:bg-theme-primary-700 text-theme-text-primary px-3 py-2 rounded">
                  <Upload size={16} />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0], field)}
                  />
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-theme-secondary-600 hover:bg-theme-secondary-700 text-theme-text-primary px-3 py-2 rounded">
                  <Camera size={16} />
                  Camera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0], field)}
                  />
                </label>
              </div>

              {form[field] && (
                <img
                  src={form[field]}
                  alt={field}
                  className="mt-3 max-h-44 rounded border border-theme-border-light object-contain"
                />
              )}
            </div>
          ))}

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              // Apply theme colors for submit button
              className="w-full py-3 rounded-lg bg-gradient-to-r from-theme-primary-600 to-theme-secondary-500 hover:brightness-110 text-theme-text-primary font-semibold"
            >
              {submitting ? "Submitting..." : "Submit Maintenance Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
