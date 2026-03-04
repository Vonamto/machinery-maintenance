// frontend/src/config/roles.js
// Single source of truth for roles & page permissions

/* ================= Roles ================= */

export const ROLES = {
  SUPERVISOR: "Supervisor",
  MECHANIC:   "Mechanic",
  DRIVER:     "Driver",
  CLEANER:    "Cleaning Guy",
  ADMIN:      "Admin",        // Full access (including Users page)
  GUEST:      "Guest",        // Access to all except Users page
  MANAGER:    "Manager",      // Read-only access to history pages
  SUP_LOG:    "Sup Log",      // 🆕 Logistics Supervisor
  HSE_GTG:    "HSE GTG",      // 🆕 HSE GTG (Suivi view only)
};

/* ================= Page Permissions ================= */

export const PAGE_PERMISSIONS = {
  // Checklist
  CHECKLIST:         [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG],
  CHECKLIST_FORM:    [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.SUP_LOG],
  CHECKLIST_HISTORY: [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG],

  // Maintenance — neither new role can access frontend pages
  MAINTENANCE:         [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],
  MAINTENANCE_FORM:    [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.ADMIN, ROLES.GUEST],
  MAINTENANCE_HISTORY: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],

  // Cleaning
  CLEANING:         [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG],
  CLEANING_FORM:    [ROLES.SUPERVISOR, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST, ROLES.SUP_LOG],
  CLEANING_HISTORY: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG],

  // Suivi (Machinery Tracking)
  SUIVI:       [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG, ROLES.HSE_GTG],
  SUIVILIST:   [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG, ROLES.HSE_GTG],
  SUIVIMANAGE: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.SUP_LOG],
  SUIVIDETAIL: [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.SUP_LOG, ROLES.HSE_GTG],

  // Users
  USERS: [ROLES.ADMIN], // 🔒 Only Admin
};

/* ================= Action Permissions ================= */
// Based on backend/permissions.py - Single source of truth for who can perform actions

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
