// frontend/src/pages/Maintenance/Form.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";

/**
 * Add Maintenance Log Form
 * - Date auto-filled but editable (user requested auto-fill, not locked)
 * - Model / Plate / Driver interdependent dropdowns (choose any order)
 * - Performed By dropdown shows users with Role Supervisor or Mechanic + "Myself"
 * - Photo upload (file or camera) -> base64 preview
 * - Submits to POST /api/add/Maintenance_Log (protected)
 */

export default function MaintenanceForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();

  // initial date auto-filled but editable
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

  // load models from cache
  useEffect(() => {
    const models = cache.getModels ? cache.getModels() : [];
    setModelOptions(models);
  }, [cache]);

  // When model changes -> set plates matching model
  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      // do not clear plate/driver automatically here; leave to user
      return;
    }
    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);
    // if only one plate, optionally preselect? we'll leave selection to user
  }, [form["Model / Type"], cache]);

  // When plate changes -> auto-fill model & drivers
  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      setDriverOptions([]);
      return;
    }
    const eq = cache.getEquipmentByPlate ? cache.getEquipmentByPlate(plate) : null;
    if (eq) {
      // auto-fill model if missing or different
      setForm((p) => ({
        ...p,
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
      const drivers = cache.getDriversByPlate ? cache.getDriversByPlate(plate) : [];
      setDriverOptions(drivers);
    }
  }, [form["Plate Number"], cache]);

  // When driver selected -> try to fill plate+model if unique or present plate choices if multiple
  useEffect(() => {
    const driver = form.Driver;
    if (!driver) {
      return;
    }

    // find equipment rows that include this driver
    const allEquipment = cache.getEquipment ? cache.getEquipment() : cache.equipment || [];
    const matches = (allEquipment || []).filter(
      (e) => (e["Driver 1"] === driver) || (e["Driver 2"] === driver) || (e["Driver"] === driver)
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
      // multiple vehicles: let user choose plate among matches
      setPlateOptions(matches.map((m) => m["Plate Number"]));
      // keep drivers as-is (could be duplicates)
      setDriverOptions([...new Set(matches.flatMap((m) => [m["Driver 1"], m["Driver 2"]]).filter(Boolean))]);
    } else {
      // no match — clear plate options
      setPlateOptions([]);
    }
  }, [form.Driver, cache]);

  // generic change handler
  const handleChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  // file -> base64
  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange(field, reader.result);
    };
    reader.readAsDataURL(file);
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // validation: minimal
    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver) {
      alert("Please choose at least Model, Plate Number or Driver.");
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
        alert("✅ Maintenance log added.");
        // navigate back to maintenance menu
        navigate("/maintenance");
      } else {
        alert("❌ Error: " + (data.message || "Unknown"));
      }
    } catch (err) {
      console.error("submit error", err);
      alert("Network error submitting form.");
    } finally {
      setSubmitting(false);
    }
  };

  // Performed by options: from cached usernames (safe list)
  const cachedUsers = cache.getUsernames ? cache.getUsernames() : cache.usernames || [];
  const performers = (cachedUsers || [])
    .filter((u) => u.Role && ["Supervisor", "Mechanic"].includes(u.Role))
    .map((u) => u.Name || u["Full Name"] || u.Name)
    .filter(Boolean);

  // ensure current user present in options
  if (user?.full_name && !performers.includes(user.full_name)) {
    performers.unshift(user.full_name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Add Maintenance Log
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white/6 p-6 rounded-2xl border border-white/10 shadow-lg">
          {/* Date (auto-fill but editable) */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Date</label>
            <input
              type="date"
              name="Date"
              value={form.Date}
              onChange={(e) => handleChange("Date", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Model / Type</label>
            <select
              value={form["Model / Type"]}
              onChange={(e) => handleChange("Model / Type", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
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
            <label className="block text-sm text-gray-300 mb-1">Plate Number</label>
            <select
              value={form["Plate Number"]}
              onChange={(e) => handleChange("Plate Number", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="">— Choose Plate —</option>
              {plateOptions.length
                ? plateOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))
                : // if no filtered plates, fallback to all equipment plates so user can still choose
                  cache.getEquipment
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
            <label className="block text-sm text-gray-300 mb-1">Driver</label>
            <select
              value={form.Driver}
              onChange={(e) => handleChange("Driver", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="">— Choose Driver —</option>
              {driverOptions.length
                ? driverOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))
                : // fallback to all drivers available in equipment
                  Array.from(
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
            <label className="block text-sm text-gray-300 mb-1">Description of Work</label>
            <textarea
              rows={3}
              value={form["Description of Work"]}
              onChange={(e) => handleChange("Description of Work", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
              placeholder="Describe the maintenance performed..."
            />
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Performed By</label>
            <select
              value={form["Performed By"]}
              onChange={(e) => handleChange("Performed By", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="">{user?.full_name ? `Myself (${user.full_name})` : "Select performer"}</option>
              {performers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Comments</label>
            <textarea
              rows={2}
              value={form.Comments}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
          </div>

          {/* Photos */}
          {["Photo Before", "Photo After", "Photo Repair/Problem"].map((field) => (
            <div key={field}>
              <label className="block text-sm text-gray-300 mb-2">{field}</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">
                  <Upload size={16} />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0], field)}
                  />
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded">
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
                  className="mt-3 max-h-44 rounded border border-white/10 object-contain"
                />
              )}
            </div>
          ))}

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold"
            >
              {submitting ? "Submitting..." : "Submit Maintenance Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
