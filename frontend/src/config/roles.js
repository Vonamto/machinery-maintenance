// frontend/src/config/roles.js
// Single source of truth for roles & page permissions

/* ================= Roles ================= */

export const ROLES = {
  SUPERVISOR: "Supervisor",
  MECHANIC: "Mechanic",
  DRIVER: "Driver",
  CLEANER: "Cleaning Guy",
  ADMIN: "Admin",           // 🆕 NEW: Full access (including Users page)
  GUEST: "Guest",           // 🆕 NEW: Access to all except Users page
  MANAGER: "Manager",       // 🆕 NEW: Read-only access to history pages
};

/* ================= Page Permissions ================= */

export const PAGE_PERMISSIONS = {
  // Checklist
  CHECKLIST: [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST],
  CHECKLIST_FORM: [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST],
  CHECKLIST_HISTORY: [ROLES.SUPERVISOR, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER, ROLES.MECHANIC],  // ✅ Manager can view

  // Maintenance
  MAINTENANCE: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST],
  MAINTENANCE_FORM: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.ADMIN, ROLES.GUEST],
  MAINTENANCE_HISTORY: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],  // ✅ Manager can view

  // Cleaning
  CLEANING: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST],
  CLEANING_FORM: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST],
  CLEANING_HISTORY: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.CLEANER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],  // ✅ Manager can view

  // Suivi (Machinery Tracking)
  SUIVILIST: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],
  SUIVIMANAGE: [ROLES.SUPERVISOR, ROLES.ADMIN],
  SUIVIDETAIL: [ROLES.SUPERVISOR, ROLES.MECHANIC, ROLES.DRIVER, ROLES.ADMIN, ROLES.GUEST, ROLES.MANAGER],

  // Users
  USERS: [ROLES.ADMIN],  // 🔒 Only Admin (Supervisor removed)
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
  SUIVI_ADD: [ROLES.SUPERVISOR, ROLES.ADMIN],
  SUIVI_EDIT: [ROLES.SUPERVISOR, ROLES.ADMIN],
  SUIVI_DELETE: [ROLES.SUPERVISOR, ROLES.ADMIN],

  // ========== Users Management ==========
  USERS_ADD: [ROLES.ADMIN],
  USERS_EDIT: [ROLES.ADMIN],
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
