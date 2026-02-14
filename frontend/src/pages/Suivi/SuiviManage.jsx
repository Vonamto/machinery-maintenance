// src/pages/Suivi/SuiviManage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaArrowLeft, 
  FaUpload, 
  FaFilePdf, 
  FaCheckCircle,
  FaSave,
  FaPlus 
} from 'react-icons/fa';
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const cache = useCache();
  const [searchParams] = useSearchParams();
  const editPlate = searchParams.get('edit'); // Edit mode: /suivi/manage?edit=AB-123

  // ==================== STATE ====================
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [machineryTypes, setMachineryTypes] = useState([]);
  const [existingData, setExistingData] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    Status: '',
    Machinery: '',
    'Model Type': '',
    'Plate Number': '',
    'Driver 1': '',
    'Driver 2': '',
    Insurance: '',
    'Technical Inspection': '',
    Certificate: '',
    'Inspection Date': '',
    'Next Inspection': '',
  });

  // PDF files state (stores File objects)
  const [pdfFiles, setPdfFiles] = useState({
    Documents: null,
    'Driver 1 Doc': null,
    'Driver 2 Doc': null,
  });

  // Certificate NA checkbox
  const [certificateNA, setCertificateNA] = useState(false);

  // Dropdowns from Equipment_List
  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [driver1Options, setDriver1Options] = useState([]);
  const [driver2Options, setDriver2Options] = useState([]);

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

      // Load Equipment_List for dropdowns
      await cache.forceRefreshEquipment?.();
      const equipment = cache.getEquipment || [];
      
      // Get unique models
      const models = [...new Set(equipment.map(e => e['Model Type']).filter(Boolean))];
      setModelOptions(models.sort());

      // If in edit mode, load existing data
      if (editPlate) {
        const suiviData = await fetchSuivi();
        const existing = suiviData.find(item => item['Plate Number'] === editPlate);
        
        if (existing) {
          setExistingData(existing);
          setFormData({
            Status: existing.Status || '',
            Machinery: existing.Machinery || '',
            'Model Type': existing['Model Type'] || '',
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

          // Pre-populate dropdowns based on existing data
          const matchingEquipment = equipment.filter(
            e => e['Model Type'] === existing['Model Type']
          );
          const plates = [...new Set(matchingEquipment.map(e => e['Plate Number']))];
          setPlateOptions(plates);

          const drivers1 = [...new Set(matchingEquipment.map(e => e['Driver 1']).filter(Boolean))];
          const drivers2 = [...new Set(matchingEquipment.map(e => e['Driver 2']).filter(Boolean))];
          setDriver1Options(drivers1);
          setDriver2Options(drivers2);
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

  // ==================== DYNAMIC DROPDOWNS ====================
  // When Model Type changes
  useEffect(() => {
    const model = formData['Model Type'];
    if (!model) {
      setPlateOptions([]);
      setDriver1Options([]);
      setDriver2Options([]);
      return;
    }

    const equipment = cache.getEquipment || [];
    const filtered = equipment.filter(e => e['Model Type'] === model);
    
    const plates = [...new Set(filtered.map(e => e['Plate Number']).filter(Boolean))];
    const drivers1 = [...new Set(filtered.map(e => e['Driver 1']).filter(Boolean))];
    const drivers2 = [...new Set(filtered.map(e => e['Driver 2']).filter(Boolean))];

    setPlateOptions(plates.sort());
    setDriver1Options(drivers1.sort());
    setDriver2Options(drivers2.sort());
  }, [formData['Model Type'], cache]);

  // When Plate Number changes
  useEffect(() => {
    const plate = formData['Plate Number'];
    if (!plate) return;

    const equipment = cache.getEquipment || [];
    const match = equipment.find(e => e['Plate Number'] === plate);

    if (match) {
      // Auto-fill model if not set
      if (!formData['Model Type']) {
        setFormData(prev => ({
          ...prev,
          'Model Type': match['Model Type'] || '',
        }));
      }

      // Update driver options
      const drivers = [match['Driver 1'], match['Driver 2']].filter(Boolean);
      setDriver1Options(drivers);
      setDriver2Options(drivers);
    }
  }, [formData['Plate Number'], cache]);

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
    if (!formData.Status || !formData.Machinery || !formData['Model Type'] || !formData['Plate Number']) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <button
          onClick={() => navigate('/suivi/list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>{t('suivi.manage.backButton')}</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {editPlate ? t('suivi.manage.form.editTitle') : t('suivi.manage.form.title')}
          </h1>
          <p className="text-gray-600 mb-8">{t('suivi.manage.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* BASIC INFORMATION */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-blue-600" />
                {t('suivi.manage.form.basicInfo')}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.status')} *
                  </label>
                  <select
                    value={formData.Status}
                    onChange={(e) => handleInputChange('Status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t('suivi.manage.placeholders.selectStatus')}</option>
                    <option value="Permanent">{t('suivi.status.permanent')}</option>
                    <option value="Call-Off">{t('suivi.status.callOff')}</option>
                  </select>
                </div>

                {/* Machinery Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.machinery')} *
                  </label>
                  <select
                    value={formData.Machinery}
                    onChange={(e) => handleInputChange('Machinery', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t('suivi.manage.placeholders.selectMachinery')}</option>
                    {machineryTypes.map(type => (
                      <option key={type.english} value={type.english}>
                        {type.english}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.modelType')} *
                  </label>
                  <select
                    value={formData['Model Type']}
                    onChange={(e) => handleInputChange('Model Type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">--- {t('equipment.manage.placeholderModel')} ---</option>
                    {modelOptions.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                {/* Plate Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.plateNumber')} *
                  </label>
                  <select
                    value={formData['Plate Number']}
                    onChange={(e) => handleInputChange('Plate Number', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={editPlate} // Can't change plate in edit mode
                  >
                    <option value="">{t('suivi.manage.placeholders.plateNumber')}</option>
                    {plateOptions.map(plate => (
                      <option key={plate} value={plate}>{plate}</option>
                    ))}
                  </select>
                </div>

                {/* Driver 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.driver1')}
                  </label>
                  <select
                    value={formData['Driver 1']}
                    onChange={(e) => handleInputChange('Driver 1', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('suivi.manage.placeholders.selectDriver')}</option>
                    {driver1Options.map(driver => (
                      <option key={driver} value={driver}>{driver}</option>
                    ))}
                  </select>
                </div>

                {/* Driver 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.driver2')}
                  </label>
                  <select
                    value={formData['Driver 2']}
                    onChange={(e) => handleInputChange('Driver 2', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('suivi.manage.placeholders.selectDriver')}</option>
                    {driver2Options.map(driver => (
                      <option key={driver} value={driver}>{driver}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* DOCUMENT EXPIRY DATES */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FaFilePdf className="text-red-600" />
                {t('suivi.manage.form.inspectionDates')}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Insurance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.insurance')}
                  </label>
                  <input
                    type="date"
                    value={formData.Insurance}
                    onChange={(e) => handleInputChange('Insurance', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Technical Inspection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.technical')}
                  </label>
                  <input
                    type="date"
                    value={formData['Technical Inspection']}
                    onChange={(e) => handleInputChange('Technical Inspection', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Certificate with NA option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.certificate')}
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={certificateNA}
                        onChange={(e) => handleCertificateNAChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">{t('suivi.manage.form.certificateNA')}</span>
                    </label>
                  </div>
                  <input
                    type="date"
                    value={certificateNA ? '' : formData.Certificate}
                    onChange={(e) => handleInputChange('Certificate', e.target.value)}
                    disabled={certificateNA}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Inspection Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.inspectionDate')}
                  </label>
                  <input
                    type="date"
                    value={formData['Inspection Date']}
                    onChange={(e) => handleInputChange('Inspection Date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Next Inspection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.nextInspection')}
                  </label>
                  <input
                    type="date"
                    value={formData['Next Inspection']}
                    onChange={(e) => handleInputChange('Next Inspection', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* DOCUMENT UPLOADS */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FaUpload className="text-green-600" />
                {t('suivi.manage.form.driverDocuments')}
              </h2>
              
              <div className="space-y-4">
                {/* Machinery Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.machineryDocuments')}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePDFUpload('Documents', e.target.files[0])}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {pdfFiles.Documents && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <FaCheckCircle /> {pdfFiles.Documents.name}
                      </span>
                    )}
                    {editPlate && existingData?.Documents && !pdfFiles.Documents && (
                      <a
                        href={existingData.Documents}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FaFilePdf /> {t('suivi.manage.form.viewPDF')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Driver 1 Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.driver1Documents')}
                    {formData['Driver 1'] && <span className="text-gray-500 ml-2">({formData['Driver 1']})</span>}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePDFUpload('Driver 1 Doc', e.target.files[0])}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {pdfFiles['Driver 1 Doc'] && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <FaCheckCircle /> {pdfFiles['Driver 1 Doc'].name}
                      </span>
                    )}
                    {editPlate && existingData?.['Driver 1 Doc'] && !pdfFiles['Driver 1 Doc'] && (
                      <a
                        href={existingData['Driver 1 Doc']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FaFilePdf /> {t('suivi.manage.form.viewPDF')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Driver 2 Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('suivi.manage.form.driver2Documents')}
                    {formData['Driver 2'] && <span className="text-gray-500 ml-2">({formData['Driver 2']})</span>}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handlePDFUpload('Driver 2 Doc', e.target.files[0])}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {pdfFiles['Driver 2 Doc'] && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <FaCheckCircle /> {pdfFiles['Driver 2 Doc'].name}
                      </span>
                    )}
                    {editPlate && existingData?.['Driver 2 Doc'] && !pdfFiles['Driver 2 Doc'] && (
                      <a
                        href={existingData['Driver 2 Doc']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FaFilePdf /> {t('suivi.manage.form.viewPDF')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/suivi/list')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editPlate ? t('suivi.manage.form.saving') : t('suivi.manage.form.adding')}
                  </>
                ) : (
                  <>
                    {editPlate ? <FaSave /> : <FaPlus />}
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
