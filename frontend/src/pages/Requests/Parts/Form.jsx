// frontend/src/pages/Requests/Parts/Form.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Package } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";

export default function PartsRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();
  const todayDate = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    "Request Date": todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Requested Parts": "",
    Comments: "",
    "Attachment Photo": "",
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const models = cache.getModels ? cache.getModels() : [];
    setModelOptions(models);
  }, [cache]);

  useEffect(() => {
    const model = form["Model / Type"];
    if (!model) {
      setPlateOptions([]);
      return;
    }
    const plates = cache.getPlatesByModel ? cache.getPlatesByModel(model) : [];
    setPlateOptions(plates);
  }, [form["Model / Type"], cache]);

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

  const handleChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form["Model / Type"] && !form["Plate Number"] && !form.Driver) {
      alert("Please choose at least Model, Plate Number, or Driver.");
      return;
    }
    if (!form["Requested Parts"]) {
      alert("Please enter the requested parts.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, Status: "Pending" };
      const res = await fetchWithAuth("/api/add/Requests_Parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("✅ Parts request submitted successfully.");
        navigate("/requests/parts");
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

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/50">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Maintenance & Spare Parts Request
            </h1>
            <p className="text-gray-400 text-sm mt-1">Fill in the details below to submit your request</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Request Date</label>
              <input
                type="date"
                value={form["Request Date"]}
                onChange={(e) => handleChange("Request Date", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">Model / Type</label>
              <select
                value={form["Model / Type"]}
                onChange={(e) => handleChange("Model / Type", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
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
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
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
                className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                <option value="">--- Choose Driver ---</option>
                {driverOptions.length
                  ? driverOptions.map((d) => (<option key={d} value={d}>{d}</option>))
                  : Array.from(new Set((cache.getEquipment ? cache.getEquipment() : cache.equipment || []).flatMap((eq) => [eq["Driver 1"], eq["Driver 2"], eq["Driver"]]).filter(Boolean))).map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-2">Describe Your Request</label>
            <textarea
              rows={4}
              value={form["Requested Parts"]}
              onChange={(e) => handleChange("Requested Parts", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
              placeholder="Describe the Problem or Needed Part"
            />
          </div>

          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-2">Comments (Optional)</label>
            <textarea
              rows={3}
              value={form.Comments}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="group">
            <label className="block text-sm font-medium text-gray-300 mb-3">Attachment Photo</label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50">
                <Upload size={18} />
                <span className="font-medium">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Attachment Photo")} />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50">
                <Camera size={18} />
                <span className="font-medium">Camera</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Attachment Photo")} />
              </label>
            </div>
            {form["Attachment Photo"] && (
              <div className="mt-4 p-2 bg-gray-800/30 rounded-xl border border-gray-700">
                <img
                  src={form["Attachment Photo"]}
                  alt="Attachment Preview"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              "Submit Request"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
