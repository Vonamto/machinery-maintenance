// src/pages/Suivi/SuiviDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit, Trash2, FileText, Loader2, Calendar, Truck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { PAGE_PERMISSIONS, canUserPerformAction } from '../../config/roles';
import { fetchSuivi, deleteSuiviEntry, fetchMachineryTypes } from '../../api/api';
import { formatDateForDisplay, getDaysUntilExpiry } from '../../utils/dateUtils';

const SuiviDetail = () => {
  const navigate = useNavigate();
  const { plate } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [machinery, setMachinery] = useState(null);
  const [trailer, setTrailer] = useState(null); // ✅ NEW: Trailer data
  const [machineryTypes, setMachineryTypes] = useState([]);

  // ✅ Centralized permission checks from roles.js
  const canEdit = canUserPerformAction(user?.role, 'SUIVI_EDIT');
  const canDelete = canUserPerformAction(user?.role, 'SUIVI_DELETE');

  // ==================== ACCESS CONTROL ====================
  useEffect(() => {
    if (!PAGE_PERMISSIONS.SUIVIDETAIL.includes(user?.role)) {
      navigate('/');
    }
  }, [user, navigate]);

  // ==================== LOAD DATA ====================
  useEffect(() => {
    loadMachineryDetail();
  }, [plate]);

  const loadMachineryDetail = async () => {
    setLoading(true);
    try {
      const [suiviData, typesData] = await Promise.all([
        fetchSuivi(),
        fetchMachineryTypes()
      ]);
      
      const foundIndex = suiviData.findIndex(item => item['Plate Number'] === plate);
      
      if (foundIndex !== -1) {
        const mainMachinery = suiviData[foundIndex];
        setMachinery(mainMachinery);
        setMachineryTypes(typesData || []);

        // ✅ NEW: Check if next row is a trailer
        const nextRow = suiviData[foundIndex + 1];
        if (nextRow && nextRow.Machinery === 'Trailer') {
          setTrailer(nextRow);
        }
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

  // Helper function to get display name based on language
  const getMachineryDisplayName = (englishName) => {
    if (i18n.language === 'ar') {
      const type = machineryTypes.find(t => t.english === englishName);
      return type?.arabic || englishName;
    }
    return englishName;
  };

  // ==================== EXPIRY STATUS LOGIC ====================
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
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const renderExpiryBadge = (dateStr, label) => {
    if (!dateStr || dateStr === 'N/A') {
      return (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-300 mb-2">{label}</div>
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
        <div className="text-sm font-medium text-gray-300 mb-2">{label}</div>
        <div className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${getExpiryBadgeClass(status)}`}>
          <div className="font-semibold">{formatDateForDisplay(dateStr)}</div>
          {status !== 'na' && (
            <div className="text-xs mt-1">
              {days < 0 
                ? t('suivi.detail.fields.expired')
                : `(${days} ${days === 1 ? 'day' : 'days'} remaining)`
              }
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render normal date (non-expiry)
  const renderDateBadge = (dateStr, label) => {
    if (!dateStr || dateStr === 'N/A') {
      return (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-300 mb-2">{label}</div>
          <span className="text-gray-500 text-sm">-</span>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-300 mb-2">{label}</div>
        <div className="inline-block px-3 py-2 rounded-lg text-sm font-medium bg-gray-600/20 text-gray-300 border border-gray-600/50">
          <div className="font-semibold">{formatDateForDisplay(dateStr)}</div>
        </div>
      </div>
    );
  };

  // ==================== ACTIONS ====================
  const handleEdit = () => {
    // ✅ Check permission before editing
    if (!canEdit) {
      alert(t("requests.grease.menu.accessDenied.message"));
      return;
    }
    navigate(`/suivi/manage?edit=${plate}`);
  };

  const handleDelete = async () => {
    // ✅ Check permission before deleting
    if (!canDelete) {
      alert(t("requests.grease.menu.accessDenied.message"));
      return;
    }
    
    const confirmed = window.confirm(
      t('suivi.manage.alerts.deleteConfirm').replace('{plate}', plate)
    );
    
    if (!confirmed) return;

    setDeleting(true);

    try {
      // ✅ Backend will automatically delete trailer if exists
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
    } finally {
      setDeleting(false);
    }
  };

  const handleDocumentClick = (url) => {
    if (url && url !== 'N/A') {
      window.open(url, '_blank');
    }
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-pink-400 mx-auto mb-4" />
            <p className="text-gray-300">{t('suivi.detail.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!machinery) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => navigate('/suivi/list')}
          className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('suivi.detail.back')}</span>
        </button>

        <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-t-2xl p-6 shadow-lg shadow-pink-500/50">
          <h1 className="text-3xl font-bold mb-2">
            {getMachineryDisplayName(machinery.Machinery)}
          </h1>
          <p className="text-lg opacity-90">{machinery['Model / Type']}</p>
          <p className="text-xl font-semibold mt-2 flex items-center gap-2">
            <span className="text-pink-200">#</span> {machinery['Plate Number']}
          </p>
          {/* ✅ NEW: Show trailer badge if exists */}
          {trailer && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
              <Truck size={16} />
              <span>{t('suivi.detail.hasTrailer') || 'Has Trailer'}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-x border-b border-gray-700 rounded-b-2xl p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-semibold text-pink-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <FileText size={20} />
              {t('suivi.detail.sections.basicInfo')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-400">{t('suivi.detail.fields.status')}</span>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    machinery.Status === 'Permanent' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {machinery.Status === 'Permanent' ? t('suivi.status.permanent') : t('suivi.status.callOff')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-400">{t('suivi.detail.fields.machinery')}</span>
                <p className="mt-1 text-white">{getMachineryDisplayName(machinery.Machinery)}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-400">{t('suivi.detail.fields.model')}</span>
                <p className="mt-1 text-white">{machinery['Model / Type']}</p>
              </div>
            </div>
          </div>

          {/* Drivers */}
          <div>
            <h2 className="text-xl font-semibold text-pink-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <FileText size={20} />
              {t('suivi.detail.sections.drivers')}
            </h2>
            
            <div className="space-y-4">
              {/* Driver 1 */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <span className="text-sm font-medium text-gray-400">{t('suivi.detail.fields.driver1')}</span>
                <p className="mt-1 text-white">{machinery['Driver 1'] || '-'}</p>
                {machinery['Driver 1 Doc'] && machinery['Driver 1 Doc'] !== 'N/A' && (
                  <button
                    onClick={() => handleDocumentClick(machinery['Driver 1 Doc'])}
                    className="mt-2 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline text-sm transition-colors"
                  >
                    <FileText size={16} /> {t('suivi.detail.fields.viewDocument')}
                  </button>
                )}
              </div>

              {/* Driver 2 */}
              {machinery['Driver 2'] && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                  <span className="text-sm font-medium text-gray-400">{t('suivi.detail.fields.driver2')}</span>
                  <p className="mt-1 text-white">{machinery['Driver 2']}</p>
                  {machinery['Driver 2 Doc'] && machinery['Driver 2 Doc'] !== 'N/A' && (
                    <button
                      onClick={() => handleDocumentClick(machinery['Driver 2 Doc'])}
                      className="mt-2 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline text-sm transition-colors"
                    >
                      <FileText size={16} /> {t('suivi.detail.fields.viewDocument')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ UPDATED: Document Expiry - Show TWO subsections if trailer exists */}
          <div>
            <h2 className="text-xl font-semibold text-pink-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <FileText size={20} />
              {t('suivi.detail.sections.documents')}
            </h2>
            
            {/* Truck/Main Machinery Subsection */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 mb-4">
              <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <FileText size={18} />
                {t('suivi.detail.truckDocuments') || 'Truck Documents'}
              </h3>
              <div className="space-y-4">
                {renderExpiryBadge(machinery.Insurance, t('suivi.detail.fields.insurance'))}
                {renderExpiryBadge(machinery['Technical Inspection'], t('suivi.detail.fields.technical'))}
                {renderExpiryBadge(machinery.Certificate, t('suivi.detail.fields.certificate'))}
              </div>
            </div>

            {/* ✅ NEW: Trailer Subsection (if exists) */}
            {trailer && (
              <div className="bg-gray-900/50 rounded-xl p-4 border border-orange-500/30">
                <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                  <Truck size={18} />
                  {t('suivi.detail.trailerDocuments') || 'Trailer Documents'}
                </h3>
                <div className="mb-3 text-sm text-gray-300">
                  <span className="font-medium">{t('suivi.detail.fields.model')}:</span> {trailer['Model / Type']}
                  <br />
                  <span className="font-medium">{t('suivi.detail.fields.plate')}:</span> {trailer['Plate Number']}
                </div>
                <div className="space-y-4">
                  {renderExpiryBadge(trailer.Insurance, t('suivi.detail.fields.insurance'))}
                  {renderExpiryBadge(trailer['Technical Inspection'], t('suivi.detail.fields.technical'))}
                  {renderExpiryBadge(trailer.Certificate, t('suivi.detail.fields.certificate'))}
                </div>
              </div>
            )}
          </div>

          {/* Inspection Schedule Section (only for main machinery) */}
          <div>
            <h2 className="text-xl font-semibold text-pink-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <Calendar size={20} />
              {t('suivi.detail.sections.inspection')}
            </h2>
            
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 space-y-4">
              {/* Inspection Date (non-expiry) */}
              {renderDateBadge(machinery['Inspection Date'], t('suivi.detail.fields.inspectionDate'))}
              {/* Next Inspection (expiry) */}
              {renderExpiryBadge(machinery['Next Inspection'], t('suivi.detail.fields.nextInspection'))}
            </div>
          </div>

          {/* ✅ UPDATED: Machinery Documents - Show TWO sections if trailer exists */}
          <div>
            <h2 className="text-xl font-semibold text-pink-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <FileText size={20} />
              {t('suivi.detail.sections.machineryDocuments') || 'Machinery Documents'}
            </h2>
            
            <div className="space-y-4">
              {/* Truck Documents */}
              {machinery.Documents && machinery.Documents !== 'N/A' && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-md font-semibold text-purple-400 mb-3">
                    {t('suivi.detail.truckDocuments') || 'Truck Documents'}
                  </h3>
                  <button
                    onClick={() => handleDocumentClick(machinery.Documents)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded-xl hover:bg-blue-600/30 transition-colors"
                  >
                    <FileText size={20} />
                    <span>{t('suivi.detail.fields.viewDocument')}</span>
                  </button>
                </div>
              )}

              {/* ✅ NEW: Trailer Documents (if exists) */}
              {trailer && trailer.Documents && trailer.Documents !== 'N/A' && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-orange-500/30">
                  <h3 className="text-md font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <Truck size={18} />
                    {t('suivi.detail.trailerDocuments') || 'Trailer Documents'}
                  </h3>
                  <button
                    onClick={() => handleDocumentClick(trailer.Documents)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-orange-600/20 text-orange-400 border border-orange-500/50 rounded-xl hover:bg-orange-600/30 transition-colors"
                  >
                    <FileText size={20} />
                    <span>{t('suivi.detail.fields.viewDocument')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - ✅ Show only if user has permissions */}
          {(canEdit || canDelete) && (
            <div className="flex gap-4 pt-6 border-t border-gray-700">
              {canEdit && (
                <button
                  onClick={handleEdit}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-blue-500/50"
                >
                  <Edit size={18} />
                  <span>{t('suivi.detail.edit')}</span>
                </button>
              )}
              
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-red-500/50"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      <span>{t('suivi.detail.delete')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuiviDetail;
