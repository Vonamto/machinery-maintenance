import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchSheetData } from "../../services/googleSheets";
import { CHECKLIST_DEFINITIONS } from "../../utils/checklistDefinitions";
import { useTranslation } from "react-i18next";

const CHECKLIST_SHEET = "Checklist_Log";
const EQUIPMENT_SHEET = "Equipment_List";
const PAGE_SIZE = 10;

export default function ChecklistHistory() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    plate: "",
    model: "",
    from: "",
    to: ""
  });

  /* ------------------ LOAD DATA ------------------ */
  useEffect(() => {
    fetchSheetData(CHECKLIST_SHEET).then(setRows);
    fetchSheetData(EQUIPMENT_SHEET).then(setEquipment);
  }, []);

  /* ------------------ FILTER LOGIC ------------------ */
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (user.role === "Driver" && r["Plate Number"] !== user.plate) {
        return false;
      }

      if (filters.plate && r["Plate Number"] !== filters.plate) return false;
      if (filters.model && r["Model / Type"] !== filters.model) return false;

      if (filters.from && new Date(r.Date) < new Date(filters.from)) return false;
      if (filters.to && new Date(r.Date) > new Date(filters.to)) return false;

      return true;
    });
  }, [rows, filters, user]);

  /* ------------------ PAGINATION ------------------ */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* ------------------ RENDER CHECKLIST ------------------ */
  const renderChecklist = row => {
    let data = {};
    try {
      data = JSON.parse(row["Checklist Data"] || "{}");
    } catch {
      return <p>{t("checklist.history.invalidData")}</p>;
    }

    const definition = CHECKLIST_DEFINITIONS[row["Equipment Type"]];
    if (!definition) return null;

    return definition.sections.map(section => (
      <div key={section.id}>
        <h4>{t(section.translationKey)}</h4>

        {section.items.map(item => {
          const result = data?.[section.id]?.[item.id];
          if (!result) return null;

          return (
            <div key={item.id}>
              <span>{t(item.translationKey)}</span>
              <span>
                {result.status === "ok" && "✅"}
                {result.status === "warning" && "⚠️"}
                {result.status === "fail" && "❌"}
              </span>
              {result.comment && <p>{result.comment}</p>}
            </div>
          );
        })}
      </div>
    ));
  };

  /* ------------------ UI ------------------ */
  return (
    <div>
      <h2>{t("checklist.history.title")}</h2>

      {/* FILTERS */}
      <div>
        <select
          value={filters.plate}
          onChange={e => setFilters({ ...filters, plate: e.target.value })}
        >
          <option value="">{t("checklist.filters.plate")}</option>
          {equipment.map(e => (
            <option key={e["Plate Number"]} value={e["Plate Number"]}>
              {e["Plate Number"]}
            </option>
          ))}
        </select>

        <select
          value={filters.model}
          onChange={e => setFilters({ ...filters, model: e.target.value })}
        >
          <option value="">{t("checklist.filters.model")}</option>
          {[...new Set(equipment.map(e => e["Model / Type"]))].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters({ ...filters, from: e.target.value })}
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters({ ...filters, to: e.target.value })}
        />
      </div>

      {/* ACCORDION LIST */}
      {paginated.map((row, idx) => {
        const id = (page - 1) * PAGE_SIZE + idx;
        return (
          <div key={id}>
            <div onClick={() => setExpanded(expanded === id ? null : id)}>
              <strong>{row.Date}</strong> — {row["Plate Number"]} (
              {row["Equipment Type"]})
            </div>

            {expanded === id && (
              <div>
                <p>{row["Full Name"]}</p>
                {renderChecklist(row)}
              </div>
            )}
          </div>
        );
      })}

      {/* PAGINATION */}
      <div>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button key={i} onClick={() => setPage(i + 1)}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
