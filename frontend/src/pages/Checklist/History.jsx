// frontend/src/pages/Checklist/History.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  X, 
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  ExternalLink,
  Trash2,
  ArrowLeft,
  RefreshCw,
  ClipboardCheck,
  Droplets,
  Zap,
  Circle,
  Settings,
  ArrowUpCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";
import { getChecklistTemplate } from "@/config/checklistTemplates";
import { PAGE_PERMISSIONS } from "@/config/roles";

export default function ChecklistHistory() {
  const { user } = useAuth();
  const { equipment } = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    driver: "",
    "Model / Type": "",
    "Plate Number": "",
    startDate: "",
    endDate: ""
  });

  // Delete mode state (simple toggle like Maintenance)
  const [deleteMode, setDeleteMode] = useState(false);

  const itemsPerPage = 10;

  // Check if user can delete
  const canDelete = user?.role === "Supervisor" || user?.role === "Admin";

  /* -------------------- ACCESS CONTROL (Centralized) -------------------- */
  useEffect(() => {
    if (!PAGE_PERMISSIONS.CHECKLIST_HISTORY.includes(user?.role)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* -------------------- LOAD CHECKLIST DATA -------------------- */
  const loadChecklists = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/Checklist_Log');
      if (response.ok) {
        let data = await response.json();
        
        // ✅ Step 1: Assign __row_index based on ORIGINAL sheet position (for delete)
        const withIndex = data.map((row, i) => ({
          ...row,
          __row_index: i + 2, // +2 because row 1 is headers, data starts at row 2
        }));
        
        // ✅ Step 2: Sort by Date field for display (newest first)
        const sorted = [...withIndex].sort((a, b) => {
          const dateA = new Date(a.Date);
          const dateB = new Date(b.Date);
          return dateB - dateA; // Newest first
        });

        // Apply driver-specific filtering
        if (user?.role === "Driver") {
          const driverEquipment = equipment.filter(eq =>
            eq["Driver 1"] === user.full_name || eq["Driver 2"] === user.full_name
          );
          const allowedPlates = driverEquipment.map(eq => eq["Plate Number"]);
          const filtered = sorted.filter(record => allowedPlates.includes(record["Plate Number"]));
          setChecklists(filtered);
        } else {
          setChecklists(sorted);
        }
      }
    } catch (error) {
      console.error('Error loading checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklists();
  }, [user, equipment]);

  /* -------------------- FILTER LOGIC -------------------- */
  const filteredChecklists = checklists.filter(record => {
    const matchesDriver = !filters.driver || record["Full Name"] === filters.driver;
    const matchesPlate = !filters["Plate Number"] || record["Plate Number"] === filters["Plate Number"];
    const matchesModel = !filters["Model / Type"] || record["Model / Type"] === filters["Model / Type"];

    const recordDate = new Date(record.Date);
    const startFilter = filters.startDate ? new Date(filters.startDate) : null;
    const endFilter = filters.endDate ? new Date(filters.endDate) : null;

    const matchesDate = 
      (!startFilter || recordDate >= startFilter) &&
      (!endFilter || recordDate <= endFilter);

    return matchesDriver && matchesPlate && matchesModel && matchesDate;
  });

  /* -------------------- PAGINATION -------------------- */
  const totalPages = Math.ceil(filteredChecklists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChecklists = filteredChecklists.slice(startIndex, startIndex + itemsPerPage);

  /* -------------------- TOGGLE CARD EXPANSION -------------------- */
  const toggleCard = (id) => {
    if (expandedCard === id) {
      setExpandedCard(null);
      setExpandedSections(new Set());
    } else {
      setExpandedCard(id);
      setExpandedSections(new Set());
    }
  };

  /* -------------------- TOGGLE SECTION EXPANSION -------------------- */
  const toggleSection = (sectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  /* -------------------- FILTER HANDLERS -------------------- */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      driver: "",
      "Model / Type": "",
      "Plate Number": "",
      startDate: "",
      endDate: ""
    });
    setCurrentPage(1);
  };

  /* -------------------- DELETE MODE HANDLERS -------------------- */
  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
  };

  const handleDelete = async (rowIndexInPage) => {
    const actualIndex = startIndex + rowIndexInPage;
    const rowToDelete = filteredChecklists[actualIndex];

    const confirmDelete = window.confirm(
      t("checklist.history.deleteConfirm") || 
      "Are you sure you want to delete this checklist record? This action cannot be undone."
    );
    if (!confirmDelete) return;

    if (!rowToDelete?.__row_index) {
      alert(t("checklist.history.deleteError") || "Error: Unable to identify the record to delete.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/delete/Checklist_Log/${rowToDelete.__row_index}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      
      if (result.status === "success") {
        // Remove from local state
        setChecklists((prev) =>
          prev.filter((r) => r.__row_index !== rowToDelete.__row_index)
        );
        alert(t("checklist.history.deleteSuccess") || "✅ Record deleted successfully!");
      } else {
        alert(t("checklist.history.deleteError") || "❌ Error deleting record. Please try again.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(t("checklist.history.deleteError") || "❌ Error deleting record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- STATUS ICON -------------------- */
  const getStatusIcon = (status, size = "w-5 h-5") => {
    switch (status) {
      case "OK":
        return <CheckCircle className={`${size} text-emerald-400`} />;
      case "Warning":
        return <AlertTriangle className={`${size} text-amber-400`} />;
      case "Fail":
        return <XCircle className={`${size} text-red-400`} />;
      default:
        return <span className="text-gray-500 text-sm">-</span>;
    }
  };

  /* -------------------- SECTION ICON -------------------- */
  const getSectionIcon = (sectionKey, size = 20) => {
    const iconMap = {
      "general_inspection": <ClipboardCheck size={size} />,
      "fluids_check": <Droplets size={size} />,
      "electrical": <Zap size={size} />,
      "tires": <Circle size={size} />,
      "emergency_equipment": <AlertTriangle size={size} />,
      "hydraulic_system": <Settings size={size} />,
      "lifting_system": <ArrowUpCircle size={size} />
    };
    return iconMap[sectionKey] || <ClipboardCheck size={size} />;
  };

  /* -------------------- CALCULATE SUMMARY -------------------- */
  const calculateSummary = (checklistData) => {
    const summary = { OK: 0, Warning: 0, Fail: 0 };
    
    Object.values(checklistData).forEach(item => {
      if (item.status && summary.hasOwnProperty(item.status)) {
        summary[item.status]++;
      }
    });

    return summary;
  };

  /* -------------------- CALCULATE SECTION SUMMARY -------------------- */
  const calculateSectionSummary = (checklistData, section) => {
    const summary = { OK: 0, Warning: 0, Fail: 0 };
    
    section.items.forEach(item => {
      const itemKey = `${section.sectionKey}.${item.key}`;
      const itemData = checklistData[itemKey];
      if (itemData?.status && summary.hasOwnProperty(itemData.status)) {
        summary[itemData.status]++;
      }
    });

    return summary;
  };

  /* -------------------- GET SECTION STATUS COLOR -------------------- */
  const getSectionStatusColor = (summary) => {
    if (summary.Fail > 0) {
      return {
        border: "border-red-500/50",
        bg: "bg-red-500/10",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]"
      };
    } else if (summary.Warning > 0) {
      return {
        border: "border-amber-500/50",
        bg: "bg-amber-500/10",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]"
      };
    } else {
      return {
        border: "border-emerald-500/50",
        bg: "bg-emerald-500/10",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]"
      };
    }
  };

  /* -------------------- THUMBNAIL URL -------------------- */
  const getThumbnailUrl = (url) => {
    if (!url) return null;
    const match = url.match(/id=([^&]+)/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
    }
    return url;
  };

  /* -------------------- FILTER OPTIONS -------------------- */
  const plateNumbers = [...new Set(equipment.map(eq => eq["Plate Number"]))];
  const models = [...new Set(equipment.map(eq => eq["Model / Type"]))];
  const drivers = [...new Set(checklists.map(record => record["Full Name"]).filter(Boolean))];

  /* -------------------- LOADING SCREEN -------------------- */
  if (loading && checklists.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-12 w-12 text-purple-500 mb-4" />
          <p className="text-lg">{t("checklist.history.loading")}</p>
        </div>
      </div>
    );
  }

  /* -------------------- RENDER -------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t("common.back")}
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 shadow-lg shadow-purple-500/40">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                {t("checklist.history.title")}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {t("checklist.history.subtitle")}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Driver Filter */}
              <div>
                <select
                  value={filters.driver}
                  onChange={(e) => handleFilterChange("driver", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="">{t("checklist.history.filterDriver") || "Filter by Driver"}</option>
                  {drivers.map(driver => (
                    <option key={driver} value={driver}>{driver}</option>
                  ))}
                </select>
              </div>

              {/* Model Filter */}
              <div>
                <select
                  value={filters["Model / Type"]}
                  onChange={(e) => handleFilterChange("Model / Type", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="">{t("checklist.history.filterModel")}</option>
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Plate Filter */}
              <div>
                <select
                  value={filters["Plate Number"]}
                  onChange={(e) => handleFilterChange("Plate Number", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="">{t("checklist.history.filterPlate")}</option>
                  {plateNumbers.map(plate => (
                    <option key={plate} value={plate}>{plate}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {t("checklist.history.startDate")}
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  {t("checklist.history.endDate")}
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-between mt-4">
              {/* Delete Mode Toggle (Admin/Supervisor only) */}
              {canDelete && (
                <button
                  onClick={toggleDeleteMode}
                  className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition ${
                    deleteMode
                      ? "bg-red-600/20 text-red-400"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {deleteMode ? <X size={14} /> : <Trash2 size={14} />}
                  {deleteMode ? t("common.cancel") : t("equipment.manage.actions.delete")}
                </button>
              )}

              {/* Reset Filters Button */}
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium transition ml-auto"
              >
                <X size={14} />
                {t("maintenance.history.filters.reset")}
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            {filteredChecklists.length} {t("checklist.history.results") || "results found"}
          </p>
        </div>

        {/* Checklist Items */}
        {paginatedChecklists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {t("checklist.history.noResults")}
            </div>
            <p className="text-gray-600">{t("checklist.history.noResultsDescription") || "Try adjusting your filters"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedChecklists.map((record, index) => {
              const recordId = `${record.Timestamp}-${index}`;
              const isCardExpanded = expandedCard === recordId;
              const recordDate = new Date(record.Date);
              
              let checklistData = {};
              try {
                checklistData = JSON.parse(record["Checklist Data"] || "{}");
              } catch (e) {
                console.error("Failed to parse checklist data:", e);
              }

              const summary = calculateSummary(checklistData);
              const checklistTemplate = getChecklistTemplate(record["Equipment Type"] || record["Model / Type"]);

              return (
                <div 
                  key={recordId}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all"
                >
                  {/* Collapsed View */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-700/30 transition"
                    onClick={() => toggleCard(recordId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-gray-400" size={18} />
                          <span className="font-medium text-white">
                            {recordDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{t("checklist.history.plate") || "Plate"}:</span>
                          <span className="font-medium text-cyan-400">{record["Plate Number"]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{t("checklist.history.model") || "Model"}:</span>
                          <span className="font-medium text-purple-400">{record["Model / Type"]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {isCardExpanded ? (
                          <ChevronUp className="text-purple-400" size={20} />
                        ) : (
                          <ChevronDown className="text-gray-400" size={20} />
                        )}
                      </div>
                    </div>
                    
                    {/* Driver Name and Summary */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <span className="text-sm text-gray-400">
                        {t("checklist.history.performedBy") || "Driver"}: <span className="text-white font-medium">{record["Full Name"]}</span>
                      </span>
                      
                      {/* Summary */}
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">{t("checklist.history.summary") || "Summary"}:</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-400 font-semibold">{summary.OK}</span>
                            {getStatusIcon("OK", "w-4 h-4")}
                          </div>
                          <span className="text-gray-600">/</span>
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 font-semibold">{summary.Warning}</span>
                            {getStatusIcon("Warning", "w-4 h-4")}
                          </div>
                          <span className="text-gray-600">/</span>
                          <div className="flex items-center gap-1">
                            <span className="text-red-400 font-semibold">{summary.Fail}</span>
                            {getStatusIcon("Fail", "w-4 h-4")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button (appears below card when in delete mode) */}
                  {deleteMode && (
                    <div className="border-t border-gray-700 p-4 bg-red-900/10">
                      <button
                        onClick={() => handleDelete(index)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
                      >
                        <Trash2 size={14} />
                        {t("equipment.manage.actions.delete") || "Delete"}
                      </button>
                    </div>
                  )}

                  {/* Expanded View */}
                  {isCardExpanded && (
                    <div className="border-t border-gray-700 p-6 bg-gray-900/20">
                      <div className="space-y-4">
                        {checklistTemplate.map((section) => {
                          const sectionItems = section.items.map(item => {
                            const itemKey = `${section.sectionKey}.${item.key}`;
                            const itemData = checklistData[itemKey];
                            return { ...item, data: itemData, fullKey: itemKey };
                          }).filter(item => item.data);

                          if (sectionItems.length === 0) return null;

                          const sectionId = `${recordId}-${section.sectionKey}`;
                          const isSectionExpanded = expandedSections.has(sectionId);
                          const sectionSummary = calculateSectionSummary(checklistData, section);
                          const sectionColors = getSectionStatusColor(sectionSummary);

                          return (
                            <div 
                              key={section.sectionKey} 
                              className={`border rounded-xl overflow-hidden bg-gray-800/30 ${sectionColors.border} ${sectionColors.glow}`}
                            >
                              {/* Section Header */}
                              <div
                                className={`p-4 cursor-pointer hover:bg-gray-700/30 transition flex items-center justify-between ${sectionColors.bg}`}
                                onClick={() => toggleSection(sectionId)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-cyan-300">
                                    {getSectionIcon(section.sectionKey, 20)}
                                  </div>
                                  <h3 className="text-lg font-semibold text-cyan-300">
                                    {t(section.titleKey)}
                                  </h3>
                                  
                                  {/* Section Summary */}
                                  <div className="flex items-center gap-2 text-sm ml-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-400 font-semibold">{sectionSummary.OK}</span>
                                      {getStatusIcon("OK", "w-3 h-3")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-amber-400 font-semibold">{sectionSummary.Warning}</span>
                                      {getStatusIcon("Warning", "w-3 h-3")}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-400 font-semibold">{sectionSummary.Fail}</span>
                                      {getStatusIcon("Fail", "w-3 h-3")}
                                    </div>
                                  </div>
                                </div>
                                
                                {isSectionExpanded ? (
                                  <ChevronUp className="text-cyan-400" size={18} />
                                ) : (
                                  <ChevronDown className="text-gray-400" size={18} />
                                )}
                              </div>

                              {/* Section Items */}
                              {isSectionExpanded && (
                                <div className="p-4 pt-0 space-y-3">
                                  {sectionItems.map((item) => {
                                    const itemData = item.data;
                                    return (
                                      <div key={item.fullKey} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-gray-200">
                                            {t(`checklist.items.${item.key}`)}
                                          </span>
                                          <div className="flex items-center gap-3">
                                            {getStatusIcon(itemData.status)}
                                            <span className="text-sm text-gray-400">
                                              {t(`checklist.statusLabels.${itemData.status}`) || itemData.status}
                                            </span>
                                          </div>
                                        </div>
                                        {itemData.comment && (
                                          <div className="mt-2 text-sm text-gray-400 pl-4 border-l-2 border-amber-500/30">
                                            <strong className="text-amber-400">{t("checklist.history.comment") || "Comment"}:</strong> {itemData.comment}
                                          </div>
                                        )}
                                        {itemData.photo && (
                                          <div className="mt-3 pl-4">
                                            <a
                                              href={itemData.photo}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-block relative group"
                                            >
                                              <img
                                                src={getThumbnailUrl(itemData.photo)}
                                                alt="Item photo"
                                                className="w-24 h-24 object-cover rounded-lg border border-gray-600 group-hover:border-purple-500 group-hover:scale-110 transition-all duration-200 shadow-lg"
                                              />
                                              <div className="hidden group-hover:flex absolute inset-0 bg-black/70 items-center justify-center rounded-lg">
                                                <ExternalLink className="w-6 h-6 text-purple-400" />
                                              </div>
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t("common.previous") || "Previous"}
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 :
                  currentPage >= totalPages - 2 ? totalPages - 4 + i :
                  currentPage - 2 + i;

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition ${
                      currentPage === pageNum
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t("common.next") || "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
