import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchSheetData, appendRow } from "../../services/googleSheets";
import { CHECKLIST_DEFINITIONS } from "../../utils/checklistDefinitions";
import { useTranslation } from "react-i18next";

const CHECKLIST_SHEET = "Checklist_Log";
const EQUIPMENT_SHEET = "Equipment_List";

const STATUS_OPTIONS = ["ok", "warning", "fail"];

export default function ChecklistForm() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedName, setSelectedName] = useState(user?.fullName || "");
  const [equipmentType, setEquipmentType] = useState("");
  const [checklist, setChecklist] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  /* ------------------ LOAD EQUIPMENT ------------------ */
  useEffect(() => {
    fetchSheetData(EQUIPMENT_SHEET).then(setEquipmentList);
  }, []);

  /* ------------------ AUTO-FILL DRIVER ------------------ */
  useEffect(() => {
    if (user?.role === "Driver" && equipmentList.length) {
      const assigned = equipmentList.find(
        e => e["Driver 1"] === user.fullName || e["Driver 2"] === user.fullName
      );
      if (assigned) {
        setSelectedPlate(assigned["Plate Number"]);
        setSelectedModel(assigned["Model / Type"]);
        setEquipmentType(assigned["Equipment Type"]);
      }
    }
  }, [equipmentList, user]);

  /* ------------------ LOAD CHECKLIST ------------------ */
  useEffect(() => {
    if (equipmentType && CHECKLIST_DEFINITIONS[equipmentType]) {
      setChecklist(CHECKLIST_DEFINITIONS[equipmentType]);
      setResponses({});
    }
  }, [equipmentType]);

  /* ------------------ HANDLERS ------------------ */
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

  /* ------------------ SUBMIT ------------------ */
  const handleSubmit = async e => {
    e.preventDefault();
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
    } catch (err) {
      alert(t("checklist.alerts.error"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------ RENDER ------------------ */
  return (
    <form onSubmit={handleSubmit}>
      <h2>{t("checklist.form.title")}</h2>

      {/* HEADER FIELDS */}
      <input value={selectedName} onChange={e => setSelectedName(e.target.value)} />
      <select value={selectedPlate} onChange={e => {
        const eq = equipmentList.find(i => i["Plate Number"] === e.target.value);
        setSelectedPlate(e.target.value);
        setSelectedModel(eq?.["Model / Type"] || "");
        setEquipmentType(eq?.["Equipment Type"] || "");
      }}>
        <option value="">{t("checklist.form.choosePlate")}</option>
        {equipmentList.map(e => (
          <option key={e["Plate Number"]} value={e["Plate Number"]}>
            {e["Plate Number"]}
          </option>
        ))}
      </select>

      {/* CHECKLIST */}
      {checklist?.sections.map(section => (
        <div key={section.id}>
          <h3>{t(section.translationKey)}</h3>

          {section.items.map(item => {
            const data = responses?.[section.id]?.[item.id] || {};
            return (
              <div key={item.id}>
                <span>{t(item.translationKey)}</span>

                {STATUS_OPTIONS.map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => handleStatusChange(section.id, item.id, s)}
                  >
                    {s === "ok" ? "✅" : s === "warning" ? "⚠️" : "❌"}
                  </button>
                ))}

                {data.status && (
                  <input
                    placeholder={t("checklist.form.comment")}
                    onChange={e =>
                      handleCommentChange(section.id, item.id, e.target.value)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      <button type="submit" disabled={submitting}>
        {submitting ? t("common.submitting") : t("common.submit")}
      </button>
    </form>
  );
}
