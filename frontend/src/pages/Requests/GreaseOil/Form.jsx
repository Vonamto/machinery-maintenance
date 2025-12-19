// frontend/src/pages/Requests/GreaseOil/Form.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Droplets } from "lucide-react";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { useCache } from "../../../context/CacheContext";
import { fetchWithAuth } from "../../../api/api";

export default function GreaseOilForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cache = useCache();
  const todayDate = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    "Request Date": todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Request Type": "",        // ✅ THIS IS THE KEY
    Comments: "",
    "Photo Before": "",
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  /* -------------------- dropdown logic -------------------- */

  useEffect(() => {
    setModelOptions(cache.getModels?.() || []);
  }, [cache]);

  useEffect(() => {
    if (!form["Model / Type"]) return setPlateOptions([]);
    setPlateOptions(cache.getPlatesByModel?.(form["Model / Type"]) || []);
  }, [form["Model / Type"], cache]);

  useEffect(() => {
    if (!form["Plate Number"]) return setDriverOptions([]);
    const eq = cache.getEquipmentByPlate?.(form["Plate Number"]);
    if (eq) {
      setForm(p => ({ ...p, "Model / Type": eq["Model / Type"] }));
      setDriverOptions(cache.getDriversByPlate?.(form["Plate Number"]) || []);
    }
  }, [form["Plate Number"], cache]);

  useEffect(() => {
    if (!form.Driver) return;
    const all = cache.getEquipment?.() || [];
    const matches = all.filter(
      e => e["Driver 1"] === form.Driver || e["Driver 2"] === form.Driver
    );
    if (matches.length === 1) {
      setForm(p => ({
        ...p,
        "Plate Number": matches[0]["Plate Number"],
        "Model / Type": matches[0]["Model / Type"],
      }));
    }
  }, [form.Driver, cache]);

  const handleChange = (name, value) => {
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleFile = (file, field) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange(field, reader.result);
    reader.readAsDataURL(file);
  };

  /* -------------------- submit -------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form["Request Type"]) {
      alert("Please select a request type.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, Status: "Pending" };

      const res = await fetchWithAuth("/api/add/Grease_Oil_Requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.status === "success") {
        alert("✅ Grease/Oil request submitted successfully.");
        navigate("/requests/grease-oil");
      } else {
        alert("❌ " + (data.message || "Error"));
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-6">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-cyan-400 mb-6">
          <ArrowLeft size={18} /> Back
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Request Type */}
          <div>
            <label className="block mb-2 text-sm">Request Type</label>
            <select
              value={form["Request Type"]}
              onChange={(e) => handleChange("Request Type", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            >
              <option value="">--- Select Request Type ---</option>
              <option value="Oil Service">Oil Service</option>
              <option value="Grease Service">Grease Service</option>
              <option value="Full Service (Oil + Greasing)">
                Full Service (Oil + Greasing)
              </option>
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block mb-2 text-sm">Comments</label>
            <textarea
              rows={3}
              value={form.Comments}
              onChange={(e) => handleChange("Comments", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            />
          </div>

          {/* Photo Before */}
          <div className="flex gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-orange-600 px-4 py-3 rounded-xl">
              <Upload size={18} /> Upload
              <input type="file" hidden accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0], "Photo Before")} />
            </label>

            <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-orange-700 px-4 py-3 rounded-xl">
              <Camera size={18} /> Camera
              <input type="file" hidden accept="image/*" capture="environment"
                onChange={(e) => handleFile(e.target.files?.[0], "Photo Before")} />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-orange-600 rounded-xl"
          >
            {submitting ? "Submitting..." : "Submit Grease/Oil Request"}
          </button>

        </form>
      </div>
    </div>
  );
}
