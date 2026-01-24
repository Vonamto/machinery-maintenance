import React, { useEffect, useMemo, useState } from "react";
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
  const {
    equipment,
    usernames,
    loadingEquipment,
    loadingUsernames
  } = useCache();

  const navigate = useNavigate();
  const { t } = useTranslation();

  const isDriver = user?.role === "Driver";
  const isSupervisorOrMechanic =
    user?.role === "Supervisor" || user?.role === "Mechanic";

  /* ---------------- STATE ---------------- */
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split("T")[0],
    "Full Name": user?.full_name || "",
    "Model / Type": "",
    "Plate Number": "",
    "Equipment Type": ""
  });

  const [checklistData, setChecklistData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- ACCESS CONTROL ---------------- */
  useEffect(() => {
    if (user?.role === "Cleaning Guy") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* ---------------- BLOCK PAGE UNTIL CACHE READY ---------------- */
  if (loadingEquipment || loadingUsernames) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  /* ---------------- DRIVER AUTO-FILL ---------------- */
  useEffect(() => {
    if (!isDriver || !equipment.length) return;

    const assigned = equipment.find(
      e =>
        e["Driver 1"] === user.full_name ||
        e["Driver 2"] === user.full_name
    );

    if (assigned) {
      setFormData(prev => ({
        ...prev,
        "Model / Type": assigned["Model / Type"],
        "Plate Number": assigned["Plate Number"],
        "Equipment Type": assigned["Equipment Type"]
      }));
    }
  }, [isDriver, equipment, user]);

  /* ---------------- OPTIONS ---------------- */
  const modelOptions = useMemo(() => {
    if (isDriver) return [];
    return [...new Set(equipment.map(e => e["Model / Type"]).filter(Boolean))];
  }, [equipment, isDriver]);

  const plateOptions = useMemo(() => {
    if (isDriver) return [];
    if (!formData["Model / Type"]) return [];
    return equipment
      .filter(e => e["Model / Type"] === formData["Model / Type"])
      .map(e => e["Plate Number"]);
  }, [equipment, formData["Model / Type"], isDriver]);

  /* ---------------- PLATE CHANGE ---------------- */
  useEffect(() => {
    if (!formData["Plate Number"]) return;

    const found = equipment.find(
      e => e["Plate Number"] === formData["Plate Number"]
    );

    if (found) {
      setFormData(prev => ({
        ...prev,
        "Model / Type": found["Model / Type"],
        "Equipment Type": found["Equipment Type"]
      }));
    }
  }, [formData["Plate Number"], equipment]);

  /* ---------------- INIT CHECKLIST ---------------- */
  useEffect(() => {
    if (!formData["Equipment Type"]) return;

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
  }, [formData["Equipment Type"]]);

  /* ---------------- HANDLERS ---------------- */
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
  const handleSubmit = async e => {
    e.preventDefault();

    if (Object.values(checklistData).some(i => i.status === null)) {
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
        headers: { "Content-Type": "application/json" },
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

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 mb-6"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        {/* BASIC INFO */}
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-cyan-400 font-semibold mb-4">
            {t("checklist.form.basicInfo")}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {/* DATE – FULL WIDTH */}
            <input
              type="date"
              value={formData.Date}
              disabled={isDriver}
              onChange={e =>
                setFormData(prev => ({ ...prev, Date: e.target.value }))
              }
              className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
            />

            {/* FULL NAME */}
            {isSupervisorOrMechanic ? (
              <select
                value={formData["Full Name"]}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    "Full Name": e.target.value
                  }))
                }
                className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
              >
                <option value="">
                  {t("checklist.form.chooseInspector")}
                </option>
                {usernames.map(u => (
                  <option key={u.Name} value={u.Name}>
                    {u.Name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={formData["Full Name"]}
                disabled
                className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400"
              />
            )}

            {/* MODEL */}
            <input
              value={formData["Model / Type"]}
              disabled={isDriver}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  "Model / Type": e.target.value
                }))
              }
              className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
            />

            {/* PLATE */}
            <input
              value={formData["Plate Number"]}
              disabled={isDriver}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  "Plate Number": e.target.value
                }))
              }
              className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700"
            />
          </div>
        </div>

        {/* CHECKLIST */}
        {formData["Equipment Type"] && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {template.map(section => (
              <div
                key={section.sectionKey}
                className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
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
                      <div className="flex justify-between items-center">
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
                            onChange={e =>
                              handleCommentChange(key, e.target.value)
                            }
                            className="w-full p-2 rounded-lg bg-gray-900/70 border border-gray-700"
                            placeholder={t("checklist.form.commentPlaceholder")}
                          />

                          <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <Camera size={14} />
                            {t("checklist.form.uploadPhoto")}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e =>
                                e.target.files &&
                                handlePhotoUpload(key, e.target.files[0])
                              }
                            />
                          </label>

                          {state.photo && (
                            <img
                              src={state.photo}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg border border-gray-600"
                            />
                          )}
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500"
            >
              {submitting ? t("common.submitting") : t("common.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
