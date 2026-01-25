// frontend/src/pages/Checklist/History.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Search, 
  X, 
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  Loader2,
  ExternalLink
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";
import { getChecklistTemplate } from "@/config/checklistTemplates";

export default function ChecklistHistory() {
  const { user } = useAuth();
  const { equipment } = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    "Plate Number": "",
    "Model / Type": "",
    startDate: "",
    endDate: ""
  });

  const itemsPerPage = 10;

  /* -------------------- ACCESS CONTROL -------------------- */
  useEffect(() => {
    if (user?.role === "Cleaning Guy") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* -------------------- LOAD CHECKLIST DATA -------------------- */
  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const response = await fetchWithAuth('/api/Checklist_Log');
        if (response.ok) {
          let data = await response.json();
          
          // Sort by date descending
          data = data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

          // Apply driver-specific filtering
          if (user?.role === "Driver") {
            const driverEquipment = equipment.filter(eq =>
              eq["Driver 1"] === user.full_name || eq["Driver 2"] === user.full_name
            );
            const allowedPlates = driverEquipment.map(eq => eq["Plate Number"]);
            data = data.filter(record => allowedPlates.includes(record["Plate Number"]));
          }

          setChecklists(data);
        }
      } catch (error) {
        console.error('Error loading checklists:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChecklists();
  }, [user, equipment]);

  /* -------------------- FILTER AND SEARCH LOGIC -------------------- */
  const filteredChecklists = checklists.filter(record => {
    const matchesSearch = 
      record["Full Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record["Plate Number"]?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlate = !filters["Plate Number"] || record["Plate Number"] === filters["Plate Number"];
    const matchesModel = !filters["Model / Type"] || record["Model / Type"] === filters["Model / Type"];

    const recordDate = new Date(record.Date);
    const startFilter = filters.startDate ? new Date(filters.startDate) : null;
    const endFilter = filters.endDate ? new Date(filters.endDate) : null;

    const matchesDate = 
      (!startFilter || recordDate >= startFilter) &&
      (!endFilter || recordDate <= endFilter);

    return matchesSearch && matchesPlate && matchesModel && matchesDate;
  });

  /* -------------------- PAGINATION -------------------- */
  const totalPages = Math.ceil(filteredChecklists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChecklists = filteredChecklists.slice(startIndex, startIndex + itemsPerPage);

  /* -------------------- TOGGLE EXPANSION -------------------- */
  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  /* -------------------- FILTER HANDLERS -------------------- */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      "Plate Number": "",
      "Model / Type": "",
      startDate: "",
      endDate: ""
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  /* -------------------- STATUS ICON -------------------- */
  const getStatusIcon = (status) => {
    switch (status) {
      case "OK":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "Warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "Fail":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <span className="text-gray-500 text-sm">-</span>;
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
  const plateNumbers = [...new Set(equipment.map(eq => eq["Plate Number"]))]
  const models = [...new Set(equipment.map(eq => eq["Model / Type"]))]

  /* -------------------- LOADING SCREEN -------------------- */
  if (loading) {
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

          {/* Search and Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder={t("checklist.history.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
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

              {/* Reset Button */}
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  {t("checklist.history.reset")}
                </button>
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
              const isExpanded = expandedItems.has(recordId);
              const recordDate = new Date(record.Date);
              
              let checklistData = {};
              try {
                checklistData = JSON.parse(record["Checklist Data"] || "{}");
              } catch (e) {
                console.error("Failed to parse checklist data:", e);
              }

              const equipmentType = record["Equipment Type"] || record["Model / Type"];
              const checklistTemplate = getChecklistTemplate(equipmentType);

              return (
                <div 
                  key={recordId}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-purple-500/50 transition-all"
                >
                  {/* Collapsed View */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-700/30 transition"
                    onClick={() => toggleExpand(recordId)}
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
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{t("checklist.history.equipmentType") || "Type"}:</span>
                          <span className="font-medium text-emerald-400">{equipmentType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {isExpanded ? (
                          <ChevronUp className="text-purple-400" size={20} />
                        ) : (
                          <ChevronDown className="text-gray-400" size={20} />
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-400">
                      <span>{t("checklist.history.performedBy") || "Driver"}: {record["Full Name"]} ({t(`roles.${record.Role}`)})</span>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="border-t border-gray-700 p-6 bg-gray-900/20">
                      <div className="space-y-6">
                        {checklistTemplate.map((section) => {
                          const sectionItems = section.items.map(item => {
                            const itemKey = `${section.sectionKey}.${item.key}`;
                            const itemData = checklistData[itemKey];
                            return { ...item, key: itemKey, data: itemData };
                          }).filter(item => item.data); // Only show items that have data

                          if (sectionItems.length === 0) return null;

                          return (
                            <div key={section.sectionKey} className="border border-gray-700 rounded-xl p-4 bg-gray-800/30">
                              <h3 className="text-lg font-medium mb-4 text-cyan-300 flex items-center gap-2">
                                {t(section.titleKey)}
                              </h3>
                              <div className="space-y-3">
                                {sectionItems.map((item) => {
                                  const itemData = item.data;
                                  return (
                                    <div key={item.key} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
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
