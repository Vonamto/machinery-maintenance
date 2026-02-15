// src/pages/Suivi/SuiviManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, FileText, CheckCircle, Save, Plus, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useCache } from '../../context/CacheContext';
import { PAGE_PERMISSIONS } from '../../config/roles';
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

  // PDF files state
  const [pdfFiles, setPdfFiles] = useState({
    Documents: null,
    'Driver 1 Doc': null,
    'Driver 2 Doc': null,
  });

  // Certificate NA checkbox
  const [certificateNA, setCertificateNA] = useState(false);

  // ==================== ACCESS CONTROL ====================
  useEffect(() => {
    if (!PAGE_PERMISSIONS.SUIVIMANAGE.includes(user?.role)) {
      navigate('/');
    }
  }, [user, navigate]);

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
        const existing = suiviData.find(item => item['Plate Number'] === editPlate);
        
        if (existing) {
          setExistingData(existing);
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

  const handleCertificateNAChange = (checked) => {
    setCertificateNA(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, Certificate: 'N/A' }));
    } else {
      setFormData(prev => ({ ...prev, Certificate: '' }));
    }
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.Status || !formData.Machinery || !formData['Model / Type'] || !formData['Plate Number']) {
      alert(t('suivi.manage.alerts.missingFields'));
      return;
    }

    setSubmitting(true);

    try {
      // Convert PDFs to Base64
      const payload = { ...formData };

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
        
        // ✅ FIX: Force cache refresh and add delay before navigation
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
        {/* ✅ FIX 1: Back button now goes back instead of /suivi/list */}
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

                {/* Model / Type - FREE TEXT INPUT */}
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

                {/* Plate Number - FREE TEXT INPUT */}
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
                    disabled={editPlate}
                  />
                </div>

                {/* Driver 1 - FREE TEXT INPUT */}
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

                {/* Driver 2 - FREE TEXT INPUT */}
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

                {/* Certificate with NA option */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.certificate')}
                  </label>
                  <div className="flex items-center gap-4 mb-2">
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
                  <input
                    type="date"
                    value={certificateNA ? '' : formData.Certificate}
                    onChange={(e) => handleInputChange('Certificate', e.target.value)}
                    disabled={certificateNA}
                    className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  />
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
              
              <div className="space-y-4">
                {/* Machinery Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.machineryDocuments')}
                  </label>
                  {/* ✅ FIX 3: Mobile styling fix for PDF upload */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePDFUpload('Documents', e.target.files[0])}
                      className="flex-1 p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-600 file:text-white hover:file:bg-pink-700 transition-all text-sm"
                    />
                    {pdfFiles.Documents && (
                      <span className="text-sm text-green-400 flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle size={16} /> {pdfFiles.Documents.name}
                      </span>
                    )}
                    {editPlate && existingData?.Documents && !pdfFiles.Documents && (
                      <a
                        href={existingData.Documents}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                      >
                        <FileText size={16} /> {t('suivi.manage.form.viewPDF')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Driver 1 Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.driver1Documents')}
                    {formData['Driver 1'] && <span className="text-gray-500 ml-2">({formData['Driver 1']})</span>}
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePDFUpload('Driver 1 Doc', e.target.files[0])}
                      className="flex-1 p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-600 file:text-white hover:file:bg-pink-700 transition-all text-sm"
                    />
                    {pdfFiles['Driver 1 Doc'] && (
                      <span className="text-sm text-green-400 flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle size={16} /> {pdfFiles['Driver 1 Doc'].name}
                      </span>
                    )}
                    {editPlate && existingData?.['Driver 1 Doc'] && !pdfFiles['Driver 1 Doc'] && (
                      <a
                        href={existingData['Driver 1 Doc']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                      >
                        <FileText size={16} /> {t('suivi.manage.form.viewPDF')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Driver 2 Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('suivi.manage.form.driver2Documents')}
                    {formData['Driver 2'] && <span className="text-gray-500 ml-2">({formData['Driver 2']})</span>}
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePDFUpload('Driver 2 Doc', e.target.files[0])}
                      className="flex-1 p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-600 file:text-white hover:file:bg-pink-700 transition-all text-sm"
                    />
                    {pdfFiles['Driver 2 Doc'] && (
                      <span className="text-sm text-green-400 flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle size={16} /> {pdfFiles['Driver 2 Doc'].name}
                      </span>
                    )}
                    {editPlate && existingData?.['Driver 2 Doc'] && !pdfFiles['Driver 2 Doc'] && (
                      <a
                        href={existingData['Driver 2 Doc']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-400 hover:underline flex items-center gap-1 whitespace-nowrap"
                      >
                        <FileText size={16} /> {t('suivi.manage.form.viewPDF')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
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
