// src/pages/Suivi/SuiviDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaFilePdf 
} from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { PAGE_PERMISSIONS } from '../../config/roles';
import { fetchSuivi, deleteSuiviEntry } from '../../api/api';
import { formatDateForDisplay, getDaysUntilExpiry } from '../../utils/dateUtils';

const SuiviDetail = () => {
  const navigate = useNavigate();
  const { plate } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [machinery, setMachinery] = useState(null);

  useEffect(() => {
    if (!PAGE_PERMISSIONS.SUIVILIST.includes(user?.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadMachineryDetail();
  }, [plate]);

  const loadMachineryDetail = async () => {
    setLoading(true);
    try {
      const data = await fetchSuivi();
      const found = data.find(item => item['Plate Number'] === plate);
      
      if (found) {
        setMachinery(found);
      } else {
        alert(t('suivi.detail.notFound'));
        navigate('/suivi/list');
      }
    } catch (error) {
      console.error('Error loading machinery detail:', error);
      alert(t('suivi.manage.alerts.networkError'));
      navigate('/suivi/list');
    } finally {
      setLoading(false);
    }
  };

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
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'ok':
        return 'bg-green-100 text-green-800 border border-green-300';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300';
    }
  };

  const renderExpiryBadge = (dateStr, label) => {
    if (!dateStr || dateStr === 'N/A') {
      return (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
          <span className={`inline-block px-3 py-2 rounded-lg text-sm ${getExpiryBadgeClass('na')}`}>
            {t('suivi.detail.fields.notApplicable')}
          </span>
        </div>
      );
    }

    const status = getExpiryStatus(dateStr);
    const days = getDaysUntilExpiry(dateStr);

    return (
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
        <div className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${getExpiryBadgeClass(status)}`}>
          <div className="font-semibold">{formatDateForDisplay(dateStr)}</div>
          {status !== 'na' && (
            <div className="text-xs mt-1">
              {days < 0 
                ? t('suivi.detail.fields.expired')
                : `${days} ${t('suivi.detail.fields.daysRemaining', { days })}`
              }
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleEdit = () => {
    navigate(`/suivi/manage?edit=${plate}`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      t('suivi.manage.alerts.deleteConfirm').replace('{plate}', plate)
    );
    
    if (!confirmed) return;

    try {
      const result = await deleteSuiviEntry(machinery.rowindex || 2);
      if (result.status === 'success') {
        alert(t('suivi.manage.alerts.deleteSuccess'));
        navigate('/suivi/list');
      } else {
        alert(t('suivi.manage.alerts.error'));
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert(t('suivi.manage.alerts.networkError'));
    }
  };

  const handleDocumentClick = (url) => {
    if (url && url !== 'N/A') {
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('suivi.detail.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!machinery) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => navigate('/suivi/list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>{t('suivi.detail.back')}</span>
        </button>

        {/* Title Section */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-t-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">
            🚛 {machinery.Machinery}
          </h1>
          <p className="text-lg opacity-90">{machinery['Model Type']}</p>
          <p className="text-xl font-semibold mt-2">🚗 {machinery['Plate Number']}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-lg shadow-lg p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              {t('suivi.detail.sections.basicInfo')}
            </h2>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">{t('suivi.detail.fields.status')}</span>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    machinery.Status === 'Permanent' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {machinery.Status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">{t('suivi.detail.fields.machinery')}</span>
                <p className="mt-1 text-gray-900">{machinery.Machinery}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">{t('suivi.detail.fields.model')}</span>
                <p className="mt-1 text-gray-900">{machinery['Model Type']}</p>
              </div>
            </div>
          </div>

          {/* Drivers */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              {t('suivi.detail.sections.drivers')}
            </h2>
            
            <div className="space-y-4">
              {/* Driver 1 */}
              <div>
                <span className="text-sm font-medium text-gray-700">{t('suivi.detail.fields.driver1')}</span>
                <p className="mt-1 text-gray-900">{machinery['Driver 1'] || '-'}</p>
                {machinery['Driver 1 Doc'] && machinery['Driver 1 Doc'] !== 'N/A' && (
                  <button
                    onClick={() => handleDocumentClick(machinery['Driver 1 Doc'])}
                    className="mt-2 flex items-center gap-2 text-blue-600 hover:underline text-sm"
                  >
                    <FaFilePdf /> {t('suivi.detail.fields.viewDocument')}
                  </button>
                )}
              </div>

              {/* Driver 2 */}
              {machinery['Driver 2'] && (
                <div>
                  <span className="text-sm font-medium text-gray-700">{t('suivi.detail.fields.driver2')}</span>
                  <p className="mt-1 text-gray-900">{machinery['Driver 2']}</p>
                  {machinery['Driver 2 Doc'] && machinery['Driver 2 Doc'] !== 'N/A' && (
                    <button
                      onClick={() => handleDocumentClick(machinery['Driver 2 Doc'])}
                      className="mt-2 flex items-center gap-2 text-blue-600 hover:underline text-sm"
                    >
                      <FaFilePdf /> {t('suivi.detail.fields.viewDocument')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Document Expiry */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              {t('suivi.detail.sections.documents')}
            </h2>
            
            {renderExpiryBadge(machinery.Insurance, t('suivi.detail.fields.insurance'))}
            {renderExpiryBadge(machinery['Technical Inspection'], t('suivi.detail.fields.technical'))}
            {renderExpiryBadge(machinery.Certificate, t('suivi.detail.fields.certificate'))}
          </div>

          {/* Machinery Documents */}
          {machinery.Documents && machinery.Documents !== 'N/A' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                {t('suivi.detail.fields.documents')}
              </h2>
              <button
                onClick={() => handleDocumentClick(machinery.Documents)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FaFilePdf size={20} />
                <span>{t('suivi.detail.fields.viewDocument')}</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {PAGE_PERMISSIONS.SUIVIMANAGE.includes(user?.role) && (
            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaEdit />
                <span>{t('suivi.detail.edit')}</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash />
                <span>{t('suivi.detail.delete')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuiviDetail;
