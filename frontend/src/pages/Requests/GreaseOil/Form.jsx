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

  // State for form fields
  const [form, setForm] = useState({
    "Request Date": todayDate,
    "Model / Type": "",
    "Plate Number": "",
    Driver: "",
    "Request Type (Oil/Grease)": "", // ✅ FIXED KEY
    Comments: "",
    "Photo Before": "",
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setModelOptions(cache.getModels ? cache.getModels() : []);
  }, [cache]);

  useEffect(() => {
    if (!form["Model / Type"]) {
      setPlateOptions([]);
      return;
    }
    setPlateOptions(cache.getPlatesByModel ? cache.getPlatesByModel(form["Model / Type"]) : []);
  }, [form["Model / Type"], cache]);

  useEffect(() => {
    if (!form["Plate Number"]) {
      setDriverOptions([]);
      return;
    }
    const eq = cache.getEquipmentByPlate ? cache.getEquipmentByPlate(form["Plate Number"]) : null;
    if (eq) {
      setForm((p) => ({ ...p, "Model / Type": eq["Model / Type"] }));
      setDriverOptions(cache.getDriversByPlate ? cache.getDriversByPlate(form["Plate Number"]) : []);
    }
  }, [form["Plate Number"], cache]);

  useEffect(() => {
    if (!form.Driver) return;
    const all = cache.getEquipment ? cache.getEquipment() : cache.equipment || [];
    const matches = all.filter(
      (e) =>
        e["Driver 1"] === form.Driver ||
        e["Driver 2"] === form.Driver ||
        e["Driver"] === form.Driver
    );
    if (matches.length === 1) {
      const eq = matches[0];
      setForm((p) => ({
        ...p,
        "Plate Number": eq["Plate Number"],
        "Model / Type": eq["Model / Type"],
      }));
      setPlateOptions([eq["Plate Number"]]);
      setDriverOptions([eq["Driver 1"], eq["Driver 2"]].filter(Boolean));
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

    if (!form["Request Type (Oil/Grease)"]) {
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
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error submitting form.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto p-6">

        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 mb-6">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600 to-orange-500">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Request Grease/Oil Service
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Fill in the details below to submit your service request
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid md:grid-cols-2 gap-6">
            <input type="date" value={form["Request Date"]}
              onChange={(e) => handleChange("Request Date", e.target.value)}
              className="p-3 rounded-xl bg-gray-800 border border-gray-700" />

            <select value={form["Model / Type"]}
              onChange={(e) => handleChange("Model / Type", e.target.value)}
              className="p-3 rounded-xl bg-gray-800 border border-gray-700">
              <option value="">--- Choose Model ---</option>
              {modelOptions.map((m) => <option key={m}>{m}</option>)}
            </select>

            <select value={form["Plate Number"]}
              onChange={(e) => handleChange("Plate Number", e.target.value)}
              className="p-3 rounded-xl bg-gray-800 border border-gray-700">
              <option value="">--- Choose Plate ---</option>
              {plateOptions.map((p) => <option key={p}>{p}</option>)}
            </select>

            <select value={form.Driver}
              onChange={(e) => handleChange("Driver", e.target.value)}
              className="p-3 rounded-xl bg-gray-800 border border-gray-700">
              <option value="">--- Choose Driver ---</option>
              {driverOptions.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* ✅ Request Type */}
          <select
            value={form["Request Type (Oil/Grease)"]}
            onChange={(e) =>
              handleChange("Request Type (Oil/Grease)", e.target.value)
            }
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
          >
            <option value="">--- Select Request Type ---</option>
            <option value="Oil Service">Oil Service</option>
            <option value="Grease Service">Grease Service</option>
            <option value="Full Service (Oil + Greasing)">
              Full Service (Oil + Greasing)
            </option>
          </select>

          <textarea
            rows={3}
            value={form.Comments}
            onChange={(e) => handleChange("Comments", e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700"
            placeholder="Additional notes..."
          />

          <div className="flex gap-3">
            <label className="flex-1 bg-amber-600 p-3 rounded-xl cursor-pointer text-center">
              <Upload size={18} /> Upload
              <input type="file" hidden accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0], "Photo Before")} />
            </label>

            <label className="flex-1 bg-orange-600 p-3 rounded-xl cursor-pointer text-center">
              <Camera size={18} /> Camera
              <input type="file" hidden accept="image/*" capture="environment"
                onChange={(e) => handleFile(e.target.files?.[0], "Photo Before")} />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500"
          >
            {submitting ? "Submitting..." : "Submit Grease/Oil Request"}
          </button>

        </form>
      </div>
    </div>
  );
}
