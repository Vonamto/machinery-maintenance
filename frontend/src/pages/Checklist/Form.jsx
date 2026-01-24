// frontend/src/pages/Checklist/Form.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Camera, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";
import { getChecklistTemplate } from "@/config/checklistTemplates";

export default function ChecklistForm() {
  const { user } = useAuth();
  const { equipment } = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split('T')[0],
    "Full Name": user?.full_name || "",
    Role: user?.role || "",
    "Model / Type": "",
    "Plate Number": "",
    "Equipment Type": "",
    "Checklist Data": ""
  });
  
  const [checklistData, setChecklistData] = useState({});
  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Filter equipment based on user role
  useEffect(() => {
    if (user?.role === "Driver") {
      // Driver can only see their assigned equipment
      const driverEquipment = equipment.filter(eq => 
        eq["Driver 1"] === user.full_name || eq["Driver 2"] === user.full_name
      );
      setModelOptions([...new Set(driverEquipment.map(eq => eq["Model / Type"]))]);
      setPlateOptions(driverEquipment.map(eq => eq["Plate Number"]));
    } else {
      // Supervisor/Mechanic can see all equipment
      setModelOptions([...new Set(equipment.map(eq => eq["Model / Type"]))]);
      setPlateOptions(equipment.map(eq => eq["Plate Number"]));
    }
    setLoading(false);
  }, [equipment, user]);

  // Update equipment type when model/plate changes
  useEffect(() => {
    if (formData["Plate Number"]) {
      const foundEquipment = equipment.find(eq => eq["Plate Number"] === formData["Plate Number"]);
      if (foundEquipment) {
        const equipType = foundEquipment["Equipment Type"] || foundEquipment["Model / Type"];
        setFormData(prev => ({
          ...prev,
          "Model / Type": foundEquipment["Model / Type"],
          "Equipment Type": equipType,
        }));
        setSelectedEquipment(foundEquipment);
      }
    }
  }, [formData["Plate Number"], equipment]);

  // Update plate options when model changes
  useEffect(() => {
    if (formData["Model / Type"]) {
      let filteredEquipment;
      if (user?.role === "Driver") {
        filteredEquipment = equipment.filter(eq => 
          (eq["Model / Type"] === formData["Model / Type"]) &&
          (eq["Driver 1"] === user.full_name || eq["Driver 2"] === user.full_name)
        );
      } else {
        filteredEquipment = equipment.filter(eq => eq["Model / Type"] === formData["Model / Type"]);
      }
      setPlateOptions(filteredEquipment.map(eq => eq["Plate Number"]));
      
      // Reset plate number if it's no longer valid
      if (!filteredEquipment.some(eq => eq["Plate Number"] === formData["Plate Number"])) {
        setFormData(prev => ({ ...prev, "Plate Number": "" }));
      }
    }
  }, [formData["Model / Type"], equipment, user]);

  // Initialize checklist data when equipment type changes
  useEffect(() => {
    if (formData["Equipment Type"]) {
      const template = getChecklistTemplate(formData["Equipment Type"]);
      const initialData = {};
      
      template.forEach(section => {
        section.items.forEach(item => {
          initialData[item.id] = {
            status: null,
            comment: "",
            photo: ""
          };
        });
      });
      
      setChecklistData(initialData);
    }
  }, [formData["Equipment Type"]]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemStatusChange = (itemId, status) => {
    setChecklistData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status: status,
        comment: status !== "OK" ? prev[itemId]?.comment || "" : ""
      }
    }));
  };

  const handleCommentChange = (itemId, comment) => {
    setChecklistData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        comment: comment
      }
    }));
  };

  const handlePhotoUpload = async (itemId, file) => {
    // In a real implementation, you would upload to Cloudinary here
    // For now, we'll store the file object temporarily
    setChecklistData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photo: URL.createObjectURL(file)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare checklist data as JSON string
      const checklistJson = JSON.stringify(checklistData);
      
      const submitData = {
        ...formData,
        "Checklist Data": checklistJson,
        Timestamp: new Date().toISOString()
      };

      const response = await fetchWithAuth('/api/Checklist_Log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        alert(t("checklist.form.successMessage"));
        navigate('/checklist/history');
      } else {
        alert(t("checklist.form.errorMessage"));
      }
    } catch (error) {
      console.error('Error submitting checklist:', error);
      alert(t("checklist.form.errorMessage"));
    } finally {
      setSubmitting(false);
    }
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

  // For drivers, pre-populate based on their assigned equipment
  if (user?.role === "Driver" && !formData["Plate Number"] && equipment.length > 0) {
    const driverEquipment = equipment.filter(eq => 
      eq["Driver 1"] === user.full_name || eq["Driver 2"] === user.full_name
    );
    
    if (driverEquipment.length > 0 && !formData["Plate Number"]) {
      const firstEq = driverEquipment[0];
      setFormData(prev => ({
        ...prev,
        "Model / Type": firstEq["Model / Type"],
        "Plate Number": firstEq["Plate Number"],
        "Equipment Type": firstEq["Equipment Type"] || firstEq["Model / Type"]
      }));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />
      <div className="max-w-6xl mx-auto p-6">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t("checklist.form.back")}
        </button>

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/40">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
              {t("checklist.form.title")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {t("checklist.form.subtitle")}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-6 text-cyan-400">
              {t("checklist.form.basicInfo")}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.date")}
                </label>
                <input
                  type="date"
                  value={formData.Date}
                  onChange={(e) => handleInputChange("Date", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.fullName")}
                </label>
                <input
                  type="text"
                  value={formData["Full Name"]}
                  readOnly
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.modelType")}
                </label>
                <select
                  value={formData["Model / Type"]}
                  onChange={(e) => handleInputChange("Model / Type", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  disabled={user?.role === "Driver"}
                >
                  <option value="">{t("checklist.form.selectModel")}</option>
                  {modelOptions.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.plateNumber")}
                </label>
                <select
                  value={formData["Plate Number"]}
                  onChange={(e) => handleInputChange("Plate Number", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  disabled={user?.role === "Driver"}
                >
                  <option value="">{t("checklist.form.selectPlate")}</option>
                  {plateOptions.map(plate => (
                    <option key={plate} value={plate}>{plate}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.equipmentType")}
                </label>
                <input
                  type="text"
                  value={formData["Equipment Type"]}
                  readOnly
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.role")}
                </label>
                <input
                  type="text"
                  value={t(`roles.${user?.role}`)}
                  readOnly
                  className="w-full p-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          {formData["Equipment Type"] && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 space-y-6">
              <h2 className="text-xl font-semibold mb-6 text-emerald-400">
                {t("checklist.form.checklist")}
              </h2>
              
              {getChecklistTemplate(formData["Equipment Type"]).map((section, sectionIndex) => (
                <div key={section.section} className="border border-gray-700 rounded-xl p-4">
                  <h3 className="text-lg font-medium mb-4 text-cyan-300">
                    {t(`checklist.sections.${section.section}.${section.title}`)}
                  </h3>
                  
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div key={item.id} className="p-4 bg-gray-900/30 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-200">
                            {t(`checklist.items.${item.id}.${item.label}`)}
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleItemStatusChange(item.id, "OK")}
                              className={`p-2 rounded-lg transition ${
                                checklistData[item.id]?.status === "OK"
                                  ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-400"
                              }`}
                              title={t("checklist.status.ok")}
                            >
                              <CheckCircle size={20} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleItemStatusChange(item.id, "Warning")}
                              className={`p-2 rounded-lg transition ${
                                checklistData[item.id]?.status === "Warning"
                                  ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-400"
                              }`}
                              title={t("checklist.status.warning")}
                            >
                              <AlertTriangle size={20} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleItemStatusChange(item.id, "Fail")}
                              className={`p-2 rounded-lg transition ${
                                checklistData[item.id]?.status === "Fail"
                                  ? "bg-red-500/20 border border-red-500 text-red-400"
                                  : "bg-gray-700/50 hover:bg-gray-700 text-gray-400"
                              }`}
                              title={t("checklist.status.fail")}
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        </div>
                        
                        {(checklistData[item.id]?.status === "Warning" || checklistData[item.id]?.status === "Fail") && (
                          <>
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("checklist.form.comment")}
                              </label>
                              <textarea
                                value={checklistData[item.id]?.comment || ""}
                                onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                rows="2"
                                placeholder={t("checklist.form.commentPlaceholder")}
                              />
                            </div>
                            
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                {t("checklist.form.photo")}
                              </label>
                              <div className="flex gap-2">
                                <label className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg cursor-pointer transition">
                                  <Camera size={18} />
                                  <span>{t("checklist.form.uploadPhoto")}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files[0] && handlePhotoUpload(item.id, e.target.files[0])}
                                    className="hidden"
                                  />
                                </label>
                                {checklistData[item.id]?.photo && (
                                  <img 
                                    src={checklistData[item.id].photo} 
                                    alt="Preview" 
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                                  />
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={submitting || !formData["Equipment Type"]}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t("common.submitting") : t("common.submit")}
            </button>
            
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
