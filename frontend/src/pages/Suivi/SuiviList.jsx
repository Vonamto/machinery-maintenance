import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaSearch, FaEye } from 'react-icons/fa';
import { fetchSuiviList } from '../../api/suiviApi';
import { formatDateForDisplay, getDaysUntilExpiry } from '../../utils/dateUtils';

const SuiviList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [machinery, setMachinery] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadMachinery();
  }, []);

  const loadMachinery = async () => {
    setLoading(true);
    try {
      const data = await fetchSuiviList();
      setMachinery(data);
    } catch (error) {
      console.error('Error loading machinery:', error);
      alert('Error loading machinery list');
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'na';
    const days = getDaysUntilExpiry(dateStr);
    if (days < 0) return 'expired';
    if (days <= 30) return 'warning';
    return 'ok';
  };

  const getExpiryBadgeClass = (status) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ok':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'na':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const renderExpiryBadge = (dateStr, label) => {
    if (!dateStr || dateStr === 'N/A') {
      return (
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <span className={`inline-block px-2 py-1 rounded-full text-xs border ${getExpiryBadgeClass('na')}`}>
            {t('suivi.detail.fields.notApplicable')}
          </span>
        </div>
      );
    }

    const status = getExpiryStatus(dateStr);
    const days = getDaysUntilExpiry(dateStr);

    return (
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className={`inline-block px-2 py-1 rounded-full text-xs border ${getExpiryBadgeClass(status)}`}>
          <div className="font-semibold">{formatDateForDisplay(dateStr)}</div>
          {status !== 'na' && (
            <div className="text-[10px] mt-0.5">
              {days < 0 
                ? t('suivi.detail.fields.expired')
                : days === 0 
                ? t('suivi.detail.fields.expired')
                : t('suivi.detail.fields.daysRemaining', { days })
              }
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredMachinery = machinery.filter(item => {
    const matchesSearch = 
      item.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesType = !typeFilter || item.machinery === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const uniqueStatuses = [...new Set(machinery.map(m => m.status))];
  const uniqueTypes = [...new Set(machinery.map(m => m.machinery))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('suivi.list.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/suivi')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <FaArrowLeft />
            <span>{t('common.back')}</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('suivi.list.title')}
          </h1>
          <p className="text-gray-600">
            {t('suivi.list.subtitle')}
          </p>
        </div>

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

        {/* Machinery List */}
        {filteredMachinery.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">{t('suivi.list.noMachinery')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMachinery.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="grid md:grid-cols-12 gap-4 items-center">
                  {/* Basic Info */}
                  <div className="md:col-span-3">
                    <div className="font-bold text-lg text-gray-800 mb-1">
                      {item.plateNumber}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {item.modelType}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.machinery}
                    </div>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                      item.status === 'Permanent' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {item.status === 'Permanent' ? t('suivi.status.permanent') : t('suivi.status.callOff')}
                    </span>
                  </div>

                  {/* Drivers */}
                  <div className="md:col-span-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {t('suivi.list.table.driver1')}
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {item.driver1 || '-'}
                    </div>
                    {item.driver2 && (
                      <>
                        <div className="text-xs text-gray-500 mb-1">
                          {t('suivi.list.table.driver2')}
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          {item.driver2}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Document Status */}
                  <div className="md:col-span-6 grid grid-cols-3 gap-3">
                    {renderExpiryBadge(item.insurance, t('suivi.list.table.insurance'))}
                    {renderExpiryBadge(item.technical, t('suivi.list.table.technical'))}
                    {renderExpiryBadge(item.certificate, t('suivi.list.table.certificate'))}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      onClick={() => navigate(`/suivi/detail/${item.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaEye />
                      <span className="hidden lg:inline">{t('suivi.list.viewDetails')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuiviList;
