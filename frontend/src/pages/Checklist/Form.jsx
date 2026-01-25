import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save, ClipboardCheck, MessageSquare, Camera, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useCache } from "@/context/CacheContext";
import { getChecklistTemplate } from "@/config/checklistTemplates";
import { appendRow } from "@/api/api";
import { convertFileToBase64 } from "@/utils/imageUtils";

export default function ChecklistForm() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cache, refreshCache } = useCache();

    // UI State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        fullName: "",
        plateNumber: "",
        model: "",
        equipmentType: "",
        checklistData: {}
    });

    // Lists for Dropdowns
    const [drivers, setDrivers] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);
    const [filteredPlates, setFilteredPlates] = useState([]);

    // Initialize Page and Cache
    useEffect(() => {
        const initForm = async () => {
            setLoading(true);
            try {
                // Refresh cache to ensure data is fresh (like Maintenance Form)
                const freshEquipment = await refreshCache("Equipment_List");
                const freshUsers = await refreshCache("Users");
                
                setEquipmentList(freshEquipment);
                setDrivers(freshUsers.filter(u => u.Role === "Driver" || u.Role === "Supervisor" || u.Role === "Mechanic"));

                if (user.role === "Driver") {
                    // Auto-fill logic for Driver
                    const machine = freshEquipment.find(e => 
                        e["Driver 1"] === user.fullName || e["Driver 2"] === user.fullName
                    );
                    if (machine) {
                        setFormData(prev => ({
                            ...prev,
                            fullName: user.fullName,
                            plateNumber: machine["Plate Number"],
                            model: machine["Model / Type"],
                            equipmentType: machine["Equipment Type"] || "Truck"
                        }));
                    } else {
                        setFormData(prev => ({ ...prev, fullName: user.fullName }));
                    }
                }
            } catch (err) {
                setError("Failed to load form data");
            } finally {
                setLoading(false);
            }
        };
        initForm();
    }, []);

    // Logic for Linked Dropdowns (Supervisor/Mechanic)
    useEffect(() => {
        if (user.role !== "Driver") {
            let filtered = equipmentList;
            if (formData.fullName) {
                filtered = equipmentList.filter(e => 
                    e["Driver 1"] === formData.fullName || e["Driver 2"] === formData.fullName
                );
            }
            setFilteredPlates(filtered);
        }
    }, [formData.fullName, equipmentList]);

    const handlePlateChange = (plate) => {
        const machine = equipmentList.find(e => e["Plate Number"] === plate);
        if (machine) {
            setFormData(prev => ({
                ...prev,
                plateNumber: plate,
                model: machine["Model / Type"],
                equipmentType: machine["Equipment Type"] || "Truck",
                checklistData: {} // Reset checklist if machine changes
            }));
        }
    };

    // Checklist Item Updates
    const updateChecklistItem = (section, item, field, value) => {
        setFormData(prev => ({
            ...prev,
            checklistData: {
                ...prev.checklistData,
                [`${section}.${item}`]: {
                    ...prev.checklistData[`${section}.${item}`],
                    [field]: value
                }
            }
        }));
    };

    const handlePhotoUpload = async (section, item, file) => {
        if (!file) return;
        const base64 = await convertFileToBase64(file);
        updateChecklistItem(section, item, "photo", base64);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.plateNumber) return alert(t("form.alerts.missingAsset"));
        
        setSubmitting(true);
        try {
            const row = {
                "Timestamp": new Date().toISOString(),
                "Date": new Date().toISOString().split('T')[0],
                "Full Name": formData.fullName,
                "Role": user.role,
                "Model": formData.model,
                "Plate Number": formData.plateNumber,
                "Equipment Type": formData.equipmentType,
                "Checklist Data": JSON.stringify(formData.checklistData)
            };

            await appendRow("Checklist_Log", row);
            alert(t("checklist.form.success") || "Checklist submitted successfully!");
            navigate("/checklist/history");
        } catch (err) {
            alert(t("form.alerts.error"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                <p className="text-lg font-medium animate-pulse">{t("common.loading")}</p>
            </div>
        );
    }

    const template = getChecklistTemplate(formData.equipmentType);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-12" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <Navbar />
            
            <div className="max-w-4xl mx-auto px-4 pt-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    {t("common.back")}
                </button>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-cyan-500/20 rounded-2xl">
                            <ClipboardCheck className="text-cyan-400 w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{t("checklist.form.title")}</h1>
                            <p className="text-slate-400 text-sm">{t("checklist.form.subtitle")}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Header Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">{t("form.driver")}</label>
                                <select 
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    disabled={user.role === "Driver"}
                                >
                                    <option value="">{t("form.chooseDriver")}</option>
                                    {drivers.map(d => <option key={d.Name} value={d.Name}>{d.Name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">{t("form.plate")}</label>
                                <select 
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                                    value={formData.plateNumber}
                                    onChange={(e) => handlePlateChange(e.target.value)}
                                    disabled={user.role === "Driver"}
                                >
                                    <option value="">{t("form.choosePlate")}</option>
                                    {(user.role === "Driver" ? equipmentList : filteredPlates).map(e => (
                                        <option key={e["Plate Number"]} value={e["Plate Number"]}>{e["Plate Number"]}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">{t("form.model")}</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 opacity-70"
                                    value={formData.model}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Dynamic Checklist */}
                        {formData.equipmentType && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {template.sections.map((section) => (
                                    <div key={section.title} className="bg-slate-900/30 rounded-2xl p-6 border border-white/5">
                                        <h3 className="text-lg font-semibold text-cyan-400 mb-6 flex items-center gap-2">
                                            <div className="w-1 h-6 bg-cyan-500 rounded-full" />
                                            {t(`checklist.sections.${section.title}`)}
                                        </h3>
                                        
                                        <div className="space-y-6">
                                            {section.items.map((item) => {
                                                const itemKey = `${section.title}.${item}`;
                                                const currentStatus = formData.checklistData[itemKey]?.status;

                                                return (
                                                    <div key={item} className="flex flex-col gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-slate-200 font-medium">{t(`checklist.items.${item}`)}</span>
                                                            
                                                            <div className="flex items-center bg-slate-950/50 p-1 rounded-lg border border-slate-800">
                                                                {[
                                                                    { val: "OK", icon: "✅", color: "text-emerald-500" },
                                                                    { val: "Warning", icon: "⚠️", color: "text-amber-500" },
                                                                    { val: "Fail", icon: "❌", color: "text-rose-500" }
                                                                ].map((s) => (
                                                                    <button
                                                                        key={s.val}
                                                                        type="button"
                                                                        onClick={() => updateChecklistItem(section.title, item, "status", s.val)}
                                                                        className={`px-3 py-1.5 rounded-md transition-all ${currentStatus === s.val ? 'bg-white/10 scale-110 shadow-lg' : 'opacity-40 grayscale hover:grayscale-0'}`}
                                                                    >
                                                                        <span className={`text-xl ${s.color}`}>{s.icon}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Conditional Comments and Photos */}
                                                        {currentStatus && (
                                                            <div className="flex flex-wrap gap-3 animate-in zoom-in-95 duration-200">
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => updateChecklistItem(section.title, item, "showComment", !formData.checklistData[itemKey]?.showComment)}
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${formData.checklistData[itemKey]?.showComment ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                                                >
                                                                    <MessageSquare size={14} /> {t("checklist.form.addComment")}
                                                                </button>

                                                                {(currentStatus === "Warning" || currentStatus === "Fail") && (
                                                                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-800 border-slate-700 text-slate-400 cursor-pointer hover:bg-slate-700 transition-colors">
                                                                        <Camera size={14} />
                                                                        {formData.checklistData[itemKey]?.photo ? t("checklist.form.photoAdded") : t("checklist.form.addPhoto")}
                                                                        <input 
                                                                            type="file" 
                                                                            accept="image/*" 
                                                                            className="hidden" 
                                                                            onChange={(e) => handlePhotoUpload(section.title, item, e.target.files[0])}
                                                                        />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}

                                                        {formData.checklistData[itemKey]?.showComment && (
                                                            <textarea 
                                                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-cyan-500 animate-in slide-in-from-top-2"
                                                                placeholder={t("checklist.form.commentPlaceholder")}
                                                                value={formData.checklistData[itemKey]?.comment || ""}
                                                                onChange={(e) => updateChecklistItem(section.title, item, "comment", e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!formData.plateNumber && (
                            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl">
                                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500">{t("checklist.form.selectPrompt")}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !formData.plateNumber}
                            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <Save size={22} />}
                            {submitting ? t("common.saving") : t("checklist.form.submit")}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
