// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchWithAuth } from "../api/api";

/**
 * CacheContext
 * - Caches Suivi (machinery tracking data) and Usernames (safe list) in memory + localStorage
 * - TTL-based refresh (default 5 minutes)
 * - Exposes helpers:
 *    getEquipment(), forceRefreshEquipment()
 *    getUsernames(), forceRefreshUsernames()
 *
 * Usage:
 *   const { equipment, usernames, loading } = useCache();
 *
 * Implementation notes:
 * - Backend endpoints used: /api/suivi and /api/usernames (protected)
 * - Auth token is read from localStorage at call time
 * - "equipment" variable name kept for backward compatibility, but now contains Suivi data
 * - Helpers automatically filter out trailers (Machinery !== "Trailer") for other pages
 */

const CacheContext = createContext(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LS_KEYS = {
  equipment: "cache_equipment_v2", // Changed from v1 to v2 to invalidate old Equipment_List cache
  equipment_ts: "cache_equipment_ts_v2",
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

  // Fetch equipment from backend (now uses Suivi sheet endpoint)
  const refreshEquipment = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!force && !isStale(LS_KEYS.equipment_ts) && equipment && equipment.length) {
      // not stale, keep current
      return;
    }
    try {
      setLoadingEquipment(true);
      // ✅ CHANGED: Now fetching from /api/suivi instead of /api/equipment
      const response = await fetchWithAuth("/api/suivi");
      const data = await response.json();
      // Expecting array of rows from Suivi sheet:
      // [{ "Status": "...", "Machinery": "...", "Model / Type": "...", "Plate Number": "...", "Driver 1": "...", "Driver 2": "...", ... }, ...]
      persistEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshEquipment failed (Suivi endpoint)", err);
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
      // Using fetchWithAuth for consistency
      const response = await fetchWithAuth("/api/usernames");
      const data = await response.json();
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
    equipment, // Raw Suivi data (includes trailers)
    usernames,
    loadingEquipment,
    loadingUsernames,
    
    // helpers
    getEquipment: () => equipment, // ✅ Returns ALL Suivi data (for Suivi pages - includes trailers)
    
    // ✅ NEW: Returns Suivi data WITHOUT trailers (for other pages like Maintenance, Cleaning, etc.)
    getEquipmentList: () => {
      return (equipment || []).filter((r) => r.Machinery !== "Trailer");
    },
    
    getModels: () => {
      // ✅ UPDATED: Exclude trailers from models list
      const models = [...new Set(
        (equipment || [])
          .filter((r) => r.Machinery !== "Trailer") // Filter out trailers
          .map((r) => r["Model / Type"])
          .filter(Boolean)
      )];
      return models.sort();
    },
    
    getPlatesByModel: (model) => {
      // ✅ UPDATED: Exclude trailers when filtering by model
      if (!model) return [];
      return (equipment || [])
        .filter((r) => r.Machinery !== "Trailer" && r["Model / Type"] === model)
        .map((r) => r["Plate Number"])
        .filter(Boolean);
    },
    
    getEquipmentByPlate: (plate) => {
      // ✅ UPDATED: Only find non-trailer equipment by plate
      if (!plate) return null;
      return (equipment || []).find(
        (r) => r.Machinery !== "Trailer" && r["Plate Number"] === plate
      ) || null;
    },
    
    getDriversByPlate: (plate) => {
      // ✅ UPDATED: Exclude trailers (they have no drivers anyway)
      const eq = (equipment || []).find(
        (r) => r.Machinery !== "Trailer" && r["Plate Number"] === plate
      );
      if (!eq) return [];
      return [eq["Driver 1"], eq["Driver 2"]].filter(Boolean);
    },
    
    getUsernames: () => usernames,
    
    // force refresh (manual)
    forceRefreshEquipment: () => refreshEquipment(true), // Forces refresh of Suivi data
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
