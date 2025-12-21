// frontend/src/context/CacheContext.jsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { fetchEquipmentList, fetchUsernames } from "../api/api";

const CacheContext = createContext(null);

export function CacheProvider({ children }) {
  const [equipment, setEquipment] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);

      const [eq, users] = await Promise.all([
        fetchEquipmentList(token),
        fetchUsernames(token),
      ]);

      setEquipment(Array.isArray(eq) ? eq : []);
      setUsernames(Array.isArray(users) ? users : []);
      setLoadedOnce(true);
    } catch (e) {
      console.error("Cache load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ AUTO-LOAD CACHE WHEN TOKEN EXISTS (CRITICAL FIX)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !loadedOnce) {
      loadAll();
    }
  }, [loadAll, loadedOnce]);

  const value = {
    equipment,
    usernames,
    loading,
    loadAll,

    getModels: () =>
      [...new Set(equipment.map(r => r["Model / Type"]).filter(Boolean))],

    getPlatesByModel: (model) =>
      equipment
        .filter(r => r["Model / Type"] === model)
        .map(r => r["Plate Number"])
        .filter(Boolean),

    getDriversByPlate: (plate) => {
      const eq = equipment.find(r => r["Plate Number"] === plate);
      if (!eq) return [];
      return [eq["Driver 1"], eq["Driver 2"]].filter(Boolean);
    },
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  return useContext(CacheContext);
}
