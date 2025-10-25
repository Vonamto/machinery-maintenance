// frontend/src/pages/Requests/Parts/Form.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload } from "lucide-react";
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
      setForm((p) => ({
        ...p,
        "Model / Type": eq["Model / Type"] || p["Model / Type"],
      }));
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
      setDriverOptions([
        ...new Set(matches.flatMap((m) => [m["Driver 1"], m["Driver 2"]]).filter(Boolean)),
      ]);
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
      const res = await fetchWithAuth("/api/add/Requests_Parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Request Spare Parts
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg"
        >
          <div>
            <label className="block text-sm text-gray-300 mb-1">Request Date</label>
            <input
              type="date"
              value={form["Request Date"]}
              onChange={(e) => handleChange("Request Date", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Model / Type</label>
            <select
              value={form["Model / Type"]}
              onChange={(e) => handleChange("Model / Type", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="">--- Choose Model ---</option>
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Plate Number</label>
            <select
              value={form["Plate Number"]}
              onChange={(e) => handleChange("Plate Number", e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            >
              <option value="">--- Choose Plate ---</option>
              {plateOptions.length
                ? plateOptions.map((p) => (
                    <option key={p} value={p}>
