// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fetchEquipmentList, fetchUsers } from "../api/api";

/**
 * CacheContext keeps Google Sheets data in memory
 * so we don’t refetch on every dropdown.
 * It refreshes automatically every 10 minutes (TTL)
 */

const CacheContext = createContext(null);

export function CacheProvider({ children }) {
  const { token } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [users, setUsers] = useState([]);
  const [lastFetch, setLastFetch] = useState(0);
  const TTL = 10 * 60 * 1000; // 10 minutes

  async function refreshData() {
    if (!token) return;
    try {
      const [eq, us] = await Promise.all([
        fetchEquipmentList(token),
        fetchUsers(token),
      ]);
      setEquipmentList(eq || []);
      setUsers(us || []);
      setLastFetch(Date.now());
    } catch (err) {
      console.error("Cache refresh error:", err);
    }
  }

  useEffect(() => {
    if (!token) return;
    if (Date.now() - lastFetch > TTL) refreshData();
  }, [token]);

  const value = {
    equipmentList,
    users,
    refreshData,
    getEquipmentByModel(model) {
      return equipmentList.filter((e) => e["Model / Type"] === model);
    },
    getEquipmentByPlate(plate) {
      return equipmentList.find((e) => e["Plate Number"] === plate);
    },
    getDriversForPlate(plate) {
      const eq = equipmentList.find((e) => e["Plate Number"] === plate);
      return eq ? [eq["Driver 1"], eq["Driver 2"]].filter(Boolean) : [];
    },
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error("useCache must be used inside CacheProvider");
  return ctx;
}
