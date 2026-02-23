// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
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
 *
 * FIXED: useCallback deps were causing an infinite re-render loop which made
 *        dropdowns flash/disappear. Now uses useRef to read current values
 *        inside stable callbacks, and useMemo for the context value object.
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

  // ✅ FIX: Refs mirror the latest state values so callbacks can read them
  //         without needing to list them as dependencies (which caused the loop)
  const equipmentRef = useRef(equipment);
  const usernamesRef = useRef(usernames);

  useEffect(() => { equipmentRef.current = equipment; }, [equipment]);
  useEffect(() => { usernamesRef.current = usernames; }, [usernames]);

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

  // ✅ FIX: Empty dependency array [] means this function is created ONCE and never
  //         recreated. It reads current data via the ref instead of via state.
  const refreshEquipment = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Read from ref (not state) — avoids making `equipment` a dependency
    if (!force && !isStale(LS_KEYS.equipment_ts) && equipmentRef.current?.length) {
      return;
    }
    try {
      setLoadingEquipment(true);
      // ✅ Fetching from /api/suivi instead of /api/equipment
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
  }, []); // ✅ Empty — this function reference never changes

  // ✅ FIX: Same pattern for usernames
  const refreshUsernames = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Read from ref (not state) — avoids making `usernames` a dependency
    if (!force && !isStale(LS_KEYS.usernames_ts) && usernamesRef.current?.length) {
      return;
    }
    try {
      setLoadingUsernames(true);
      const response = await fetchWithAuth("/api/usernames");
      const data = await response.json();
      // Expecting [{ Name: 'Full Name', Role: 'Mechanic' }, ...]
      persistUsernames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshUsernames failed", err);
    } finally {
      setLoadingUsernames(false);
    }
  }, []); // ✅ Empty — this function reference never changes

  // ✅ FIX: Empty dependency array [] means this effect runs ONCE on mount only.
  //         Before the fix, it was re-running every few milliseconds because
  //         refreshEquipment/refreshUsernames kept getting recreated on every render.
  useEffect(() => {
    try {
      if (isStale(LS_KEYS.equipment_ts)) {
        refreshEquipment();
      }
      if (isStale(LS_KEYS.usernames_ts)) {
        refreshUsernames();
      }
      // Periodic background refresh — registered once, not repeatedly
      const interval = setInterval(() => {
        refreshEquipment(true);
        refreshUsernames(true);
      }, CACHE_TTL_MS);
      return () => clearInterval(interval);
    } catch (e) {
      // ignore
    }
  }, []); // ✅ Empty — runs once on mount, never again

  // ✅ FIX: useMemo means the context value object is only recreated when the
  //         actual data changes (equipment/usernames arrays), not on every render.
  //         This stops all form dropdowns from re-running their effects constantly.
  const value = useMemo(() => ({
    equipment, // Raw Suivi data (includes trailers)
    usernames,
    loadingEquipment,
    loadingUsernames,

    // helpers
    getEquipment: () => equipment, // ✅ Returns ALL Suivi data (for Suivi pages - includes trailers)

    // ✅ Returns Suivi data WITHOUT trailers (for other pages like Maintenance, Cleaning, etc.)
    getEquipmentList: () => {
      return (equipment || []).filter((r) => r.Machinery !== "Trailer");
    },

    getModels: () => {
      // ✅ Exclude trailers from models list
      const models = [...new Set(
        (equipment || [])
          .filter((r) => r.Machinery !== "Trailer")
          .map((r) => r["Model / Type"])
          .filter(Boolean)
      )];
      return models.sort();
    },

    getPlatesByModel: (model) => {
      // ✅ Exclude trailers when filtering by model
      if (!model) return [];
      return (equipment || [])
        .filter((r) => r.Machinery !== "Trailer" && r["Model / Type"] === model)
        .map((r) => r["Plate Number"])
        .filter(Boolean);
    },

    getEquipmentByPlate: (plate) => {
      // ✅ Only find non-trailer equipment by plate
      if (!plate) return null;
      return (equipment || []).find(
        (r) => r.Machinery !== "Trailer" && r["Plate Number"] === plate
      ) || null;
    },

    getDriversByPlate: (plate) => {
      // ✅ Exclude trailers (they have no drivers anyway)
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
  }), [equipment, usernames, loadingEquipment, loadingUsernames, refreshEquipment, refreshUsernames]);

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) {
    throw new Error("useCache must be used inside CacheProvider");
  }
  return ctx;
}
