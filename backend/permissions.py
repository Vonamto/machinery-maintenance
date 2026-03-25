# backend/permissions.py
# ==========================================
# Centralized Role & Sheet Permissions
# (Single source of truth)
# ==========================================

# -------------------------
# Roles (same strings as Users sheet & frontend)
# -------------------------
ROLES = {
    "SUPERVISOR": "Supervisor",
    "MECHANIC":   "Mechanic",
    "DRIVER":     "Driver",
    "CLEANER":    "Cleaning Guy",
    "ADMIN":      "Admin",        # Full access (including Users page)
    "GUEST":      "Guest",        # Access to all except Users page
    "MANAGER":    "Manager",      # Read-only access to history pages
    "SUP_LOG":    "Sup Log",      # 🆕 Logistics Supervisor
    "HSE_GTG":    "HSE GTG",      # 🆕 HSE GTG (Suivi view only)
}

# -------------------------
# Sheet Permissions
# -------------------------
SHEET_PERMISSIONS = {

    "Maintenance_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"], ROLES["SUP_LOG"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Cleaning_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"], ROLES["SUP_LOG"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Suivi": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"], ROLES["SUP_LOG"], ROLES["HSE_GTG"], ROLES["CLEANER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Machinery_Types": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"], ROLES["SUP_LOG"], ROLES["HSE_GTG"], ROLES["CLEANER"]],
        "add":    [ROLES["ADMIN"]],
        "edit":   [ROLES["ADMIN"]],
        "delete": [ROLES["ADMIN"]],
    },

    "Users": {
        "view":   [ROLES["ADMIN"]],   # 🔒 Only Admin
        "add":    [ROLES["ADMIN"]],   # 🔒 Only Admin
        "edit":   [ROLES["ADMIN"]],   # 🔒 Only Admin
        "delete": [ROLES["ADMIN"]],   # 🔒 Only Admin
    },

    "Checklist_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"], ROLES["SUP_LOG"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["SUP_LOG"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    # ==========================================
    # 🆕 HSE MODULE — PPE Stock Management
    # ==========================================

    "PPE_Types": {
        "view":   [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "PPE_Stock": {
        "view":   [ROLES["SUPERVISOR"], ROLES["ADMIN"], ROLES["MANAGER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "PPE_Distribution_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["ADMIN"], ROLES["MANAGER"], ROLES["SUP_LOG"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Workers_HSE": {
        "view":   [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },
}
