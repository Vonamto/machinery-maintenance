// frontend/src/context/CacheContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchEquipmentList, fetchUsernames } from '../api/api'; // Ensure this path is correct
import CONFIG from '../config'; // Ensure this path is correct

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Helper to check if stored data is stale
const isStale = (timestampKey) => {
  const timestamp = localStorage.getItem(timestampKey);
  return !timestamp || Date.now() - parseInt(timestamp, 10) > CACHE_TTL_MS;
};

const LS_KEYS = {
  equipment: 'cached_equipment',
  equipment_ts: 'cached_equipment_timestamp',
  usernames: 'cached_usernames',
  usernames_ts: 'cached_usernames_timestamp',
};

const persistEquipment = (data) => {
  localStorage.setItem(LS_KEYS.equipment, JSON.stringify(data));
  localStorage.setItem(LS_KEYS.equipment_ts, Date.now().toString());
};

const persistUsernames = (data) => {
  localStorage.setItem(LS_KEYS.usernames, JSON.stringify(data));
  localStorage.setItem(LS_KEYS.usernames_ts, Date.now().toString());
};

const retrieveEquipment = () => {
  try {
    const item = localStorage.getItem(LS_KEYS.equipment);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('Error retrieving cached equipment:', e);
    return null;
  }
};

const retrieveUsernames = () => {
  try {
    const item = localStorage.getItem(LS_KEYS.usernames);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('Error retrieving cached usernames:', e);
    return null;
  }
};

const CacheContext = createContext();

export const CacheProvider = ({ children }) => {
  const [equipment, setEquipment] = useState(() => retrieveEquipment() || []);
  const [usernames, setUsernames] = useState(() => retrieveUsernames() || []);
  const [loadingEquipment, setLoadingEquipment] = useState(false); // Expose loading state
  const [loadingUsernames, setLoadingUsernames] = useState(false); // Expose loading state

  const refreshEquipment = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Check cache staleness before fetching, unless forced
    if (!force && !isStale(LS_KEYS.equipment_ts) && equipment && equipment.length) {
      return; // Already have fresh data
    }

    try {
      setLoadingEquipment(true); // Set loading state *before* fetching
      const data = await fetchEquipmentList(token); // Use your actual API function
      persistEquipment(Array.isArray(data) ? data : []);
      setEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshEquipment failed", err);
      // Optionally set to empty array on error
      setEquipment([]);
    } finally {
      setLoadingEquipment(false); // Always clear loading state after fetch
    }
  }, [equipment]); // Depend on equipment to ensure callback updates if equipment changes

  const refreshUsernames = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!force && !isStale(LS_KEYS.usernames_ts) && usernames && usernames.length) {
      return;
    }

    try {
      setLoadingUsernames(true); // Set loading state *before* fetching
      const data = await fetchUsernames(token); // Use your actual API function
      persistUsernames(Array.isArray(data) ? data : []);
      setUsernames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Cache: refreshUsernames failed", err);
      // Optionally set to empty array on error
      setUsernames([]);
    } finally {
      setLoadingUsernames(false); // Always clear loading state after fetch
    }
  }, [usernames]); // Depend on usernames


  // Effect to initiate loading when token becomes available (or on mount if already logged in)
  // This is key for triggering the load early!
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Check staleness and trigger refresh if needed
      if (isStale(LS_KEYS.equipment_ts)) {
        refreshEquipment();
      } else {
        // If not stale, set the state from localStorage immediately
        setEquipment(retrieveEquipment() || []);
      }

      if (isStale(LS_KEYS.usernames_ts)) {
        refreshUsernames();
      } else {
        setUsernames(retrieveUsernames() || []);
      }
    } else {
      // Clear cache if no token
      setEquipment([]);
      setUsernames([]);
    }
  }, [refreshEquipment, refreshUsernames]); // Depend on the callbacks


  // Optional: Periodic background refresh while the app is open
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        // Only refresh if data is stale
        if (isStale(LS_KEYS.equipment_ts)) refreshEquipment();
        if (isStale(LS_KEYS.usernames_ts)) refreshUsernames();
      }
    }, CACHE_TTL_MS);

    return () => clearInterval(interval);
  }, [refreshEquipment, refreshUsernames]);

  // Memoized helper functions
  const getModels = useMemo(() => () => {
    const models = [...new Set((equipment || []).map(r => r["Model / Type"]).filter(Boolean))];
    return models.sort();
  }, [equipment]);

  const getPlatesByModel = useMemo(() => (model) => {
    if (!model) return [];
    const matches = equipment.filter(e => e["Model / Type"] === model);
    return [...new Set(matches.map(m => m["Plate Number"]).filter(Boolean))].sort();
  }, [equipment]);

  const getDriversByPlate = useMemo(() => (plate) => {
    if (!plate) return [];
    const matches = equipment.filter(e => e["Plate Number"] === plate);
    const drivers = [...new Set(matches.flatMap(m => [m["Driver 1"], m["Driver 2"], m["Driver"]]).filter(Boolean))];
    return drivers.sort();
  }, [equipment]);

  const getUsernames = useMemo(() => () => usernames, [usernames]); // Simple getter


  const value = {
    equipment,
    usernames,
    loadingEquipment, // Expose this state
    loadingUsernames, // Expose this state
    getModels,
    getPlatesByModel,
    getDriversByPlate,
    getUsernames,
    forceRefreshEquipment: () => refreshEquipment(true),
    forceRefreshUsernames: () => refreshUsernames(true),
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};
