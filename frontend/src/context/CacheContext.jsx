// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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
 *   const { equipment, usernames, loadingEquipment, loadingUsernames } = useCache();
 *
 * FIXES APPLIED:
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX 1 — Infinite re-render loop (root cause of flickering dropdowns):
 *   OLD: useCallback([equipment]) → every fetch changes `equipment` state →
 *        new callback reference → useEffect re-runs → new interval created →
 *        fetch again → loop forever, multiple overlapping intervals.
 *   NEW: useRef syncs current values without being deps. useCallback([]) is
 *        stable forever. useEffect runs exactly once on mount.
 *
 * FIX 2 — Cache wiped on API error (root cause of "disappears" behavior):
 *   OLD: persistEquipment(Array.isArray(data) ? data : []) — if token expired,
 *        backend returns { status:"error" } which is not an array → []  written
 *        to localStorage and setEquipment([]) called → all dropdowns go blank.
 *   NEW: Guard with if(Array.isArray(data)) before persisting. Non-array
 *        responses are warned and ignored — existing cache stays intact.
 *
 * FIX 3 — Stable interval (prevents 429 quota errors):
 *   Because FIX 1 makes callbacks stable, the setInterval is created once and
 *   cleared once on unmount. No more multiple overlapping background refresh
 *   loops hammering /api/suivi and /api/usernames every few seconds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CacheContext = createContext(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LS_KEYS = {
  equipment:    "cache_equipment_v2",
  equipment_ts: "cache_equipment_ts_v2",
  usernames:    "cache_usernames_v1",
  usernames_ts: "cache_usernames_ts_v1",
};

export function CacheProvider({ children }) {

  // ── State: initialised from localStorage so dropdowns are instant on first render ──
  const [equipment, setEquipment] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.equipment);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [usernames, setUsernames] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.usernames);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingUsernames,  setLoadingUsernames]  = useState(false);

  // ── FIX 1: Refs always hold the latest state value ──────────────────────────
  // Assigning here (outside useCallback) means they update on every render.
  // Inside the callbacks we read .current instead of the closed-over state
  // variable, so we never need to add state to useCallback's deps array.
  const equipmentRef = useRef(equipment);
  const usernamesRef = useRef(usernames);
  equipmentRef.current = equipment;
  usernamesRef.current = usernames;

  // ── Staleness helper ─────────────────────────────────────────────────────────
  const isStale = (tsKey) => {
    try {
      return Date.now() - Number(localStorage.getItem(tsKey) || 0) > CACHE_TTL_MS;
    } catch { return true; }
  };

  // ── Persist helpers: write to localStorage AND React state ───────────────────
  const persistEquipment = (arr) => {
    try {
      localStorage.setItem(LS_KEYS.equipment,    JSON.stringify(arr));
      localStorage.setItem(LS_KEYS.equipment_ts, String(Date.now()));
    } catch (e) { console.warn("Cache: failed to persist equipment", e); }
    setEquipment(arr);
  };

  const persistUsernames = (arr) => {
    try {
      localStorage.setItem(LS_KEYS.usernames,    JSON.stringify(arr));
      localStorage.setItem(LS_KEYS.usernames_ts, String(Date.now()));
    } catch (e) { console.warn("Cache: failed to persist usernames", e); }
    setUsernames(arr);
  };

  // ── FIX 1 + FIX 2: refreshEquipment — stable reference, safe on error ────────
  const refreshEquipment = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Read via ref — always the current value, no dep needed
    if (!force && !isStale(LS_KEYS.equipment_ts) && equipmentRef.current?.length) {
      return; // cache is fresh, skip fetch
    }

    try {
      setLoadingEquipment(true);
      const response = await fetchWithAuth("/api/suivi");
      const data = await response.json();

      // FIX 2: ONLY persist when the response is a real array.
      // An expired token returns { status:"error", message:"..." } — not an array.
      // Calling persistEquipment([]) would silently wipe all dropdown data.
      if (Array.isArray(data)) {
        persistEquipment(data);
      } else {
        console.warn("Cache: /api/suivi returned non-array — keeping existing cache.", data);
        // Do NOT touch localStorage or state here
      }
    } catch (err) {
      console.error("Cache: refreshEquipment failed", err);
      // Do NOT call persistEquipment on network/parse error either
    } finally {
      setLoadingEquipment(false);
    }
  }, []); // ← FIX 1: empty deps = stable reference forever, no re-render loop

  // ── FIX 1 + FIX 2: refreshUsernames — same pattern ───────────────────────────
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

      if (Array.isArray(data)) {
        persistUsernames(data);
      } else {
        console.warn("Cache: /api/usernames returned non-array — keeping existing cache.", data);
      }
    } catch (err) {
      console.error("Cache: refreshUsernames failed", err);
    } finally {
      setLoadingUsernames(false);
    }
  }, []); // ← FIX 1: stable reference

  // ── FIX 3: useEffect runs exactly ONCE on mount ───────────────────────────────
  // Both callbacks have stable references (empty deps above), so this effect
  // never re-runs, the interval is created once, and cleared once on unmount.
  // No more overlapping background loops spamming the Google Sheets API.
  useEffect(() => {
    if (isStale(LS_KEYS.equipment_ts)) refreshEquipment();
    if (isStale(LS_KEYS.usernames_ts)) refreshUsernames();

    const interval = setInterval(() => {
      refreshEquipment();
      refreshUsernames();
    }, CACHE_TTL_MS);

    return () => clearInterval(interval);
  }, [refreshEquipment, refreshUsernames]); // stable → runs once

  // ── Exposed context value ─────────────────────────────────────────────────────
  const value = {
    equipment,        // Raw Suivi rows (includes Trailers) — for Suivi pages
    usernames,
    loadingEquipment,
    loadingUsernames,

    // Returns ALL Suivi rows including Trailers (for Suivi list/detail pages)
    getEquipment: () => equipment,

    // Returns Suivi rows WITHOUT Trailers (for Maintenance, Cleaning, Checklist)
    getEquipmentList: () =>
      (equipment || []).filter((r) => r.Machinery !== "Trailer"),

    // Unique sorted model names, no Trailers
    getModels: () => {
      const models = [...new Set(
        (equipment || [])
          .filter((r) => r.Machinery !== "Trailer")
          .map((r) => r["Model / Type"])
          .filter(Boolean)
      )];
      return models.sort();
    },

    // All plate numbers for a given model, no Trailers
    getPlatesByModel: (model) => {
      if (!model) return [];
      return (equipment || [])
        .filter((r) => r.Machinery !== "Trailer" && r["Model / Type"] === model)
        .map((r) => r["Plate Number"])
        .filter(Boolean);
    },

    // Single equipment row by plate, no Trailers
    getEquipmentByPlate: (plate) => {
      if (!plate) return null;
      return (equipment || []).find(
        (r) => r.Machinery !== "Trailer" && r["Plate Number"] === plate
      ) || null;
    },

    // [Driver1, Driver2] for a given plate, no Trailers
    getDriversByPlate: (plate) => {
      const eq = (equipment || []).find(
        (r) => r.Machinery !== "Trailer" && r["Plate Number"] === plate
      );
      if (!eq) return [];
      return [eq["Driver 1"], eq["Driver 2"]].filter(Boolean);
    },

    getUsernames: () => usernames,

    // Manual force-refresh (e.g. after adding new machinery)
    forceRefreshEquipment: () => refreshEquipment(true),
    forceRefreshUsernames: () => refreshUsernames(true),
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const ctx = useContext(CacheContext);
  if (!ctx) throw new Error("useCache must be used inside CacheProvider");
  return ctx;
}
