// frontend/src/pages/Requests/GreaseOil/Form.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Droplets } from "lucide-react"; // Changed icon
import Navbar from "../../../components/Navbar"; // Adjusted path
import { useAuth } from "../../../context/AuthContext"; // Adjusted path
import { useCache } from "../../../context/CacheContext"; // Adjusted path
import { fetchWithAuth } from "../../../api/api"; // Adjusted path

export default function GreaseOilForm() {
  const { user } = useAuth(); // User info is still needed for potential 'Performed By' default or context
  const navigate = useNavigate();
  const cache = useCache();
  const todayDate = new Date().toISOString().split("T")[0]; // Auto-fill date

  // State for form fields
  const [form, setForm] = useState({
    "Request Date": todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Request Type": "", // New field
    Comments: "",
    "Photo Before": "", // Renamed field
  });

  // State for dynamic dropdown options
  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Effect to load Model options from cache
  useEffect(() => {
    const models = cache.getModels ? cache.getModels() : [];
    setModelOptions(models);
  }, [cache]);

  // Effect to load Plate options based on selected Model
  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }
    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);
  }, [form["Model / Type"], cache]);

  // Effect to load Driver options based on selected Plate Number
  useEffect(() => {
    const plate = form["Plate Number"];
    if (!plate) {
      setDriverOptions([]);
      return;
    }
    const eq = cache.getEquipmentByPlate ? cache.getEquipmentByPlate(plate) : null;
    if (eq) {
      setForm((p) => ({ ...p, "Model / Type": eq["Model / Type"] || p["Model / Type"] }));
      const drivers = cache.getDriversByPlate ? cache.getDriversByPlate(plate) : [];
      setDriverOptions(drivers);
    }
  }, [form["Plate Number"], cache]);

  // Effect to auto-fill Model and Plate based on selected Driver
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
      setDriverOptions([...new Set(matches.flatMap((m) => [m["Driver 1"], m["Driver 2"]]).filter(Boolean))]);
    } else {
      setPlateOptions([]);
    }
  }, [form.Driver, cache]);

  // Handle changes for standard inputs
  const handleChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Handle file uploads (Photo Before)
  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver) {
      alert("Please choose at least Model, Plate Number, or Driver.");
      return;
    }
    if (!form["Request Type"]) {
      alert("Please select a request type.");
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload, adding default "Pending" status
      const payload = { ...form, Status: "Pending" }; // Set default status here

      const res = await fetchWithAuth("/api/add/Grease_Oil_Requests", { // Corrected API endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.status === "success") {
        alert("✅ Grease/Oil request submitted successfully.");
        navigate("/requests/grease-oil"); // Navigate back to the grease oil menu index
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        {/* Header with Icon - Consistent style, using Droplets for oil/grease */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500 shadow-lg shadow-amber-500/50"> {/* Changed gradient to reflect oil/grease theme */}
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"> {/* Changed gradient for title */}
              Request Grease/Oil Service
            </h1>
            <p className="text-gray-400 text-sm mt-1">Fill in the details below to submit your service request</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grid for Date, Model, Plate, Driver */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Request Date</label>
              <input
                type="date"
                value={form["Request Date"]}
                onChange={(e) => handleChange("Request Date", e.target.value)} // Allow user to change date if needed
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" // Changed focus color
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Model / Type</label>
              <select
                value={form["Model / Type"]}
                onChange={(e) => handleChange("Model / Type", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" // Changed focus color
              >
                <option value="">--- Choose Model ---</option>
                {modelOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Plate Number</label>
              <select
                value={form["Plate Number"]}
                onChange={(e) => handleChange("Plate Number", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" // Changed focus color
              >
                <option value="">--- Choose Plate ---</option>
                {plateOptions.length
                  ? plateOptions.map((p) => (<option key={p} value={p}>{p}</option>))
                  : cache.getEquipment
                  ? (cache.getEquipment() || []).map((e) => (<option key={e["Plate Number"]} value={e["Plate Number"]}>{e["Plate Number"]}</option>))
                  : null}
              </select>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Driver</label>
              <select
                value={form.Driver}
                onChange={(e) => handleChange("Driver", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" // Changed focus color
              >
                <option value="">--- Choose Driver ---</option>
                {driverOptions.length
                  ? driverOptions.map((d) => (<option key={d} value={d}>{d}</option>))
                  : Array.from(new Set((cache.getEquipment ? cache.getEquipment() : cache.equipment || []).flatMap((eq) => [eq["Driver 1"], eq["Driver 2"], eq["Driver"]]).filter(Boolean))).map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
          </div>

          {/* Request Type Dropdown */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-2">Request Type *</label>
            <select
              value={form["Request Type"]}
              onChange={(e) => handleChange("Request Type", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" // Changed focus color
            >
              <option value="">--- Select Request Type ---</option>
              <option value="Oil Service">Oil Service</option>
              <option value="Grease Service">Grease Service</option>
              <option value="Full Service (Oil + Greasing)">Full Service (Oil + Greasing)</option>
            </select>
          </div>

          {/* Comments */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-2">Comments (Optional)</label>
            <textarea
              rows={3}
              value={form.Comments}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
              placeholder="Additional notes..."
            />
          </div>

          {/* Photo Before Upload */}
          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-3">Photo Before (Optional)</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50"> {/* Changed button color */}
                <Upload size={18} />
                <span className="font-medium">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Photo Before")} />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"> {/* Changed button color */}
                <Camera size={18} />
                <span className="font-medium">Camera</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Photo Before")} />
              </label>
            </div>
            {form["Photo Before"] && (
              <div className="mt-4 p-2 bg-gray-800/30 rounded-xl border border-gray-700">
                <img
                  src={form["Photo Before"]}
                  alt="Photo Before Preview"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-semibold text-lg shadow-lg shadow-amber-500/50 hover:shadow-amber-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed" // Changed button gradient
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Grease/Oil Request"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
