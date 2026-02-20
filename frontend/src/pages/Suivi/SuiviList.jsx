// src/pages/Suivi/SuiviList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search, Edit, Trash2, Plus, FileText, Loader2, Hash, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { PAGE_PERMISSIONS, canUserPerformAction } from '../../config/roles';
import { fetchSuivi, deleteSuiviEntry, fetchMachineryTypes } from '../../api/api';
import { formatDateForDisplay, getDaysUntilExpiry } from '../../utils/dateUtils';

const SuiviList = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [allMachinery, setAllMachinery] = useState([]);
  const [machineryTypes, setMachineryTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionMode, setActionMode] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  const canAdd = canUserPerformAction(user?.role, 'SUIVI_ADD');
  const canEdit = canUserPerformAction(user?.role, 'SUIVI_EDIT');
  const canDelete = canUserPerformAction(user?.role, 'SUIVI_DELETE');
  const canManage = canEdit || canDelete;

  // ==================== ACCESS CONTROL ====================
  useEffect(() => {
    if (!PAGE_PERMISSIONS.SUIVILIST.includes(user?.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  // ==================== RESPONSIVE DETECTION ====================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerPage = isMobile ? 10 : 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, itemsPerPage]);

  // ==================== HELPER FUNCTIONS ====================
  
  const getMachineryDisplayName = (englishName) => {
    if (i18n.language === 'ar') {
      const type = machineryTypes.find(t => t.english === englishName);
      return type?.arabic || englishName;
    }
    return englishName;
  };

  const isTrailerRow = (item) => {
    return item.Machinery === 'Trailer';
  };

  // ==================== DRIVER FILTERING ====================
  
  const driverAllowedPlates = useMemo(() => {
    if (user?.role !== 'Driver' || !user?.full_name) return null;
    
    const plateNumbers = [];
    const driverFullName = user.full_name;
    
    allMachinery.forEach((item) => {
      if (isTrailerRow(item)) return;
      
      const driver1 = item['Driver 1'] || '';
      const driver2 = item['Driver 2'] || '';
      
      if (
        driver1.toLowerCase().trim() === driverFullName.toLowerCase().trim() ||
        driver2.toLowerCase().trim() === driverFullName.toLowerCase().trim()
      ) {
        plateNumbers.push(item['Plate Number']);
      }
    });
    
    return plateNumbers;
  }, [user, allMachinery]);

  const machinery = useMemo(() => {
    if (user?.role !== 'Driver' || !Array.isArray(driverAllowedPlates)) {
      return allMachinery;
    }
    
    if (driverAllowedPlates.length === 0) {
      return [];
    }
    
    const result = [];
    for (let i = 0; i < allMachinery.length; i++) {
      const item = allMachinery[i];
      
      if (isTrailerRow(item)) continue;
      
      if (driverAllowedPlates.includes(item['Plate Number'])) {
        result.push(item);
        
        const nextRow = allMachinery[i + 1];
        if (nextRow && isTrailerRow(nextRow)) {
          result.push(nextRow);
        }
      }
    }
    
    return result;
  }, [allMachinery, driverAllowedPlates, user]);

  // ==================== LOAD DATA ====================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [machineryData, typesData] = await Promise.all([
        fetchSuivi(),
        fetchMachineryTypes()
      ]);
      
      setAllMachinery(machineryData || []);
      setMachineryTypes(typesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(t('suivi.manage.alerts.networkError'));
    } finally {
      setLoading(false);
    }
  };

  // ==================== EXPIRY STATUS LOGIC (20 DAYS) ====================
  const getExpiryStatus = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'na';
    const days = getDaysUntilExpiry(dateStr);
    if (days < 0) return 'expired';
    if (days <= 20) return 'warning';
    return 'ok';
  };

  const getExpiryBadgeClass = (status) => {
    switch (status) {
      case 'expired':
        return 'bg-red-500/20 text-red-400 border border-red-500/50';
      case 'warning':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/50';
      case 'ok':
        return 'bg-green-500/20 text-green-400 border border-green-500/50';
      case 'na':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const renderExpiryCell = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') {
      return (
        <div dir="ltr" className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getExpiryBadgeClass('na')}`}>
          {t('suivi.detail.fields.notApplicable')}
        </div>
      );
    }

    const status = getExpiryStatus(dateStr);
    const days = getDaysUntilExpiry(dateStr);

    return (
      <div dir="ltr" className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getExpiryBadgeClass(status)}`}>
        <div className="font-semibold">{formatDateForDisplay(dateStr)}</div>
        {status !== 'na' && (
          <div className="text-[10px] mt-0.5">
            {days < 0 
              ? t('suivi.detail.fields.expired')
              : `(${days} ${days === 1 ? 'day' : 'days'} remaining)`
            }
          </div>
        )}
      </div>
    );
  };

  const renderDateCell = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') {
      return (
        <div dir="ltr" className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
          -
        </div>
      );
    }
    return (
      <div dir="ltr" className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-gray-600/20 text-gray-300 border border-gray-600/40">
        {formatDateForDisplay(dateStr)}
      </div>
    );
  };

  // ==================== FILTERING ====================
  const filteredMachinery = (() => {
    const result = [];
    
    for (let i = 0; i < machinery.length; i++) {
      const item = machinery[i];
      
      if (isTrailerRow(item)) {
        continue;
      }
      
      const plateNumber = String(item['Plate Number'] || '').toLowerCase();
      const modelType = String(item['Model / Type'] || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = 
        plateNumber.includes(search) ||
        modelType.includes(search);
        
      const matchesStatus = !statusFilter || item.Status === statusFilter;
      const matchesType = !typeFilter || item.Machinery === typeFilter;
      
      if (matchesSearch && matchesStatus && matchesType) {
        result.push(item);
        
        const nextRow = machinery[i + 1];
        if (nextRow && isTrailerRow(nextRow)) {
          result.push(nextRow);
        }
      }
    }
    
    return result;
  })();

  const uniqueStatuses = [...new Set(machinery.map(m => m.Status).filter(Boolean))];
  const uniqueTypes = [...new Set(machinery.map(m => m.Machinery).filter(Boolean))].filter(type => type !== 'Trailer');

  // ==================== PAGINATION LOGIC ====================
  const logicalGroups = [];
  for (let i = 0; i < filteredMachinery.length; i++) {
    const item = filteredMachinery[i];
    if (isTrailerRow(item)) continue;
    const group = [item];
    const next = filteredMachinery[i + 1];
    if (next && isTrailerRow(next)) group.push(next);
    logicalGroups.push(group);
  }

  const totalPages = Math.ceil(logicalGroups.length / itemsPerPage);
  const paginatedMachinery = logicalGroups
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .flat();

  // ==================== PAGINATION UI ====================
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
      const pages = new Set([1, totalPages, currentPage]);
      if (currentPage > 1) pages.add(currentPage - 1);
      if (currentPage < totalPages) pages.add(currentPage + 1);
      return [...pages].sort((a, b) => a - b);
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex items-center justify-between mt-4 px-1 flex-wrap gap-3">
        <span className="text-sm text-gray-400">
          {t('common.page') || 'Page'} {currentPage} / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-pink-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers.map((page, idx) => {
            const showEllipsis = idx > 0 && page - pageNumbers[idx - 1] > 1;
            return (
              <React.Fragment key={page}>
                {showEllipsis && (
                  <span className="px-1 text-gray-500 select-none">…</span>
                )}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg border transition-all text-sm font-medium ${
                    currentPage === page
                      ? 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-500/30'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-pink-500'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-pink-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // ==================== ACTIONS ====================
  const handleEdit = (item) => {
    if (!canEdit) {
      alert(t("requests.grease.menu.accessDenied.message"));
      return;
    }
    navigate(`/suivi/manage?edit=${item['Plate Number']}`);
  };

  const handleDelete = async (item, index) => {
    if (!canDelete) {
      alert(t("requests.grease.menu.accessDenied.message"));
      return;
    }
    
    const confirmed = window.confirm(
      t('suivi.manage.alerts.deleteConfirm')
        .replace('{plate}', item['Plate Number'])
    );
    
    if (!confirmed) return;

    setDeletingIndex(index);

    try {
      const result = await deleteSuiviEntry(item.rowindex || 2);
      if (result.status === 'success') {
        alert(t('suivi.manage.alerts.deleteSuccess'));
        loadData();
      } else {
        alert(t('suivi.manage.alerts.error') + ': ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting machinery:', error);
      alert(t('suivi.manage.alerts.networkError'));
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleDocumentClick = (url) => {
    if (url && url !== 'N/A') {
      window.open(url, '_blank');
    }
  };

  // ==================== MOBILE CARD VIEW ====================
  const renderMobileCard = (item, index) => {
    if (isTrailerRow(item)) return null;

    return (
      <div
        key={index}
        onClick={() => navigate(`/suivi/detail/${item['Plate Number']}`)}
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-pink-500 transition-all p-5 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            item.Status === 'Permanent' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            {item.Status === 'Permanent' ? t('suivi.status.permanent') : t('suivi.status.callOff')}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="text-lg font-bold text-white">
            {getMachineryDisplayName(item.Machinery)}
          </div>
          <div className="text-sm text-gray-400">
            {item['Model / Type']}
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Hash size={16} className="text-pink-400" />
            <span className="font-medium">{item['Plate Number']}</span>
          </div>
        </div>

        <div className="mt-4 text-right">
          <span className="text-sm text-pink-400 font-medium">
            {t('suivi.list.viewDetails')} →
          </span>
        </div>
      </div>
    );
  };

  let rowNumber = (currentPage - 1) * itemsPerPage;

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-pink-400 mx-auto mb-4" />
            <p className="text-gray-300">{t('suivi.list.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/suivi')}
            className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 mb-4 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('common.back')}</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-600 to-rose-500 shadow-lg shadow-pink-500/40">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
                  {t('suivi.list.title')}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {t('suivi.list.subtitle')}
                </p>
              </div>
            </div>

            {canAdd && (
              <button
                onClick={() => navigate('/suivi/manage')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-xl transition-all shadow-lg shadow-green-500/50"
              >
                <Plus size={18} />
                <span>{t('suivi.manage.addButton')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ACTION MODE SELECTOR */}
        {canManage && (
          <div className="hidden lg:flex items-center gap-4 mb-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
            <span className="text-sm font-medium text-gray-300">{t('common.actions')}:</span>
            
            {canEdit && (
              <button
                onClick={() => setActionMode(actionMode === 'edit' ? null : 'edit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  actionMode === 'edit'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-900/70 border-gray-600 text-gray-300 hover:border-blue-500'
                }`}
              >
                <Edit size={16} />
                <span>{t('common.edit')}</span>
              </button>
            )}
            
            {canDelete && (
              <button
                onClick={() => setActionMode(actionMode === 'delete' ? null : 'delete')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  actionMode === 'delete'
                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-900/70 border-gray-600 text-gray-300 hover:border-red-500'
                }`}
              >
                <Trash2 size={16} />
                <span>{t('common.delete')}</span>
              </button>
            )}

            {actionMode && (
              <div className={`ml-4 text-sm ${
                actionMode === 'edit' ? 'text-blue-400' : 'text-red-400'
              }`}>
                {actionMode === 'edit' 
                  ? `ℹ️ ${t('suivi.list.editModeActive')}`
                  : `⚠️ ${t('suivi.list.deleteModeActive')}`
                }
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('suivi.list.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            >
              <option value="">{t('suivi.list.allStatus')}</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status === 'Permanent' ? t('suivi.status.permanent') : t('suivi.status.callOff')}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
            >
              <option value="">{t('suivi.list.allTypes')}</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{getMachineryDisplayName(type)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* NO RESULTS */}
        {filteredMachinery.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-12 text-center">
            <p className="text-gray-400 text-lg">{t('suivi.list.noMachinery')}</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW */}
            <div className="lg:hidden grid gap-4">
              {paginatedMachinery.map((item, index) => renderMobileCard(item, index))}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden lg:block bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">#</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.status')}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.machinery')}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.model')}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.plate')}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.driver1')}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.driver2')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.insurance')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.technical')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.certificate')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.inspectionDate')}</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('suivi.list.table.nextInspection')}</th>
                      {actionMode && (
                        <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {paginatedMachinery.map((item, index) => {
                      const isTrailer = isTrailerRow(item);
                      
                      if (!isTrailer) {
                        rowNumber++;
                      }

                      return (
                        <tr 
                          key={index}
                          className={`hover:bg-gray-700/30 transition-colors ${isTrailer ? 'bg-gray-800/30' : ''}`}
                        >
                          <td className="px-3 py-3 text-sm text-gray-400">
                            {isTrailer ? '' : rowNumber}
                          </td>

                          <td className="px-3 py-3">
                            {!isTrailer && (
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                item.Status === 'Permanent' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {item.Status === 'Permanent' ? t('suivi.status.permanent') : t('suivi.status.callOff')}
                              </span>
                            )}
                          </td>

                          <td 
                            onClick={() => handleDocumentClick(item.Documents)}
                            className="px-3 py-3 text-sm cursor-pointer hover:bg-gray-700/50 transition-colors rounded"
                          >
                            {isTrailer ? (
                              <span className="flex items-center gap-2 text-orange-400 hover:underline">
                                <Truck size={16} />
                                <span className="font-medium">{t('suivi.detail.trailerInfo') || 'Trailer'}</span>
                              </span>
                            ) : (
                              <span className="text-purple-400 hover:underline font-medium">{getMachineryDisplayName(item.Machinery)}</span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-sm text-white font-medium">{item['Model / Type']}</td>

                          <td 
                            onClick={() => handleDocumentClick(item.Documents)}
                            className="px-3 py-3 text-sm text-pink-400 font-semibold cursor-pointer hover:bg-gray-700/50 hover:underline transition-colors rounded"
                          >
                            {item['Plate Number']}
                          </td>

                          <td 
                            onClick={() => !isTrailer && handleDocumentClick(item['Driver 1 Doc'])}
                            className={`px-3 py-3 text-sm font-medium ${
                              !isTrailer && item['Driver 1'] 
                                ? 'text-blue-400 cursor-pointer hover:bg-gray-700/50 hover:underline transition-colors rounded' 
                                : 'text-gray-500'
                            }`}
                          >
                            {!isTrailer && (item['Driver 1'] || '-')}
                          </td>
                          <td 
                            onClick={() => !isTrailer && handleDocumentClick(item['Driver 2 Doc'])}
                            className={`px-3 py-3 text-sm font-medium ${
                              !isTrailer && item['Driver 2'] 
                                ? 'text-blue-400 cursor-pointer hover:bg-gray-700/50 hover:underline transition-colors rounded' 
                                : 'text-gray-500'
                            }`}
                          >
                            {!isTrailer && (item['Driver 2'] || '-')}
                          </td>

                          <td className="px-3 py-3 text-center">{renderExpiryCell(item.Insurance)}</td>
                          <td className="px-3 py-3 text-center">{renderExpiryCell(item['Technical Inspection'])}</td>
                          <td className="px-3 py-3 text-center">{renderExpiryCell(item.Certificate)}</td>
                          
                          <td className="px-3 py-3 text-center">
                            {!isTrailer && renderDateCell(item['Inspection Date'])}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {!isTrailer && renderExpiryCell(item['Next Inspection'])}
                          </td>

                          {actionMode === 'edit' && !isTrailer && (
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                title="Edit (including trailer)"
                              >
                                <Edit size={18} />
                              </button>
                            </td>
                          )}
                          {actionMode === 'delete' && !isTrailer && (
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => handleDelete(item, index)}
                                disabled={deletingIndex === index}
                                className={`p-2 rounded-lg transition-colors ${
                                  deletingIndex === index
                                    ? 'text-gray-500 cursor-not-allowed'
                                    : 'text-red-400 hover:bg-red-500/20'
                                }`}
                                title="Delete (including trailer)"
                              >
                                {deletingIndex === index ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                              </button>
                            </td>
                          )}
                          {actionMode && isTrailer && <td className="px-3 py-3"></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default SuiviList;
