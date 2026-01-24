import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchSheetData, appendRow } from "../../services/googleSheets";
import { CHECKLIST_DEFINITIONS, EQUIPMENT_TYPES } from "../../utils/checklistDefinitions";
import { useTranslation } from "react-i18next";

const CHECKLIST_SHEET = "Checklist_Log";
const EQUIPMENT_SHEET = "Equipment_List";

const STATUS_OPTIONS = ["ok", "warning", "fail"];

export default function ChecklistForm() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [equipmentList, setEquipmentList] = useState([]);

  const [selectedName, setSelectedName] = useState(user?.fullName || "");
  const [selectedPlate, setSelectedPlate] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [equipmentType, setEquipmentType] = useState("");

  const [checklist, setChecklist] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- LOAD EQUIPMENT LIST ---------------- */
  useEffect(() => {
    fetchSheetData(EQUIPMENT_SHEET).then(setEquipmentList);
  }, []);

  /* ---------------- AUTO-FILL FOR DRIVER ---------------- */
  useEffect(() => {
    if (user?.role === "Driver" && equipmentList.length) {
      const assigned = equipmentList.find(
        e =>
          e["Driver 1"] === user.fullName ||
          e["Driver 2"] === user.fullName
      );

      if (assigned) {
        setSelectedPlate(assigned["Plate Number"]);
        setSelectedModel(assigned["Model / Type"]);
        setEquipmentType(assigned["Equipment Type"]);
      }
    }
  }, [equipmentList, user]);

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
    const eq = equipmentList.find(e => e["Plate Number"] === value);

    setSelectedPlate(value);
    setSelectedModel(eq?.["Model / Type"] || "");
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

    if (!selectedPlate || !equipmentType) {
      alert(t("checklist.alerts.missingAsset"));
      return;
    }

    setSubmitting(true);

    const row = {
      Timestamp: new Date().toISOString(),
      Date: new Date().toLocaleDateString("en-GB"),
      "Full Name": selectedName,
      Role: user.role,
      "Model / Type": selectedModel,
      "Plate Number": selectedPlate,
      "Equipment Type": equipmentType,
      "Checklist Data": JSON.stringify(responses)
    };

    try {
      await appendRow(CHECKLIST_SHEET, row);
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

      {/* HEADER FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          placeholder={t("checklist.form.fullName")}
          className="p-2 rounded"
        />

        <select
          value={selectedPlate}
          onChange={e => handlePlateChange(e.target.value)}
          className="p-2 rounded"
        >
          <option value="">{t("checklist.form.choosePlate")}</option>
          {equipmentList.map(e => (
            <option key={e["Plate Number"]} value={e["Plate Number"]}>
              {e["Plate Number"]}
            </option>
          ))}
        </select>

        <input
          value={selectedModel}
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
