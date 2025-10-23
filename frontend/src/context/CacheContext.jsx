// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchEquipmentList, fetchUsernames } from "../api/api";

/**
 * CacheContext
 * - Caches Equipment_List and Usernames (safe list) in memory + localStorage
 * - TTL-based refresh (default 5 minutes)
 * - Exposes helpers:
 *    getEquipment(), forceRefreshEquipment()
 *    getUsernames(), forceRefreshUsernames()
 *
 * Usage:
 *   const { equipment, usernames, loading } = useCache();
 *
 * Implementation notes:
 * - Backend endpoints used: /api/equipment and /api/usernames (protected)
 * - Auth token is read from localStorage at call time
 */

const CacheContext = createContext(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LS_KEYS = {
  equipment: "cache_equipment_v1",
  equipment_ts: "cache_equipment_ts_v1",
  usernames: "cache_usernames_v1",
  usernames_ts: "cache_usernames_ts_v1",
};

export function CacheProvider({ children }) {
  const [equipment, setEquipment] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.equipment);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [usernames, setUsernames] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.usernames);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  const isStale = (tsKey) => {
    try {
      const ts = Number(localStorage.getItem(tsKey) || 0);
      return Date.now() - ts > CACHE_TTL_MS;
    } catch {
      return true;
    }
  };

  // Internal: save to localStorage + state
  const persistEquipment = (arr) => {
    try {
      localStorage.setItem(LS_KEYS.equipment, JSON.stringify(arr || []));
      localStorage.setItem(LS_KEYS.equipment_ts, String(Date.now()));
    } catch (e) {
      // ignore storage errors
      console.warn("Cache: failed to persist equipment", e);
    }
    setEquipment(arr || []);
  };

  const persistUsernames = (arr) => {
    try {
      localStorage.setItem(LS_KEYS.usernames, JSON.stringify(arr || []));
      localStorage.setItem(LS_KEYS.usernames_ts, String(Date.now()));
    } catch (e) {
      console.warn("Cache: failed to persist usernames", e);
    }
    setUsernames(arr || []);
  };

  // Fetch equipment from backend using api helper (reads token inside api)
  const refreshEquipment = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!force && !isStale(LS_KEYS.equipment_ts) && equipment && equipment.length) {
      // not stale, keep current
      return;
    }
    try {
      setLoadingEquipment(true);
      const data = await fetchEquipmentList(token);
      // Expecting array of rows: [{ "Model / Type": "...", "Plate Number": "...", "Driver 1": "...", "Driver 2": "..." }, ...]
      persistEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshEquipment failed", err);
    } finally {
      setLoadingEquipment(false);
    }
  }, [equipment]);

  // Fetch usernames (safe) endpoint
  const refreshUsernames = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!force && !isStale(LS_KEYS.usernames_ts) && usernames && usernames.length) {
      return;
    }
    try {
      setLoadingUsernames(true);
      const data = await fetchUsernames(token);
      // Expecting [{ Name: 'Full Name', Role: 'Mechanic' }, ...]
      persistUsernames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshUsernames failed", err);
    } finally {
      setLoadingUsernames(false);
    }
  }, [usernames]);

  // On mount, refresh in background only if stale
  useEffect(() => {
    try {
      if (isStale(LS_KEYS.equipment_ts)) {
        refreshEquipment();
      }
      if (isStale(LS_KEYS.usernames_ts)) {
        refreshUsernames();
      }
      // Also schedule periodic background refresh every TTL to keep things fresh while app open
      const interval = setInterval(() => {
        refreshEquipment();
        refreshUsernames();
      }, CACHE_TTL_MS);
      return () => clearInterval(interval);
    } catch (e) {
      // ignore
    }
  }, [refreshEquipment, refreshUsernames]);

  // Exposed API
  const value = {
    equipment,
    usernames,
    loadingEquipment,
    loadingUsernames,
    // helpers
    getEquipment: () => equipment,
    getModels: () => {
      // unique models list sorted
      const models = [...new Set((equipment || []).map((r) => r["Model / Type"]).filter(Boolean))];
      return models.sort();
    },
    getPlatesByModel: (model) => {
      if (!model) return [];
      return (equipment || [])
        .filter((r) => r["Model / Type"] === model)
        .map((r) => r["Plate Number"])
        .filter(Boolean);
    },
    getEquipmentByPlate: (plate) => {
      if (!plate) return null;
      return (equipment || []).find((r) => r["Plate Number"] === plate) || null;
    },
    getDriversByPlate: (plate) => {
      const eq = (equipment || []).find((r) => r["Plate Number"] === plate);
      if (!eq) return [];
      return [eq["Driver 1"], eq["Driver 2"]].filter(Boolean);
    },
    getUsernames: () => usernames,
    // force refresh (manual)
    forceRefreshEquipment: () => refreshEquipment(true),
    forceRefreshUsernames: () => refreshUsernames(true),
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) {
    throw new Error("useCache must be used inside CacheProvider");
  }
  return ctx;
}
