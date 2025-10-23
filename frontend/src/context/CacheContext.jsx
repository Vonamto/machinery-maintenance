// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fetchEquipmentList, fetchUsernames } from "../api/api";

/**
 * CacheContext keeps Google Sheets data in memory
 * so we don’t refetch on every dropdown.
 * It refreshes automatically every 10 minutes (TTL)
 */

const CacheContext = createContext(null);

export function CacheProvider({ children }) {
  const { token } = useAuth();
  const [equipmentList, setEquipmentList] = useState([]);
  const [users, setUsers] = useState([]); // safe list: { Name, Role }
  const [lastFetch, setLastFetch] = useState(0);
  const TTL = 10 * 60 * 1000; // 10 minutes

  async function refreshData() {
    if (!token) return;
    try {
      const [eq, us] = await Promise.all([
        fetchEquipmentList(token),
        fetchUsernames(token),
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
    // initial fetch
    if (Date.now() - lastFetch > TTL) refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = {
    equipmentList,
    users,
    refreshData,
    // helpers for dropdown components
    getModels() {
      // unique models
      const set = new Set(equipmentList.map((e) => e["Model / Type"]).filter(Boolean));
      return Array.from(set);
    },
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
    // users safe list: [{Name, Role}]
    getMechanicsAndSupervisors() {
      return users.filter((u) => ["Mechanic", "Supervisor"].includes(u.Role));
    },
    getAllUsers() {
      return users;
    }
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error("useCache must be used inside CacheProvider");
  return ctx;
}
