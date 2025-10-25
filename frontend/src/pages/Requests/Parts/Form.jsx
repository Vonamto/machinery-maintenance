// frontend/src/pages/Requests/Parts/Form.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
// Import the custom hook instead of the context object
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";

export default function PartsRequestForm() {
  // Use the custom hook
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
      // Prepare the payload: include the form data and set Status to "Pending"
      const payload = {
        ...form,
        Status: "Pending" // Add the default status here before sending
      };
      const res = await fetchWithAuth("/api/add/Requests_Parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send the updated payload
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
    // Apply main theme background and text color
    <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto p-6">
        {/* Back button - Apply theme color */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-theme-primary-500 hover:text-theme-primary-400 mb-4 transition">
          <ArrowLeft size={18} /> Back
        </button>
        {/* Title - Keep the gradient for visual appeal */}
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Request Spare Parts
        </h1>
        <form onSubmit={handleSubmit} 
              // Apply a darker theme background for the form container, keeping distinct field styles
              className="space-y-5 bg-theme-background-secondary p-6 rounded-2xl border border-theme-border-light shadow-lg">
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Request Date</label>
            {/* Keep original bg-gray-800 for this specific field */}
            <input type="date" value={form["Request Date"]} onChange={(e) => handleChange("Request Date", e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" />
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Model / Type</label>
            {/* Keep original bg-gray-800 for this specific field */}
            <select value={form["Model / Type"]} onChange={(e) => handleChange("Model / Type", e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white">
              <option value="">--- Choose Model ---</option>
              {modelOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Plate Number</label>
            {/* Keep original bg-gray-800 for this specific field */}
            <select value={form["Plate Number"]} onChange={(e) => handleChange("Plate Number", e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white">
              <option value="">--- Choose Plate ---</option>
              {plateOptions.length ? plateOptions.map((p) => (<option key={p} value={p}>{p}</option>)) : cache.getEquipment ? (cache.getEquipment() || []).map((e) => (<option key={e["Plate Number"]} value={e["Plate Number"]}>{e["Plate Number"]}</option>)) : null}
            </select>
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Driver</label>
            {/* Keep original bg-gray-800 for this specific field */}
            <select value={form.Driver} onChange={(e) => handleChange("Driver", e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white">
              <option value="">--- Choose Driver ---</option>
              {driverOptions.length ? driverOptions.map((d) => (<option key={d} value={d}>{d}</option>)) : Array.from(new Set((cache.getEquipment ? cache.getEquipment() : cache.equipment || []).flatMap((eq) => [eq["Driver 1"], eq["Driver 2"], eq["Driver"]]).filter(Boolean))).map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Requested Parts</label>
            {/* Keep original bg-gray-800 for this specific field */}
            <textarea rows={3} value={form["Requested Parts"]} onChange={(e) => handleChange("Requested Parts", e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white" placeholder="List the parts needed..." />
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-1">Comments</label>
            {/* Keep original bg-gray-800 for this specific field */}
            <textarea rows={2} value={form.Comments} onChange={(e) => handleChange("Comments", e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white" />
          </div>
          <div>
            <label className="block text-sm text-theme-text-secondary mb-2">Attachment Photo</label>
            <div className="flex gap-3">
              {/* Keep original bg-blue-600 for Upload button */}
              <label className="flex items-center gap-2 cursor-pointer bg-theme-primary-600 hover:bg-theme-primary-700 text-theme-text-primary px-3 py-2 rounded">
                <Upload size={16} />Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Attachment Photo")} />
              </label>
              {/* Keep original bg-cyan-600 for Camera button */}
              <label className="flex items-center gap-2 cursor-pointer bg-theme-secondary-600 hover:bg-theme-secondary-700 text-theme-text-primary px-3 py-2 rounded">
                <Camera size={16} />Camera<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], "Attachment Photo")} />
              </label>
            </div>
            {form["Attachment Photo"] && (
              <img
                src={form["Attachment Photo"]}
                alt="Attachment"
                // Apply theme border color to photo
                className="mt-3 max-h-44 rounded border border-theme-border-light object-contain"
              />
            )}
          </div>
          <div>
            {/* Keep original gradient for Submit button */}
            <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-gradient-to-r from-theme-primary-600 to-theme-secondary-500 hover:brightness-110 text-theme-text-primary font-semibold">
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
