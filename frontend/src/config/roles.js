// frontend/src/config/roles.js
// Single source of truth for roles & page permissions

/* ================= Roles ================= */

export const ROLES = {
  SUPERVISOR: "Supervisor",
  MECHANIC:   "Mechanic",
  DRIVER:     "Driver",
  CLEANER:    "Cleaning Guy",
  ADMIN:      "Admin",        // Full access (including Users page)
  GUEST:      "Guest",        // Access to some pages
  MANAGER:    "Manager",      // Read-only access to history pages
  SUP_LOG:    "Sup Log",      // 🆕 Logistics Supervisor
  HSE_GTG:    "HSE GTG",      // 🆕 HSE GTG (Suivi view only)
};

/* ================= Page Permissions ================= */

export const PAGE_PERMISSIONS = {
  // Checklist
  CHECKLIST:         [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUP_LOG],
  CHECKLIST_FORM:    [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.SUP_LOG],
  CHECKLIST_HISTORY: [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG],

  // Maintenance
  MAINTENANCE:         [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],
  MAINTENANCE_FORM:    [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.ADMIN],
  MAINTENANCE_HISTORY: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],

  // Cleaning
  CLEANING:         [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG],
  CLEANING_FORM:    [ROLES.SUPERVISOR, ROLES.CLEANER, ROLES.ADMIN, ROLES.SUP_LOG],
  CLEANING_HISTORY: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG],

  // Suivi (Machinery Tracking)
  SUIVI:       [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUP_LOG, ROLES.HSE_GTG, ROLES.GUEST],
  SUIVILIST:   [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUP_LOG, ROLES.HSE_GTG, ROLES.GUEST],
  SUIVIMANAGE: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.SUP_LOG],
  SUIVIDETAIL: [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUP_LOG, ROLES.HSE_GTG, ROLES.GUEST],

  // Users
  USERS: [ROLES.ADMIN],

  // ==========================================
  // HSE Module
  // ==========================================

  // Landing page — everyone who can access at least one sub-page
  HSE: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUP_LOG],

  // Stock page — Supervisor & Admin full access, Manager view only
  HSE_STOCK: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER],

  // Distribute page — Supervisor & Admin only
  HSE_DISTRIBUTE: [ROLES.SUPERVISOR, ROLES.ADMIN],

  // History page — Supervisor & Admin full, Manager & Sup Log view only
  HSE_HISTORY: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER, ROLES.SUP_LOG],

  // Workers page — Supervisor & Admin only
  HSE_WORKERS: [ROLES.SUPERVISOR, ROLES.ADMIN],
};

/* ================= Action Permissions ================= */

export const ACTION_PERMISSIONS = {
  // ========== Cleaning History ==========
  CLEANINGHISTORY_DELETE: [ROLES.SUPERVISOR, ROLES.ADMIN],

  // ========== Maintenance History ==========
  MAINTENANCEHISTORY_DELETE: [ROLES.SUPERVISOR, ROLES.ADMIN],

  // ========== Checklist History ==========
  CHECKLISTHISTORY_DELETE: [ROLES.SUPERVISOR, ROLES.ADMIN],

  // ========== Suivi (Machinery Tracking) ==========
  SUIVI_ADD:    [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.SUP_LOG],
  SUIVI_EDIT:   [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.SUP_LOG],
  SUIVI_DELETE: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.SUP_LOG],

  // ========== Users Management ==========
  USERS_ADD:    [ROLES.ADMIN],
  USERS_EDIT:   [ROLES.ADMIN],
  USERS_DELETE: [ROLES.ADMIN],

  // ==========================================
  // HSE Module Actions
  // ==========================================

  // PPE Stock
  HSE_STOCK_VIEW:        [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER],
  HSE_STOCK_RESTOCK:     [ROLES.SUPERVISOR, ROLES.ADMIN],
  HSE_STOCK_EDIT:        [ROLES.SUPERVISOR, ROLES.ADMIN],
  HSE_STOCK_DELETE:      [ROLES.SUPERVISOR, ROLES.ADMIN],

  // PPE Types
  HSE_TYPES_ADD:         [ROLES.SUPERVISOR, ROLES.ADMIN],
  HSE_TYPES_EDIT:        [ROLES.SUPERVISOR, ROLES.ADMIN],
  HSE_TYPES_DELETE:      [ROLES.SUPERVISOR, ROLES.ADMIN],

  // PPE Distribution
  HSE_DISTRIBUTE_ADD:    [ROLES.SUPERVISOR, ROLES.ADMIN],

  // PPE History
  HSE_HISTORY_EDIT:      [ROLES.SUPERVISOR, ROLES.ADMIN],
  HSE_HISTORY_DELETE:    [ROLES.SUPERVISOR, ROLES.ADMIN],

  // Workers
  HSE_WORKERS_ADD:       [ROLES.SUPERVISOR, ROLES.ADMIN],
  HSE_WORKERS_EDIT:      [ROLES.SUPERVISOR, ROLES.ADMIN],
  HSE_WORKERS_DELETE:    [ROLES.SUPERVISOR, ROLES.ADMIN],

  // ==========================================
  // HSE Stock — Tab Visibility
  // ==========================================
  HSE_STOCK_TAB_SUMMARY: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER],
  HSE_STOCK_TAB_STOCK:   [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.MANAGER],
  HSE_STOCK_TAB_TYPES:   [ROLES.SUPERVISOR, ROLES.ADMIN],
  // 👆 To give any role access to a tab in the future,
  //    just add the role here — no need to touch PPEStock.jsx
};

/* ================= Helper Functions ================= */

/**
 * Check if user can perform a specific action
 * @param {string} userRole - The role of the current user
 * @param {string} actionKey - The action key from ACTION_PERMISSIONS
 * @returns {boolean} - True if user has permission, false otherwise
 */
export function canUserPerformAction(userRole, actionKey) {
  const allowedRoles = ACTION_PERMISSIONS[actionKey] || [];
  return allowedRoles.includes(userRole);
}
