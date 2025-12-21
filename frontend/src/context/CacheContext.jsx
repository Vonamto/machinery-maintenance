// frontend/src/context/CacheContext.jsx

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { fetchEquipmentList, fetchUsernames } from "../api/api";

const CacheContext = createContext(null);

export function CacheProvider({ children }) {
  const [equipment, setEquipment] = useState([]);
  const [usernames, setUsernames] = useState([]);

  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingEquipment(true);
      setLoadingUsernames(true);

      const [eq, users] = await Promise.all([
        fetchEquipmentList(token),
        fetchUsernames(token),
      ]);

      setEquipment(Array.isArray(eq) ? eq : []);
      setUsernames(Array.isArray(users) ? users : []);
    } catch (e) {
      console.error("Cache load failed", e);
    } finally {
      setLoadingEquipment(false);
      setLoadingUsernames(false);
    }
  }, []);

  const value = {
    equipment,
    usernames,
    loadingEquipment,
    loadingUsernames,

    loadAll, // 👈 THIS IS THE KEY

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
