import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchSheetData } from "../../../services/googleSheets";
import { CHECKLIST_DEFINITIONS } from "../../utils/checklistDefinitions";
import { useTranslation } from "react-i18next";

const CHECKLIST_SHEET = "Checklist_Log";
const EQUIPMENT_SHEET = "Equipment_List";
const PAGE_SIZE = 10;

export default function ChecklistHistory() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [checklists, setChecklists] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    plate: "",
    model: "",
    from: "",
    to: ""
  });

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    fetchSheetData(CHECKLIST_SHEET).then(setChecklists);
    fetchSheetData(EQUIPMENT_SHEET).then(setEquipmentList);
  }, []);

  /* ---------------- DRIVER PLATE FILTER ---------------- */
  const driverPlate = useMemo(() => {
    if (user.role !== "Driver") return null;

    const assigned = equipmentList.find(
      e =>
        e["Driver 1"] === user.fullName ||
        e["Driver 2"] === user.fullName
    );

    return assigned?.["Plate Number"] || null;
  }, [equipmentList, user]);

  /* ---------------- FILTERED DATA ---------------- */
  const filteredData = useMemo(() => {
    return checklists.filter(row => {
      if (user.role === "Driver" && row["Plate Number"] !== driverPlate) {
        return false;
      }

      if (filters.plate && row["Plate Number"] !== filters.plate) return false;
      if (filters.model && row["Model / Type"] !== filters.model) return false;

      if (filters.from && new Date(row.Date) < new Date(filters.from)) return false;
      if (filters.to && new Date(row.Date) > new Date(filters.to)) return false;

      return true;
    });
  }, [checklists, filters, user, driverPlate]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* ---------------- RENDER CHECKLIST CONTENT ---------------- */
  const renderChecklist = row => {
    let parsed = {};
    try {
      parsed = JSON.parse(row["Checklist Data"] || "{}");
    } catch {
      return <p>{t("checklist.history.invalidData")}</p>;
    }

    const definition = CHECKLIST_DEFINITIONS[row["Equipment Type"]];
    if (!definition) return null;

    return definition.sections.map(section => (
      <div key={section.id} className="mb-4">
        <h4 className="font-semibold mb-2">
          {t(section.translationKey)}
        </h4>

        {section.items.map(item => {
          const itemData = parsed?.[section.id]?.[item.id];
          if (!itemData) return null;

          return (
            <div key={item.id} className="flex flex-col mb-2 pl-2">
              <div className="flex justify-between items-center">
                <span>{t(item.translationKey)}</span>
                <span>
                  {itemData.status === "ok" && "✅"}
                  {itemData.status === "warning" && "⚠️"}
                  {itemData.status === "fail" && "❌"}
                </span>
              </div>

              {itemData.comment && (
                <p className="text-sm text-gray-600 mt-1">
                  {itemData.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {t("checklist.history.title")}
      </h2>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={filters.plate}
          onChange={e =>
            setFilters({ ...filters, plate: e.target.value })
          }
          disabled={user.role === "Driver"}
          className="p-2 rounded"
        >
          <option value="">
            {t("checklist.filters.plate")}
          </option>
          {equipmentList.map(e => (
            <option key={e["Plate Number"]} value={e["Plate Number"]}>
              {e["Plate Number"]}
            </option>
          ))}
        </select>

        <select
          value={filters.model}
          onChange={e =>
            setFilters({ ...filters, model: e.target.value })
          }
          className="p-2 rounded"
        >
          <option value="">
            {t("checklist.filters.model")}
          </option>
          {[...new Set(equipmentList.map(e => e["Model / Type"]))].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={e =>
            setFilters({ ...filters, from: e.target.value })
          }
          className="p-2 rounded"
        />

        <input
          type="date"
          value={filters.to}
          onChange={e =>
            setFilters({ ...filters, to: e.target.value })
          }
          className="p-2 rounded"
        />
      </div>

      {/* ACCORDION LIST */}
      {paginatedData.map((row, index) => {
        const globalIndex =
          (currentPage - 1) * PAGE_SIZE + index;

        return (
          <div key={globalIndex} className="border rounded">
            <button
              className="w-full text-left p-4 font-medium"
              onClick={() =>
                setExpandedIndex(
                  expandedIndex === globalIndex ? null : globalIndex
                )
              }
            >
              {row.Date} — {row["Plate Number"]} (
              {row["Equipment Type"]})
            </button>

            {expandedIndex === globalIndex && (
              <div className="p-4 border-t">
                <p className="mb-3 text-sm">
                  {row["Full Name"]}
                </p>
                {renderChecklist(row)}
              </div>
            )}
          </div>
        );
      })}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
