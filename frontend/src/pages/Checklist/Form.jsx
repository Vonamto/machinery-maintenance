// frontend/src/pages/Checklist/Form.jsx
import React, { useEffect, useState } from "react";
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
  const { equipment, loading: cacheLoading } = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Full Name": user?.full_name || "",
    "Model / Type": "",
    "Plate Number": "",
    "Equipment Type": "",
    "Checklist Data": ""
  });

  const [checklistData, setChecklistData] = useState({});
  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  /* -------------------- ACCESS CONTROL -------------------- */
  useEffect(() => {
    if (user?.role === "Cleaning Guy") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* -------------------- CACHE LOADING -------------------- */
  if (cacheLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  /* -------------------- EQUIPMENT FILTERING -------------------- */
  useEffect(() => {
    if (!equipment?.length) return;

    if (user?.role === "Driver") {
      const driverEq = equipment.filter(
        (eq) =>
          eq["Driver 1"] === user.full_name ||
          eq["Driver 2"] === user.full_name
      );
      setModelOptions([...new Set(driverEq.map((e) => e["Model / Type"]))]);
      setPlateOptions(driverEq.map((e) => e["Plate Number"]));
    } else {
      setModelOptions([...new Set(equipment.map((e) => e["Model / Type"]))]);
      setPlateOptions(equipment.map((e) => e["Plate Number"]));
    }
  }, [equipment, user]);

  /* -------------------- DRIVER AUTO-FILL -------------------- */
  useEffect(() => {
    if (user?.role !== "Driver") return;
    if (formData["Plate Number"]) return;

    const assigned = equipment.find(
      (eq) =>
        eq["Driver 1"] === user.full_name ||
        eq["Driver 2"] === user.full_name
    );

    if (assigned) {
      setFormData((prev) => ({
        ...prev,
        "Model / Type": assigned["Model / Type"],
        "Plate Number": assigned["Plate Number"],
        "Equipment Type": assigned["Equipment Type"]
      }));
    }
  }, [user, equipment, formData["Plate Number"]]);

  /* -------------------- PLATE CHANGE -------------------- */
  useEffect(() => {
    if (!formData["Plate Number"]) return;

    const found = equipment.find(
      (e) => e["Plate Number"] === formData["Plate Number"]
    );

    if (found) {
      setFormData((prev) => ({
        ...prev,
        "Model / Type": found["Model / Type"],
        "Equipment Type": found["Equipment Type"]
      }));
    }
  }, [formData["Plate Number"], equipment]);

  /* -------------------- CHECKLIST INIT -------------------- */
  useEffect(() => {
    if (!formData["Equipment Type"]) return;

    const template = getChecklistTemplate(formData["Equipment Type"]);
    const initial = {};

    template.forEach((section) => {
      section.items.forEach((item) => {
        const key = `${section.sectionKey}.${item.key}`;
        initial[key] = { status: null, comment: "", photo: "" };
      });
    });

    setChecklistData(initial);
  }, [formData["Equipment Type"]]);

  /* -------------------- HANDLERS -------------------- */
  const handleStatus = (key, status) => {
    setChecklistData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        comment: status === "OK" ? "" : prev[key].comment
      }
    }));
  };

  const handleComment = (key, value) => {
    setChecklistData((prev) => ({
      ...prev,
      [key]: { ...prev[key], comment: value }
    }));
  };

  const handlePhoto = async (key, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setChecklistData((prev) => ({
        ...prev,
        [key]: { ...prev[key], photo: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  /* -------------------- SUBMIT -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const unchecked = Object.values(checklistData).some(
      (i) => i.status === null
    );

    if (unchecked) {
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

      const res = await fetchWithAuth("/api/add/Checklist_Log", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.status === "success") {
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

  /* -------------------- RENDER -------------------- */
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-cyan-400 mb-4"
        >
          <ArrowLeft size={18} /> {t("common.back")}
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {template.map((section) => (
            <div key={section.sectionKey} className="bg-gray-900 p-4 rounded-xl">
              <h3 className="text-cyan-300 font-semibold mb-3">
                {t(section.titleKey)}
              </h3>

              {section.items.map((item) => {
                const key = `${section.sectionKey}.${item.key}`;
                const state = checklistData[key];

                return (
                  <div
                    key={key}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-700 py-2"
                  >
                    <span>{t(`checklist.items.${item.key}`)}</span>

                    <div className="flex gap-2">
                      <CheckCircle
                        size={20}
                        onClick={() => handleStatus(key, "OK")}
                        className={`cursor-pointer ${
                          state?.status === "OK"
                            ? "text-emerald-400"
                            : "text-gray-500"
                        }`}
                      />
                      <AlertTriangle
                        size={20}
                        onClick={() => handleStatus(key, "Warning")}
                        className={`cursor-pointer ${
                          state?.status === "Warning"
                            ? "text-amber-400"
                            : "text-gray-500"
                        }`}
                      />
                      <XCircle
                        size={20}
                        onClick={() => handleStatus(key, "Fail")}
                        className={`cursor-pointer ${
                          state?.status === "Fail"
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      />
                    </div>

                    {(state?.status === "Warning" ||
                      state?.status === "Fail") && (
                      <div className="w-full md:w-1/2 space-y-2">
                        <textarea
                          placeholder={t("checklist.form.commentPlaceholder")}
                          value={state.comment}
                          onChange={(e) =>
                            handleComment(key, e.target.value)
                          }
                          className="w-full bg-gray-800 p-2 rounded"
                        />

                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <Camera size={16} />
                          {t("checklist.form.uploadPhoto")}
                          <input
                            type="file"
                            hidden
                            onChange={(e) =>
                              e.target.files &&
                              handlePhoto(key, e.target.files[0])
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
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? t("common.submitting") : t("common.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
