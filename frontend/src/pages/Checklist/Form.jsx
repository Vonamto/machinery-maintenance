import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";
import { getChecklistTemplate } from "@/config/checklistTemplates";

export default function ChecklistForm() {
  const { user } = useAuth();
  const { equipment, loading } = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /* ---------------- STATE ---------------- */
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Full Name": user?.full_name || "",
    "Model / Type": "",
    "Plate Number": "",
    "Equipment Type": "",
    "Checklist Data": ""
  });

  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [checklistData, setChecklistData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- ACCESS CONTROL ---------------- */
  useEffect(() => {
    if (user?.role === "Cleaning Guy") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* ---------------- LOADING (SAME AS OTHER PAGES) ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  /* ---------------- POPULATE DROPDOWNS ---------------- */
  useEffect(() => {
    if (!equipment?.length) return;

    if (user?.role === "Driver") {
      const driverEq = equipment.filter(
        eq =>
          eq["Driver 1"] === user.full_name ||
          eq["Driver 2"] === user.full_name
      );
      setModelOptions([...new Set(driverEq.map(e => e["Model / Type"]))]);
      setPlateOptions(driverEq.map(e => e["Plate Number"]));
    } else {
      setModelOptions([...new Set(equipment.map(e => e["Model / Type"]))]);
      setPlateOptions(equipment.map(e => e["Plate Number"]));
    }
  }, [equipment, user]);

  /* ---------------- MODEL CHANGE ---------------- */
  useEffect(() => {
    if (!formData["Model / Type"]) return;

    let filtered = equipment;

    if (user?.role === "Driver") {
      filtered = equipment.filter(
        eq =>
          eq["Model / Type"] === formData["Model / Type"] &&
          (eq["Driver 1"] === user.full_name ||
            eq["Driver 2"] === user.full_name)
      );
    } else {
      filtered = equipment.filter(
        eq => eq["Model / Type"] === formData["Model / Type"]
      );
    }

    setPlateOptions(filtered.map(eq => eq["Plate Number"]));

    if (!filtered.some(eq => eq["Plate Number"] === formData["Plate Number"])) {
      setFormData(prev => ({ ...prev, "Plate Number": "" }));
    }
  }, [formData["Model / Type"], equipment, user]);

  /* ---------------- PLATE CHANGE ---------------- */
  useEffect(() => {
    if (!formData["Plate Number"]) return;

    const found = equipment.find(
      eq => eq["Plate Number"] === formData["Plate Number"]
    );

    if (found) {
      setFormData(prev => ({
        ...prev,
        "Model / Type": found["Model / Type"],
        "Equipment Type": found["Equipment Type"]
      }));
    }
  }, [formData["Plate Number"], equipment]);

  /* ---------------- INIT CHECKLIST (SAFE) ---------------- */
  useEffect(() => {
    if (!formData["Plate Number"] || !formData["Equipment Type"]) return;

    const template = getChecklistTemplate(formData["Equipment Type"]);
    if (!template.length) return;

    const initial = {};
    template.forEach(section => {
      section.items.forEach(item => {
        const key = `${section.sectionKey}.${item.key}`;
        initial[key] = { status: null, comment: "", photo: "" };
      });
    });

    setChecklistData(initial);
  }, [formData["Plate Number"], formData["Equipment Type"]]);

  /* ---------------- HANDLERS ---------------- */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (key, status) => {
    setChecklistData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        comment: status === "OK" ? "" : prev[key].comment
      }
    }));
  };

  const handleCommentChange = (key, value) => {
    setChecklistData(prev => ({
      ...prev,
      [key]: { ...prev[key], comment: value }
    }));
  };

  const handlePhotoUpload = (key, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setChecklistData(prev => ({
        ...prev,
        [key]: { ...prev[key], photo: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasUnchecked = Object.values(checklistData).some(
      item => item.status === null
    );

    if (hasUnchecked) {
      alert(t("checklist.form.alerts.uncheckedItems"));
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        Role: user.role,
        Timestamp: new Date().toISOString(),
        "Checklist Data": JSON.stringify(checklistData)
      };

      const response = await fetchWithAuth("/api/add/Checklist_Log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === "success") {
        alert(t("checklist.form.alerts.success"));
        navigate("/checklist");
      } else {
        alert(t("checklist.form.alerts.error"));
      }
    } catch {
      alert(t("checklist.form.alerts.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  const template = getChecklistTemplate(formData["Equipment Type"]);

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        {/* BASIC INFORMATION – ALWAYS VISIBLE */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-cyan-400 mb-4">
            {t("checklist.form.basicInfo")}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <input
              type="date"
              value={formData.Date}
              onChange={e => handleInputChange("Date", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
            />

            <input
              value={formData["Full Name"]}
              onChange={e =>
                handleInputChange("Full Name", e.target.value)
              }
              className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
            />

            <select
              value={formData["Model / Type"]}
              onChange={e =>
                handleInputChange("Model / Type", e.target.value)
              }
              className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
            >
              <option value="">
                {t("checklist.form.selectModel")}
              </option>
              {modelOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={formData["Plate Number"]}
              onChange={e =>
                handleInputChange("Plate Number", e.target.value)
              }
              className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
            >
              <option value="">
                {t("checklist.form.selectPlate")}
              </option>
              {plateOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <input
              readOnly
              value={formData["Equipment Type"]}
              className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
            />
          </div>
        </div>

        {/* CHECKLIST SECTION */}
        {formData["Plate Number"] && formData["Equipment Type"] ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {template.map(section => (
              <div
                key={section.sectionKey}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
              >
                <h3 className="text-cyan-300 mb-4">
                  {t(section.titleKey)}
                </h3>

                {section.items.map(item => {
                  const key = `${section.sectionKey}.${item.key}`;
                  const state = checklistData[key];

                  return (
                    <div
                      key={key}
                      className="p-3 bg-gray-900/30 rounded-lg border border-gray-700 mb-3"
                    >
                      <div className="flex items-center justify-between">
                        <span>{t(`checklist.items.${item.key}`)}</span>
                        <div className="flex gap-2">
                          <CheckCircle
                            size={18}
                            onClick={() => handleStatusChange(key, "OK")}
                            className={state?.status === "OK" ? "text-emerald-400" : "text-gray-500"}
                          />
                          <AlertTriangle
                            size={18}
                            onClick={() => handleStatusChange(key, "Warning")}
                            className={state?.status === "Warning" ? "text-amber-400" : "text-gray-500"}
                          />
                          <XCircle
                            size={18}
                            onClick={() => handleStatusChange(key, "Fail")}
                            className={state?.status === "Fail" ? "text-red-400" : "text-gray-500"}
                          />
                        </div>
                      </div>

                      {(state?.status === "Warning" || state?.status === "Fail") && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={state.comment}
                            onChange={e => handleCommentChange(key, e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-900/70 border border-gray-700"
                            placeholder={t("checklist.form.commentPlaceholder")}
                          />

                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <Camera size={14} />
                            {t("checklist.form.uploadPhoto")}
                            <input
                              type="file"
                              hidden
                              onChange={e =>
                                e.target.files &&
                                handlePhotoUpload(key, e.target.files[0])
                              }
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
            >
              {submitting ? t("common.submitting") : t("common.submit")}
            </button>
          </form>
        ) : (
          <div className="text-center text-gray-400">
            {t("checklist.form.selectEquipmentHint")}
          </div>
        )}
      </div>
    </div>
  );
}
