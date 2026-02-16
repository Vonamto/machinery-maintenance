// src/pages/Suivi/SuiviManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, FileText, CheckCircle, Save, Plus, Loader2, X, AlertCircle, Truck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useCache } from '../../context/CacheContext';
import { PAGE_PERMISSIONS, canUserPerformAction } from '../../config/roles';
import { 
  fetchMachineryTypes, 
  addSuiviEntry, 
  updateSuiviEntry,
  fetchSuivi 
} from '../../api/api';
import { pdfToBase64, validatePDFSize } from '../../utils/pdfUtils';

const SuiviManage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const cache = useCache();
  const [searchParams] = useSearchParams();
  const editPlate = searchParams.get('edit');

  // ==================== STATE ====================
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [machineryTypes, setMachineryTypes] = useState([]);
  const [existingData, setExistingData] = useState(null);
  const [existingTrailerUrl, setExistingTrailerUrl] = useState(''); // ✅ NEW: Store trailer doc URL

  // Form fields
  const [formData, setFormData] = useState({
    Status: '',
    Machinery: '',
    'Model / Type': '',
    'Plate Number': '',
    'Driver 1': '',
    'Driver 2': '',
    Insurance: '',
    'Technical Inspection': '',
    Certificate: '',
    'Inspection Date': '',
    'Next Inspection': '',
  });

  // ✅ NEW: Trailer state
  const [hasTrailer, setHasTrailer] = useState(false);
  const [trailerData, setTrailerData] = useState({
    'Trailer Model/Type': '',
    'Trailer Plate': '',
    'Trailer Insurance': '',
    'Trailer Technical': '',
    'Trailer Certificate': '',
  });

  // PDF files state
  const [pdfFiles, setPdfFiles] = useState({
    Documents: null,
    'Driver 1 Doc': null,
    'Driver 2 Doc': null,
  });

  // ✅ NEW: Trailer PDF state
  const [trailerPdfFile, setTrailerPdfFile] = useState(null);

  // Certificate NA checkbox
  const [certificateNA, setCertificateNA] = useState(false);
  const [trailerCertificateNA, setTrailerCertificateNA] = useState(false);

  // ✅ Centralized permission checks from roles.js
  const canAdd = canUserPerformAction(user?.role, 'SUIVI_ADD');
  const canEdit = canUserPerformAction(user?.role, 'SUIVI_EDIT');

  // ==================== ACCESS CONTROL ====================
  useEffect(() => {
    if (!PAGE_PERMISSIONS.SUIVIMANAGE.includes(user?.role)) {
      navigate('/');
      return;
    }

    // ✅ Additional check: if editing, user must have edit permission
    if (editPlate && !canEdit) {
      navigate('/suivi/list');
      return;
    }

    // ✅ Additional check: if adding, user must have add permission
    if (!editPlate && !canAdd) {
      navigate('/suivi/list');
      return;
    }
  }, [user, navigate, editPlate, canAdd, canEdit]);

  // ==================== LOAD INITIAL DATA ====================
  useEffect(() => {
    loadInitialData();
  }, [editPlate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load machinery types from MachineryTypes sheet
      const types = await fetchMachineryTypes();
      setMachineryTypes(types || []);

      // If in edit mode, load existing data
      if (editPlate) {
        const suiviData = await fetchSuivi();
        const existingIndex = suiviData.findIndex(item => item['Plate Number'] === editPlate);
        
        if (existingIndex !== -1) {
          const existing = suiviData[existingIndex];
          setExistingData(existing);
          
          // Load main machinery data
          setFormData({
            Status: existing.Status || '',
            Machinery: existing.Machinery || '',
            'Model / Type': existing['Model / Type'] || '',
            'Plate Number': existing['Plate Number'] || '',
            'Driver 1': existing['Driver 1'] || '',
            'Driver 2': existing['Driver 2'] || '',
            Insurance: existing.Insurance || '',
            'Technical Inspection': existing['Technical Inspection'] || '',
            Certificate: existing.Certificate || '',
            'Inspection Date': existing['Inspection Date'] || '',
            'Next Inspection': existing['Next Inspection'] || '',
          });

          // Check if certificate is NA
          if (existing.Certificate === 'N/A') {
            setCertificateNA(true);
          }

          // ✅ NEW: Check if next row is a trailer
          const nextRow = suiviData[existingIndex + 1];
          if (nextRow && nextRow.Machinery === 'Trailer') {
            setHasTrailer(true);
            setTrailerData({
              'Trailer Model/Type': nextRow['Model / Type'] || '',
              'Trailer Plate': nextRow['Plate Number'] || '',
              'Trailer Insurance': nextRow.Insurance || '',
              'Trailer Technical': nextRow['Technical Inspection'] || '',
              'Trailer Certificate': nextRow.Certificate || '',
            });

            // ✅ FIXED: Store trailer document URL
            setExistingTrailerUrl(nextRow.Documents || '');

            // Check trailer certificate NA
            if (nextRow.Certificate === 'N/A') {
              setTrailerCertificateNA(true);
            }
          }
        } else {
          alert(t('suivi.manage.alerts.error') + ': Machinery not found');
          navigate('/suivi/list');
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      alert(t('suivi.manage.alerts.networkError'));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get display name based on language
  const getMachineryDisplayName = (type) => {
    if (i18n.language === 'ar' && type.arabic) {
      return type.arabic;
    }
    return type.english;
  };

  // ==================== HANDLERS ====================
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ NEW: Trailer data handler
  const handleTrailerInputChange = (field, value) => {
    setTrailerData(prev => ({ ...prev, [field]: value }));
  };

  const handlePDFUpload = (field, file) => {
    if (!file) {
      setPdfFiles(prev => ({ ...prev, [field]: null }));
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert(t('suivi.manage.alerts.invalidFile'));
      return;
    }

    // Validate file size (10MB max)
    if (!validatePDFSize(file)) {
      alert(t('suivi.manage.alerts.pdfTooLarge'));
      return;
    }

    setPdfFiles(prev => ({ ...prev, [field]: file }));
  };

  // ✅ NEW: Trailer PDF upload handler
  const handleTrailerPDFUpload = (file) => {
    if (!file) {
      setTrailerPdfFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      alert(t('suivi.manage.alerts.invalidFile'));
      return;
    }

    if (!validatePDFSize(file)) {
      alert(t('suivi.manage.alerts.pdfTooLarge'));
      return;
    }

    setTrailerPdfFile(file);
  };

  const handleRemoveFile = (field) => {
    setPdfFiles(prev => ({ ...prev, [field]: null }));
  };

  // ✅ NEW: Remove trailer PDF
  const handleRemoveTrailerFile = () => {
    setTrailerPdfFile(null);
  };

  const handleCertificateNAChange = (checked) => {
    setCertificateNA(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, Certificate: 'N/A' }));
    } else {
      setFormData(prev => ({ ...prev, Certificate: '' }));
    }
  };

  // ✅ NEW: Trailer certificate NA handler
  const handleTrailerCertificateNAChange = (checked) => {
    setTrailerCertificateNA(checked);
    if (checked) {
      setTrailerData(prev => ({ ...prev, 'Trailer Certificate': 'N/A' }));
    } else {
      setTrailerData(prev => ({ ...prev, 'Trailer Certificate': '' }));
    }
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Check permissions before submitting
    if (editPlate && !canEdit) {
      alert(t("requests.grease.menu.accessDenied.message"));
      return;
    }

    if (!editPlate && !canAdd) {
      alert(t("requests.grease.menu.accessDenied.message"));
      return;
    }

    // Validation
    if (!formData.Status || !formData.Machinery || !formData['Model / Type'] || !formData['Plate Number']) {
      alert(t('suivi.manage.alerts.missingFields'));
      return;
    }

    // ✅ NEW: Trailer validation
    if (hasTrailer) {
      if (!trailerData['Trailer Model/Type'] || !trailerData['Trailer Plate']) {
        alert(t('suivi.manage.alerts.missingTrailerFields') || 'Please fill in Trailer Model/Type and Plate Number');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Convert PDFs to Base64
      const payload = { ...formData };

      // ✅ NEW: Add trailer data to payload if enabled
      if (hasTrailer) {
        payload.HasTrailer = true;
        payload['Trailer Model/Type'] = trailerData['Trailer Model/Type'];
        payload['Trailer Plate'] = trailerData['Trailer Plate'];
        payload['Trailer Insurance'] = trailerData['Trailer Insurance'];
        payload['Trailer Technical'] = trailerData['Trailer Technical'];
        payload['Trailer Certificate'] = trailerData['Trailer Certificate'];
      } else {
        payload.HasTrailer = false;
      }

      // Convert main machinery PDFs
      for (const [key, file] of Object.entries(pdfFiles)) {
        if (file) {
          const base64 = await pdfToBase64(file);
          payload[key] = base64;
        } else if (editPlate && existingData && existingData[key]) {
          // Keep existing PDF link if not replacing
          payload[key] = existingData[key];
        } else {
          payload[key] = '';
        }
      }

      // ✅ NEW: Convert trailer PDF
      if (hasTrailer) {
        if (trailerPdfFile) {
          const base64 = await pdfToBase64(trailerPdfFile);
          payload['Trailer Documents'] = base64;
        } else if (editPlate && existingTrailerUrl) {
          // Keep existing trailer PDF if not replacing
          payload['Trailer Documents'] = existingTrailerUrl;
        } else {
          payload['Trailer Documents'] = '';
        }
      }

      let result;
      if (editPlate && existingData) {
        // Edit mode - update existing entry
        result = await updateSuiviEntry(existingData.rowindex || 2, payload);
      } else {
        // Add mode - create new entry
        result = await addSuiviEntry(payload);
      }

      if (result.status === 'success') {
        alert(editPlate ? t('suivi.manage.alerts.editSuccess') : t('suivi.manage.alerts.addSuccess'));
        
        // Force cache refresh and add delay before navigation
        await cache.forceRefreshEquipment?.();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        navigate('/suivi/list');
      } else {
        alert(t('suivi.manage.alerts.error') + ': ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t('suivi.manage.alerts.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Custom File Upload Component
  const FileUploadField = ({ field, label, existingUrl }) => {
    const fileInputRef = React.useRef(null);

    return (
      <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          {label}
          {field.includes('Driver') && formData[field.replace(' Doc', '')] && (
            <span className="text-gray-500 ml-2">({formData[field.replace(' Doc', '')]})</span>
          )}
        </label>
        
        <div className="space-y-3">
          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handlePDFUpload(field, e.target.files[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Upload size={16} />
              {t('suivi.manage.form.chooseFile')}
            </button>
          </div>

          {/* File info with fixed max width */}
          {pdfFiles[field] ? (
            <div className="w-full">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 max-w-full">
                <FileText size={16} className="text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-400 truncate">{pdfFiles[field].name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(field)}
                  className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                  title={t('common.delete')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : editPlate && existingUrl && existingUrl !== 'N/A' ? (
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 hover:underline text-sm transition-colors"
            >
              <FileText size={16} />
              {t('suivi.manage.form.viewPDF')}
            </a>
          ) : (
            <span className="text-sm text-gray-500">{t('suivi.manage.form.noFileChosen')}</span>
          )}
        </div>
      </div>
    );
  };

  // ✅ NEW: Trailer File Upload Component
  const TrailerFileUploadField = ({ existingUrl }) => {
    const fileInputRef = React.useRef(null);

    return (
      <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          {t('suivi.manage.form.trailerDocuments') || 'Trailer Documents'}
        </label>
        
        <div className="space-y-3">
          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleTrailerPDFUpload(e.target.files[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Upload size={16} />
              {t('suivi.manage.form.chooseFile')}
            </button>
          </div>

          {/* File info - ✅ FIXED: Added wrapper and changed max-w-md to max-w-full */}
          {trailerPdfFile ? (
            <div className="w-full">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 max-w-full">
                <FileText size={16} className="text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-400 truncate">{trailerPdfFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveTrailerFile}
                  className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                  title={t('common.delete')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : editPlate && existingUrl && existingUrl !== 'N/A' ? (
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 hover:underline text-sm transition-colors"
            >
              <FileText size={16} />
              {t('suivi.manage.form.viewPDF')}
            </a>
          ) : (
            <span className="text-sm text-gray-500">{t('suivi.manage.form.noFileChosen')}</span>
          )}
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
        <Navbar user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-pink-400 mx-auto mb-4" />
            <p className="text-gray-300">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      
      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>{t('common.back')}</span>
        </button>

        {/* Title Section */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-600 to-rose-500 shadow-lg shadow-pink-500/40">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">
              {editPlate ? t('suivi.manage.form.editTitle') : t('suivi.manage.form.title')}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{t('suivi.manage.subtitle')}</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* BASIC INFORMATION */}
            <div>
              <h2 className="text-xl font-semibold text-pink-400 mb-4 flex items-center gap-2">
                <CheckCircle size={20} />
                {t('suivi.manage.form.basicInfo')}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.status')} *
                  </label>
                  <select
                    value={formData.Status}
                    onChange={(e) => handleInputChange('Status', e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                    required
                  >
                    <option value="">{t('suivi.manage.placeholders.selectStatus')}</option>
                    <option value="Permanent">{t('suivi.status.permanent')}</option>
                    <option value="Call-Off">{t('suivi.status.callOff')}</option>
                  </select>
                </div>

                {/* Machinery Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.machinery')} *
                  </label>
                  <select
                    value={formData.Machinery}
                    onChange={(e) => handleInputChange('Machinery', e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                    required
                  >
                    <option value="">{t('suivi.manage.placeholders.selectMachinery')}</option>
                    {machineryTypes.map(type => (
                      <option key={type.english} value={type.english}>
                        {getMachineryDisplayName(type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model / Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.modelType')} *
                  </label>
                  <input
                    type="text"
                    value={formData['Model / Type']}
                    onChange={(e) => handleInputChange('Model / Type', e.target.value)}
                    placeholder={t('suivi.manage.placeholders.modelType')}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                    required
                  />
                </div>

                {/* Plate Number - ✅ FIXED: Removed disabled={editPlate} */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.plateNumber')} *
                  </label>
                  <input
                    type="text"
                    value={formData['Plate Number']}
                    onChange={(e) => handleInputChange('Plate Number', e.target.value)}
                    placeholder={t('suivi.manage.placeholders.plateNumber')}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                    required
                  />
                </div>

                {/* Driver 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.driver1')}
                  </label>
                  <input
                    type="text"
                    value={formData['Driver 1']}
                    onChange={(e) => handleInputChange('Driver 1', e.target.value)}
                    placeholder={t('suivi.manage.placeholders.selectDriver')}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>

                {/* Driver 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.driver2')}
                  </label>
                  <input
                    type="text"
                    value={formData['Driver 2']}
                    onChange={(e) => handleInputChange('Driver 2', e.target.value)}
                    placeholder={t('suivi.manage.placeholders.selectDriver')}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DOCUMENT EXPIRY DATES */}
            <div>
              <h2 className="text-xl font-semibold text-pink-400 mb-4 flex items-center gap-2">
                <FileText size={20} />
                {t('suivi.manage.form.inspectionDates')}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Insurance */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.insurance')}
                  </label>
                  <input
                    type="date"
                    value={formData.Insurance}
                    onChange={(e) => handleInputChange('Insurance', e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>

                {/* Technical Inspection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.technical')}
                  </label>
                  <input
                    type="date"
                    value={formData['Technical Inspection']}
                    onChange={(e) => handleInputChange('Technical Inspection', e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>

                {/* Certificate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.certificate')}
                  </label>
                  <input
                    type="date"
                    value={certificateNA ? '' : formData.Certificate}
                    onChange={(e) => handleInputChange('Certificate', e.target.value)}
                    disabled={certificateNA}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={certificateNA}
                        onChange={(e) => handleCertificateNAChange(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-gray-600 rounded focus:ring-pink-500 bg-gray-900"
                      />
                      <span className="text-sm text-gray-400">{t('suivi.manage.form.certificateNA')}</span>
                    </label>
                  </div>
                </div>

                {/* Inspection Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.inspectionDate')}
                  </label>
                  <input
                    type="date"
                    value={formData['Inspection Date']}
                    onChange={(e) => handleInputChange('Inspection Date', e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>

                {/* Next Inspection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.nextInspection')}
                  </label>
                  <input
                    type="date"
                    value={formData['Next Inspection']}
                    onChange={(e) => handleInputChange('Next Inspection', e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DOCUMENT UPLOADS */}
            <div>
              <h2 className="text-xl font-semibold text-pink-400 mb-4 flex items-center gap-2">
                <Upload size={20} />
                {t('suivi.manage.form.driverDocuments')}
              </h2>
              
              <div className="space-y-6">
                <FileUploadField 
                  field="Documents" 
                  label={t('suivi.manage.form.machineryDocuments')}
                  existingUrl={existingData?.Documents}
                />
                <FileUploadField 
                  field="Driver 1 Doc" 
                  label={t('suivi.manage.form.driver1Documents')}
                  existingUrl={existingData?.['Driver 1 Doc']}
                />
                <FileUploadField 
                  field="Driver 2 Doc" 
                  label={t('suivi.manage.form.driver2Documents')}
                  existingUrl={existingData?.['Driver 2 Doc']}
                />
              </div>
            </div>

            {/* ✅ NEW: TRAILER SECTION */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-pink-400 flex items-center gap-2">
                  <Truck size={20} />
                  {t('suivi.manage.form.trailerInfo') || 'Trailer Information'}
                </h2>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-sm text-gray-300">{t('suivi.manage.form.hasTrailer') || 'Has Trailer'}</span>
                  <input
                    type="checkbox"
                    checked={hasTrailer}
                    onChange={(e) => setHasTrailer(e.target.checked)}
                    className="w-5 h-5 text-pink-600 border-gray-600 rounded focus:ring-pink-500 bg-gray-900"
                  />
                </label>
              </div>

              {hasTrailer && (
                <div className="space-y-6 bg-gray-900/30 rounded-xl p-6 border border-gray-700">
                  {/* Trailer Basic Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('suivi.manage.form.trailerModel') || 'Trailer Model/Type'} *
                      </label>
                      <input
                        type="text"
                        value={trailerData['Trailer Model/Type']}
                        onChange={(e) => handleTrailerInputChange('Trailer Model/Type', e.target.value)}
                        placeholder={t('suivi.manage.placeholders.trailerModel') || 'Enter trailer model'}
                        className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        required={hasTrailer}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('suivi.manage.form.trailerPlate') || 'Trailer Plate Number'} *
                      </label>
                      <input
                        type="text"
                        value={trailerData['Trailer Plate']}
                        onChange={(e) => handleTrailerInputChange('Trailer Plate', e.target.value)}
                        placeholder={t('suivi.manage.placeholders.trailerPlate') || 'Enter trailer plate'}
                        className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        required={hasTrailer}
                      />
                    </div>
                  </div>

                  {/* Trailer Document Dates */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('suivi.manage.form.trailerInsurance') || 'Trailer Insurance Expiry'}
                      </label>
                      <input
                        type="date"
                        value={trailerData['Trailer Insurance']}
                        onChange={(e) => handleTrailerInputChange('Trailer Insurance', e.target.value)}
                        className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('suivi.manage.form.trailerTechnical') || 'Trailer Technical Inspection'}
                      </label>
                      <input
                        type="date"
                        value={trailerData['Trailer Technical']}
                        onChange={(e) => handleTrailerInputChange('Trailer Technical', e.target.value)}
                        className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('suivi.manage.form.trailerCertificate') || 'Trailer Certificate'}
                      </label>
                      <input
                        type="date"
                        value={trailerCertificateNA ? '' : trailerData['Trailer Certificate']}
                        onChange={(e) => handleTrailerInputChange('Trailer Certificate', e.target.value)}
                        disabled={trailerCertificateNA}
                        className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={trailerCertificateNA}
                            onChange={(e) => handleTrailerCertificateNAChange(e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-600 rounded focus:ring-pink-500 bg-gray-900"
                          />
                          <span className="text-sm text-gray-400">{t('suivi.manage.form.certificateNA')}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Trailer Document Upload - ✅ FIXED: Changed existingUrl from null to existingTrailerUrl */}
                  <TrailerFileUploadField existingUrl={existingTrailerUrl} />
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                disabled={submitting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-xl transition-all shadow-lg shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editPlate ? t('suivi.manage.form.saving') : t('suivi.manage.form.adding')}
                  </>
                ) : (
                  <>
                    {editPlate ? <Save size={18} /> : <Plus size={18} />}
                    {editPlate ? t('suivi.manage.form.save') : t('suivi.manage.form.add')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuiviManage;
