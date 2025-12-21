// frontend/src/context/CacheContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { fetchEquipmentList, fetchUsernames } from "../api/api";

const CacheContext = createContext(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const LS_KEYS = {
  equipment: "cache_equipment_v2",
  equipment_ts: "cache_equipment_ts_v2",
  usernames: "cache_usernames_v2",
  usernames_ts: "cache_usernames_ts_v2",
};

export function CacheProvider({ children }) {
  const [equipment, setEquipment] = useState([]);
  const [usernames, setUsernames] = useState([]);

  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  const isStale = (key) => {
    const ts = Number(localStorage.getItem(key) || 0);
    return Date.now() - ts > CACHE_TTL_MS;
  };

  const persistEquipment = (data) => {
    localStorage.setItem(LS_KEYS.equipment, JSON.stringify(data));
    localStorage.setItem(LS_KEYS.equipment_ts, String(Date.now()));
    setEquipment(data);
  };

  const persistUsernames = (data) => {
    localStorage.setItem(LS_KEYS.usernames, JSON.stringify(data));
    localStorage.setItem(LS_KEYS.usernames_ts, String(Date.now()));
    setUsernames(data);
  };

  const refreshEquipment = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!force && !isStale(LS_KEYS.equipment_ts) && equipment.length) return;

    try {
      setLoadingEquipment(true);
      const data = await fetchEquipmentList(token);
      persistEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load equipment", err);
    } finally {
      setLoadingEquipment(false);
    }
  }, [equipment]);

  const refreshUsernames = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!force && !isStale(LS_KEYS.usernames_ts) && usernames.length) return;

    try {
      setLoadingUsernames(true);
      const data = await fetchUsernames(token);
      persistUsernames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load usernames", err);
    } finally {
      setLoadingUsernames(false);
    }
  }, [usernames]);

  // 🚀 CRITICAL FIX: LOAD IMMEDIATELY ON APP START
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    refreshEquipment(true);
    refreshUsernames(true);
  }, []);

  const value = {
    equipment,
    usernames,
    loadingEquipment,
    loadingUsernames,

    getModels: () =>
      [...new Set(equipment.map((r) => r["Model / Type"]).filter(Boolean))],

    getPlatesByModel: (model) =>
      equipment
        .filter((r) => r["Model / Type"] === model)
        .map((r) => r["Plate Number"])
        .filter(Boolean),

    getDriversByPlate: (plate) => {
      const eq = equipment.find((r) => r["Plate Number"] === plate);
      if (!eq) return [];
      return [eq["Driver 1"], eq["Driver 2"]].filter(Boolean);
    },

    forceRefreshEquipment: () => refreshEquipment(true),
    forceRefreshUsernames: () => refreshUsernames(true),
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error("useCache must be used inside CacheProvider");
  return ctx;
}
