// src/pages/Suivi/SuiviList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, 
  FaSearch, 
  FaEdit, 
  FaTrash,
  FaPlus 
} from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { PAGE_PERMISSIONS } from '../../config/roles';
import { fetchSuivi, deleteSuiviEntry } from '../../api/api';
import { formatDateForDisplay, getDaysUntilExpiry } from '../../utils/dateUtils';

const SuiviList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [machinery, setMachinery] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionMode, setActionMode] = useState(null); // null, 'edit', 'delete'

  // ==================== ACCESS CONTROL ====================
  useEffect(() => {
    if (!PAGE_PERMISSIONS.SUIVILIST.includes(user?.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  // ==================== LOAD DATA ====================
  useEffect(() => {
    loadMachinery();
  }, []);

  const loadMachinery = async () => {
    setLoading(true);
    try {
      const data = await fetchSuivi();
      setMachinery(data || []);
    } catch (error) {
      console.error('Error loading machinery:', error);
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
    if (days <= 20) return 'warning'; // ⚠️ 20 DAYS THRESHOLD
    return 'ok';
  };

  const getExpiryBadgeClass = (status) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'ok':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'na':
        return 'bg-gray-100 text-gray-600 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300';
    }
  };

  const renderExpiryCell = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') {
      return (
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getExpiryBadgeClass('na')}`}>
          {t('suivi.detail.fields.notApplicable')}
        </div>
      );
    }

    const status = getExpiryStatus(dateStr);
    const days = getDaysUntilExpiry(dateStr);

    return (
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getExpiryBadgeClass(status)}`}>
        <div className="font-semibold">{formatDateForDisplay(dateStr)}</div>
        {status !== 'na' && (
          <div className="text-[10px] mt-0.5">
            {days < 0 
              ? t('suivi.detail.fields.expired')
              : `(${days} ${t('suivi.detail.fields.daysRemaining', { days })})`
            }
          </div>
        )}
      </div>
    );
  };

  // ==================== FILTERING ====================
  const filteredMachinery = machinery.filter(item => {
    const matchesSearch = 
      item['Plate Number']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item['Model Type']?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || item.Status === statusFilter;
    const matchesType = !typeFilter || item.Machinery === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueStatuses = [...new Set(machinery.map(m => m.Status))];
  const uniqueTypes = [...new Set(machinery.map(m => m.Machinery))];

  // ==================== ACTIONS ====================
  const handleEdit = (item) => {
    navigate(`/suivi/manage?edit=${item['Plate Number']}`);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      t('suivi.manage.alerts.deleteConfirm')
        .replace('{plate}', item['Plate Number'])
    );
    
    if (!confirmed) return;

    try {
      const result = await deleteSuiviEntry(item.rowindex || 2);
      if (result.status === 'success') {
        alert(t('suivi.manage.alerts.deleteSuccess'));
        loadMachinery(); // Reload list
      } else {
        alert(t('suivi.manage.alerts.error') + ': ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting machinery:', error);
      alert(t('suivi.manage.alerts.networkError'));
    }
  };

  const handleDocumentClick = (url) => {
    if (url && url !== 'N/A') {
      window.open(url, '_blank');
    }
  };

  // ==================== MOBILE CARD VIEW ====================
  const renderMobileCard = (item, index) => (
    <div
      key={index}
      onClick={() => navigate(`/suivi/detail/${item['Plate Number']}`)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-5 cursor-pointer border-l-4 border-blue-500"
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          item.Status === 'Permanent' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {item.Status}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="text-lg font-bold text-gray-800">
          {item.Machinery} - {item['Model Type']}
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-sm">🚗</span>
          <span className="font-medium">{item['Plate Number']}</span>
        </div>
      </div>

      <div className="mt-4 text-right">
        <span className="text-sm text-blue-600 font-medium">
          {t('suivi.list.viewDetails')} →
        </span>
      </div>
    </div>
  );

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('suivi.list.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/suivi')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <FaArrowLeft />
            <span>{t('common.back')}</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {t('suivi.list.title')}
              </h1>
              <p className="text-gray-600">
                {t('suivi.list.subtitle')}
              </p>
            </div>

            {/* Add New Button */}
            {PAGE_PERMISSIONS.SUIVIMANAGE.includes(user?.role) && (
              <button
                onClick={() => navigate('/suivi/manage')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaPlus />
                <span>{t('suivi.manage.addButton')}</span>
              </button>
            )}
          </div>
        </div>

        {/* ACTION MODE SELECTOR (Desktop only) */}
        {PAGE_PERMISSIONS.SUIVIMANAGE.includes(user?.role) && (
          <div className="hidden lg:flex items-center gap-4 mb-6 bg-white rounded-lg shadow-md p-4">
            <span className="text-sm font-medium text-gray-700">Action:</span>
            <button
              onClick={() => setActionMode(actionMode === 'edit' ? null : 'edit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                actionMode === 'edit'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              <FaEdit />
              <span>{t('common.edit')}</span>
            </button>
            <button
              onClick={() => setActionMode(actionMode === 'delete' ? null : 'delete')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                actionMode === 'delete'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
              }`}
            >
              <FaTrash />
              <span>{t('common.delete')}</span>
            </button>

            {/* Info/Warning Message */}
            {actionMode && (
              <div className={`ml-4 text-sm ${
                actionMode === 'edit' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {actionMode === 'edit' 
                  ? 'ℹ️ Edit mode active - Click edit button to modify entries'
                  : '⚠️ Delete mode active - Click delete to permanently remove entries'
                }
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('suivi.list.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('suivi.list.allStatus')}</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('suivi.list.allTypes')}</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* NO RESULTS */}
        {filteredMachinery.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">{t('suivi.list.noMachinery')}</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW - Cards */}
            <div className="lg:hidden grid gap-4">
              {filteredMachinery.map((item, index) => renderMobileCard(item, index))}
            </div>

            {/* DESKTOP VIEW - Table */}
            <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.machinery')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.model')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.plate')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.driver1')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.driver2')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.insurance')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.technical')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {t('suivi.list.table.certificate')}
                      </th>
                      {actionMode && (
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {t('common.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredMachinery.map((item, index) => (
                      <tr 
                        key={index}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        {/* Index */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            item.Status === 'Permanent' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.Status === 'Permanent' ? t('suivi.status.permanent') : t('suivi.status.callOff')}
                          </span>
                        </td>

                        {/* Machinery */}
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {item.Machinery}
                        </td>

                        {/* Model */}
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                          {item['Model Type']}
                        </td>

                        {/* Plate - Clickable */}
                        <td 
                          onClick={() => handleDocumentClick(item.Documents)}
                          className="px-4 py-3 text-sm text-blue-600 font-semibold cursor-pointer hover:bg-blue-50 hover:underline transition-colors rounded"
                        >
                          {item['Plate Number']}
                        </td>

                        {/* Driver 1 - Clickable */}
                        <td 
                          onClick={() => handleDocumentClick(item['Driver 1 Doc'])}
                          className={`px-4 py-3 text-sm font-medium ${
                            item['Driver 1'] 
                              ? 'text-blue-600 cursor-pointer hover:bg-blue-50 hover:underline transition-colors rounded' 
                              : 'text-gray-400'
                          }`}
                        >
                          {item['Driver 1'] || '-'}
                        </td>

                        {/* Driver 2 - Clickable */}
                        <td 
                          onClick={() => handleDocumentClick(item['Driver 2 Doc'])}
                          className={`px-4 py-3 text-sm font-medium ${
                            item['Driver 2'] 
                              ? 'text-blue-600 cursor-pointer hover:bg-blue-50 hover:underline transition-colors rounded' 
                              : 'text-gray-400'
                          }`}
                        >
                          {item['Driver 2'] || '-'}
                        </td>

                        {/* Insurance */}
                        <td className="px-4 py-3 text-center">
                          {renderExpiryCell(item.Insurance)}
                        </td>

                        {/* Technical */}
                        <td className="px-4 py-3 text-center">
                          {renderExpiryCell(item['Technical Inspection'])}
                        </td>

                        {/* Certificate */}
                        <td className="px-4 py-3 text-center">
                          {renderExpiryCell(item.Certificate)}
                        </td>

                        {/* Actions Column */}
                        {actionMode === 'edit' && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FaEdit size={18} />
                            </button>
                          </td>
                        )}
                        {actionMode === 'delete' && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FaTrash size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuiviList;
