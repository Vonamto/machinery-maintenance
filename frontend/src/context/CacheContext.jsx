// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"; // ✅ added useRef
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
  equipment: "cache_equipment_v2",
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

  // ✅ FIX #2: Refs mirror the latest state so callbacks can read
  //    current data without being recreated on every state change
  const equipmentRef = useRef(equipment);
  useEffect(() => { equipmentRef.current = equipment; }, [equipment]);

  const usernamesRef = useRef(usernames);
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

  // ✅ FIX #2: Reads equipmentRef.current instead of closing over
  //    equipment state — dep array is now [] so this function is
  //    created ONCE and never recreated, breaking the re-render loop
  const refreshEquipment = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!force && !isStale(LS_KEYS.equipment_ts) && equipmentRef.current?.length) {
      return;
    }
    try {
      setLoadingEquipment(true);
      const response = await fetchWithAuth("/api/suivi");
      const data = await response.json();
      persistEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshEquipment failed (Suivi endpoint)", err);
    } finally {
      setLoadingEquipment(false);
    }
  }, []); // ✅ Empty deps — function is stable forever

  // ✅ FIX #2: Same pattern for usernames
  const refreshUsernames = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!force && !isStale(LS_KEYS.usernames_ts) && usernamesRef.current?.length) {
      return;
    }
    try {
      setLoadingUsernames(true);
      const response = await fetchWithAuth("/api/usernames");
      const data = await response.json();
      persistUsernames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshUsernames failed", err);
    } finally {
      setLoadingUsernames(false);
    }
  }, []); // ✅ Empty deps — function is stable forever

  // ✅ FIX #2: Because both callbacks are now stable (never recreated),
  //    this effect runs ONCE on mount and the interval is set up cleanly
  //    without ever being torn down and restarted unnecessarily
  useEffect(() => {
    try {
      if (isStale(LS_KEYS.equipment_ts)) {
        refreshEquipment();
      }
      if (isStale(LS_KEYS.usernames_ts)) {
        refreshUsernames();
      }
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

    getEquipment: () => equipment,

    getEquipmentList: () => {
      return (equipment || []).filter((r) => r.Machinery !== "Trailer");
    },

    getModels: () => {
      const models = [...new Set(
        (equipment || [])
          .filter((r) => r.Machinery !== "Trailer")
          .map((r) => r["Model / Type"])
          .filter(Boolean)
      )];
      return models.sort();
    },

    getPlatesByModel: (model) => {
      if (!model) return [];
      return (equipment || [])
        .filter((r) => r.Machinery !== "Trailer" && r["Model / Type"] === model)
        .map((r) => r["Plate Number"])
        .filter(Boolean);
    },

    getEquipmentByPlate: (plate) => {
      if (!plate) return null;
      return (equipment || []).find(
        (r) => r.Machinery !== "Trailer" && r["Plate Number"] === plate
      ) || null;
    },

    getDriversByPlate: (plate) => {
      const eq = (equipment || []).find(
        (r) => r.Machinery !== "Trailer" && r["Plate Number"] === plate
      );
      if (!eq) return [];
      return [eq["Driver 1"], eq["Driver 2"]].filter(Boolean);
    },

    getUsernames: () => usernames,

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
