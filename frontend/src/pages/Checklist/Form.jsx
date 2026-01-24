import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCache } from "../../context/CacheContext";
import { fetchWithAuth } from "../../api/api";
import { CHECKLIST_DEFINITIONS } from "../../utils/checklistDefinitions";
import { useTranslation } from "react-i18next";

const CHECKLIST_SHEET = "Checklist_Log";

const STATUS_OPTIONS = ["ok", "warning", "fail"];

export default function ChecklistForm() {
  const { user } = useAuth();
  const { equipment } = useCache();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [equipmentType, setEquipmentType] = useState("");

  const [checklist, setChecklist] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- DRIVER AUTO-FILL ---------------- */
  useEffect(() => {
    if (user?.role === "Driver" && equipment.length) {
      const assigned = equipment.find(
        e =>
          e["Driver 1"] === user.full_name ||
          e["Driver 2"] === user.full_name
      );

      if (assigned) {
        setPlate(assigned["Plate Number"]);
        setModel(assigned["Model / Type"]);
        setEquipmentType(assigned["Equipment Type"]);
      }
    }
  }, [equipment, user]);

  /* ---------------- LOAD CHECKLIST TEMPLATE ---------------- */
  useEffect(() => {
    if (equipmentType && CHECKLIST_DEFINITIONS[equipmentType]) {
      setChecklist(CHECKLIST_DEFINITIONS[equipmentType]);
      setResponses({});
    } else {
      setChecklist(null);
      setResponses({});
    }
  }, [equipmentType]);

  /* ---------------- HANDLERS ---------------- */
  const handlePlateChange = value => {
    const eq = equipment.find(e => e["Plate Number"] === value);
    setPlate(value);
    setModel(eq?.["Model / Type"] || "");
    setEquipmentType(eq?.["Equipment Type"] || "");
  };

  const handleStatusChange = (sectionId, itemId, status) => {
    setResponses(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemId]: {
          ...prev[sectionId]?.[itemId],
          status
        }
      }
    }));
  };

  const handleCommentChange = (sectionId, itemId, comment) => {
    setResponses(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemId]: {
          ...prev[sectionId]?.[itemId],
          comment
        }
      }
    }));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async e => {
    e.preventDefault();

    if (!plate || !equipmentType) {
      alert(t("checklist.alerts.missingAsset"));
      return;
    }

    setSubmitting(true);

    const payload = {
      Timestamp: new Date().toISOString(),
      Date: new Date().toLocaleDateString("en-GB"),
      "Full Name": fullName,
      Role: user.role,
      "Model / Type": model,
      "Plate Number": plate,
      "Equipment Type": equipmentType,
      "Checklist Data": JSON.stringify(responses)
    };

    try {
      const res = await fetchWithAuth(`/api/add/${CHECKLIST_SHEET}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed");

      alert(t("checklist.alerts.success"));
      setResponses({});
    } catch (err) {
      alert(t("checklist.alerts.error"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold">
        {t("checklist.form.title")}
      </h2>

      {/* HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder={t("checklist.form.fullName")}
          className="p-2 rounded"
        />

        <select
          value={plate}
          onChange={e => handlePlateChange(e.target.value)}
          className="p-2 rounded"
        >
          <option value="">{t("checklist.form.choosePlate")}</option>
          {equipment.map(e => (
            <option key={e["Plate Number"]} value={e["Plate Number"]}>
              {e["Plate Number"]}
            </option>
          ))}
        </select>

        <input
          value={model}
          readOnly
          placeholder={t("checklist.form.model")}
          className="p-2 rounded bg-gray-100"
        />

        <input
          value={equipmentType}
          readOnly
          placeholder={t("checklist.form.equipmentType")}
          className="p-2 rounded bg-gray-100"
        />
      </div>

      {/* CHECKLIST */}
      {checklist?.sections.map(section => (
        <div key={section.id} className="border rounded p-4">
          <h3 className="font-semibold mb-3">
            {t(section.translationKey)}
          </h3>

          {section.items.map(item => {
            const data = responses?.[section.id]?.[item.id] || {};

            return (
              <div key={item.id} className="mb-3">
                <div className="flex items-center justify-between">
                  <span>{t(item.translationKey)}</span>

                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() =>
                          handleStatusChange(section.id, item.id, s)
                        }
                      >
                        {s === "ok" ? "✅" : s === "warning" ? "⚠️" : "❌"}
                      </button>
                    ))}
                  </div>
                </div>

                {data.status && (
                  <input
                    className="mt-2 w-full p-2 rounded"
                    placeholder={t("checklist.form.comment")}
                    onChange={e =>
                      handleCommentChange(
                        section.id,
                        item.id,
                        e.target.value
                      )
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2 rounded bg-cyan-600 text-white disabled:opacity-60"
      >
        {submitting ? t("common.submitting") : t("common.submit")}
      </button>
    </form>
  );
}
