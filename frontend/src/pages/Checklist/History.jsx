// frontend/src/pages/Checklist/History.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Calendar, Search, Filter, X, Eye, Download } from "lucide-react";
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

  // Load checklist data
  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const response = await fetchWithAuth('/api/Checklist_Log');
        if (response.ok) {
          let data = await response.json();
          
          // Sort by date descending
          data = data.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
          
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

  // Filter and search logic
  const filteredChecklists = checklists.filter(record => {
    const matchesSearch = record["Full Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record["Plate Number"].toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlate = !filters["Plate Number"] || record["Plate Number"] === filters["Plate Number"];
    const matchesModel = !filters["Model / Type"] || record["Model / Type"] === filters["Model / Type"];
    
    const recordDate = new Date(record.Date);
    const startFilter = filters.startDate ? new Date(filters.startDate) : null;
    const endFilter = filters.endDate ? new Date(filters.endDate) : null;
    
    const matchesDate = (!startFilter || recordDate >= startFilter) && 
                       (!endFilter || recordDate <= endFilter);

    return matchesSearch && matchesPlate && matchesModel && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredChecklists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChecklists = filteredChecklists.slice(startIndex, startIndex + itemsPerPage);

  // Toggle item expansion
  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset all filters
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

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "OK":
        return <span className="text-emerald-400">✅</span>;
      case "Warning":
        return <span className="text-amber-400">⚠️</span>;
      case "Fail":
        return <span className="text-red-400">❌</span>;
      default:
        return <span className="text-gray-400">-</span>;
    }
  };

  // Get equipment type specific checklist template
  const getEquipmentChecklistTemplate = (equipmentType) => {
    return getChecklistTemplate(equipmentType) || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
          <p className="text-lg">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Don't allow Cleaning Guys to access this page
  if (user?.role === "Cleaning Guy") {
    navigate("/", { replace: true });
    return null;
  }

  // Get unique plate numbers and models for filters
  const plateNumbers = [...new Set(equipment.map(eq => eq["Plate Number"]))];
  const models = [...new Set(equipment.map(eq => eq["Model / Type"]))];

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
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder={t("checklist.history.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>
              
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
              
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  {t("common.reset")}
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
            {t("checklist.history.results", { count: filteredChecklists.length })}
          </p>
        </div>

        {/* Checklist Items */}
        {paginatedChecklists.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {t("checklist.history.noResults")}
            </div>
            <p className="text-gray-600">{t("checklist.history.noResultsDescription")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedChecklists.map((record, index) => {
              const recordDate = new Date(record.Date);
              const checklistData = JSON.parse(record["Checklist Data"] || "{}");
              const equipmentType = record["Equipment Type"] || record["Model / Type"];
              const checklistTemplate = getEquipmentChecklistTemplate(equipmentType);
              
              return (
                <div key={`${record.Timestamp}-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
                  {/* Collapsed View */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-700/30 transition"
                    onClick={() => toggleExpand(`${record.Timestamp}-${index}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-gray-400" size={18} />
                          <span className="font-medium text-white">
                            {recordDate.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{t("checklist.history.plate")}:</span>
                          <span className="font-medium text-cyan-400">{record["Plate Number"]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{t("checklist.history.equipmentType")}:</span>
                          <span className="font-medium text-purple-400">{equipmentType}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ChevronDown 
                          className={`transform transition-transform ${expandedItems.has(`${record.Timestamp}-${index}`) ? 'rotate-180' : ''}`}
                          size={20}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-400">
                      <span>{t("checklist.history.performedBy")} {record["Full Name"]} ({t(`roles.${record.Role}`)})</span>
                    </div>
                  </div>
                  
                  {/* Expanded View */}
                  {expandedItems.has(`${record.Timestamp}-${index}`) && (
                    <div className="border-t border-gray-700 p-6 bg-gray-900/20">
                      <div className="space-y-6">
                        {checklistTemplate.map((section, sectionIndex) => (
                          <div key={section.section} className="border border-gray-700 rounded-xl p-4">
                            <h3 className="text-lg font-medium mb-4 text-cyan-300">
                              {t(`checklist.sections.${section.section}.${section.title}`)}
                            </h3>
                            
                            <div className="space-y-3">
                              {section.items.map((item) => {
                                const itemData = checklistData[item.id];
                                if (!itemData) return null;
                                
                                return (
                                  <div key={item.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-200">
                                        {t(`checklist.items.${item.id}.${item.label}`)}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-lg">
                                          {getStatusIcon(itemData.status)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {itemData.comment && (
                                      <div className="mt-2 text-sm text-gray-400 pl-6">
                                        <strong>{t("checklist.history.comment")}:</strong> {itemData.comment}
                                      </div>
                                    )}
                                    
                                    {itemData.photo && (
                                      <div className="mt-2 pl-6">
                                        <img 
                                          src={itemData.photo} 
                                          alt="Item photo" 
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-600"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
                        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center gap-2">
                          <Download size={16} />
                          {t("checklist.history.export")}
                        </button>
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
              {t("common.previous")}
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
              {t("common.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
