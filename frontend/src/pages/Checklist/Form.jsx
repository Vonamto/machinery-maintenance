// frontend/src/pages/Checklist/Form.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Camera } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { fetchWithAuth } from "@/api/api";
import { useTranslation } from "react-i18next";

export default function ChecklistForm() {
  const { user } = useAuth();
  const { equipment } = useCache();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split('T')[0],
    "Full Name": user?.full_name || "",
    "Model / Type": "",
    "Plate Number": "",
    "Equipment Type": "",
    "Checklist Data": ""
  });
  
  // Detailed checklist data structure based on equipment type
  const [checklistData, setChecklistData] = useState({});
  const [modelOptions, setModelOptions] = useState([]);
  const [plateOptions, setPlateOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Initialize checklist templates based on equipment type
  const getChecklistTemplate = (equipmentType) => {
    const templates = {
      "Truck": {
        "General Inspection": [
          "Vehicle cleanliness",
          "Driver's seat",
          "Seat belt",
          "Windshield",
          "Horn",
          "Brakes",
          "Mirrors",
          "Reversing alarm"
        ],
        "Fluids Check": [
          "Fuel level",
          "Oil level",
          "Water Level",
          "No warning lights on"
        ],
        "Electrical": [
          "Headlights",
          "Tail lights",
          "Brake lights",
          "Turn signals",
          "Reverse lights"
        ],
        "Tires": [
          "Tire air pressure",
          "Condition of the tire rubber",
          "Spare tire condition"
        ],
        "Emergency Equipment": [
          "Hydraulic jack",
          "Fire extinguisher",
          "First aid kit",
          "Warning triangle"
        ]
      },
      "Forklift": {
        "General Inspection": [
          "Vehicle cleanliness",
          "Driver's seat",
          "Seat belt",
          "Windshield",
          "Horn",
          "Brakes",
          "Mirrors",
          "Reversing alarm"
        ],
        "Fluids Check": [
          "Fuel level",
          "Oil level",
          "Water Level",
          "No warning lights on"
        ],
        "Electrical": [
          "Headlights",
          "Tail lights",
          "Brake lights",
          "Turn signals",
          "Reverse lights"
        ],
        "Hydraulic System": [
          "Hydraulic cylinders",
          "Hydraulic hose",
          "Hydraulic fittings",
          "Hydraulic leaks"
        ],
        "Tires": [
          "Tire air pressure",
          "Condition of the tire rubber"
        ],
        "Emergency Equipment": [
          "Fire extinguisher",
          "First aid kit",
          "Warning triangle"
        ]
      },
      "Crane": {
        "General Inspection": [
          "Vehicle cleanliness",
          "Driver's seat",
          "Seat belt",
          "Windshield",
          "Horn",
          "Brakes",
          "Mirrors",
          "Reversing alarm"
        ],
        "Fluids Check": [
          "Fuel level",
          "Oil level",
          "Water Level",
          "No warning lights on"
        ],
        "Electrical": [
          "Headlights",
          "Tail lights",
          "Brake lights",
          "Turn signals",
          "Reverse lights"
        ],
        "Hydraulic System": [
          "Hydraulic cylinders",
          "Hydraulic hose",
          "Hydraulic fittings",
          "Hydraulic leaks"
        ],
        "Tires": [
          "Tire air pressure",
          "Condition of the tire rubber"
        ],
        "Lifting System": [
          "Lifting hook",
          "Anti-two block device for wire rope",
          "Lifting wire rope",
          "Boom, pins, bolting",
          "Sheaves"
        ],
        "Emergency Equipment": [
          "Fire extinguisher",
          "First aid kit",
          "Warning triangle"
        ]
      }
    };
    
    return templates[equipmentType] || {};
  };

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
      
      Object.entries(template).forEach(([section, items]) => {
        items.forEach(item => {
          const key = `${section}_${item}`.replace(/\s+/g, '_').toLowerCase();
          initialData[key] = {
            status: null,
            comment: "",
            photo: "" // Store base64 string or URL
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

  // Convert image to base64 for upload to Google Drive
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = async (itemId, file) => {
    try {
      const base64 = await convertToBase64(file);
      setChecklistData(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photo: base64 // Store base64 string for submission
        }
      }));
    } catch (error) {
      console.error('Error converting image to base64:', error);
      alert(t("checklist.form.alerts.photoError"));
    }
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
        Role: user?.role || "",
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
        alert(t("checklist.form.alerts.success"));
        navigate('/checklist');
      } else {
        const errorData = await response.json();
        alert(`${t("checklist.form.alerts.error")}: ${errorData.message || t("checklist.form.alerts.genericError")}`);
      }
    } catch (error) {
      console.error('Error submitting checklist:', error);
      alert(t("checklist.form.alerts.networkError"));
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
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 md:mb-6 transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t("common.back")}
        </button>

        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/40">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
              {t("checklist.form.title")}
            </h1>
            <p className="text-gray-400 text-sm md:text-base mt-1">
              {t("checklist.form.subtitle")}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-cyan-400">
              {t("checklist.form.basicInfo")}
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
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
                <select
                  value={formData["Full Name"]}
                  onChange={(e) => handleInputChange("Full Name", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value={user?.full_name}>{user?.full_name}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("checklist.form.modelType")}
                </label>
                <select
                  value={formData["Model / Type"]}
                  onChange={(e) => handleInputChange("Model / Type", e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-900/70 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
            </div>
          </div>

          {/* Checklist Items */}
          {formData["Equipment Type"] && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700 space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-emerald-400">
                {t("checklist.form.checklist")}
              </h2>
              
              {Object.entries(getChecklistTemplate(formData["Equipment Type"])).map(([section, items], sectionIndex) => (
                <div key={section} className="border border-gray-700 rounded-xl p-3 md:p-4">
                  <h3 className="text-base md:text-lg font-medium mb-3 md:mb-4 text-cyan-300">
                    {t(`checklist.sections.${section.replace(/\s+/g, '_').toLowerCase()}`) || section}
                  </h3>
                  
                  <div className="space-y-2 md:space-y-3">
                    {items.map((item, itemIndex) => {
                      const itemId = `${section}_${item}`.replace(/\s+/g, '_').toLowerCase();
                      
                      return (
                        <div key={itemId} className="p-3 bg-gray-900/30 rounded-lg border border-gray-700">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <span className="font-medium text-gray-200 text-sm md:text-base">
                              {t(`checklist.items.${itemId}`) || item}
                            </span>
                            
                            <div className="flex gap-1 sm:gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => handleItemStatusChange(itemId, "OK")}
                                className={`p-2 rounded-lg transition ${
                                  checklistData[itemId]?.status === "OK"
                                    ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                                    : "bg-gray-700/50 hover:bg-gray-700 text-gray-400"
                                }`}
                                title={t("checklist.status.ok")}
                              >
                                <CheckCircle size={16} className="sm:size-20" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleItemStatusChange(itemId, "Warning")}
                                className={`p-2 rounded-lg transition ${
                                  checklistData[itemId]?.status === "Warning"
                                    ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                                    : "bg-gray-700/50 hover:bg-gray-700 text-gray-400"
                                }`}
                                title={t("checklist.status.warning")}
                              >
                                <AlertTriangle size={16} className="sm:size-20" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleItemStatusChange(itemId, "Fail")}
                                className={`p-2 rounded-lg transition ${
                                  checklistData[itemId]?.status === "Fail"
                                    ? "bg-red-500/20 border border-red-500 text-red-400"
                                    : "bg-gray-700/50 hover:bg-gray-700 text-gray-400"
                                }`}
                                title={t("checklist.status.fail")}
                              >
                                <XCircle size={16} className="sm:size-20" />
                              </button>
                            </div>
                          </div>
                          
                          {(checklistData[itemId]?.status === "Warning" || checklistData[itemId]?.status === "Fail") && (
                            <>
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                  {t("checklist.form.comment")}
                                </label>
                                <textarea
                                  value={checklistData[itemId]?.comment || ""}
                                  onChange={(e) => handleCommentChange(itemId, e.target.value)}
                                  className="w-full p-2 rounded-lg bg-gray-900/70 border border-gray-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                                  rows="2"
                                  placeholder={t("checklist.form.commentPlaceholder")}
                                />
                              </div>
                              
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-400 mb-1">
                                  {t("checklist.form.photo")}
                                </label>
                                <div className="flex gap-2">
                                  <label className="flex items-center gap-1 px-3 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-lg cursor-pointer transition text-sm">
                                    <Camera size={14} />
                                    <span>{t("checklist.form.uploadPhoto")}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => e.target.files[0] && handlePhotoUpload(itemId, e.target.files[0])}
                                      className="hidden"
                                    />
                                  </label>
                                  {checklistData[itemId]?.photo && (
                                    <div className="relative">
                                      {checklistData[itemId].photo.startsWith('data:image') ? (
                                        <img 
                                          src={checklistData[itemId].photo} 
                                          alt="Preview" 
                                          className="w-12 h-12 object-cover rounded-lg border border-gray-600"
                                        />
                                      ) : (
                                        <img 
                                          src={checklistData[itemId].photo} 
                                          alt="Preview" 
                                          className="w-12 h-12 object-cover rounded-lg border border-gray-600"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 md:pt-6">
            <button
              type="submit"
              disabled={submitting || !formData["Equipment Type"]}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {submitting ? t("common.submitting") : t("common.submit")}
            </button>
            
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition flex-1"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
