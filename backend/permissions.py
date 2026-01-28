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
    "MECHANIC": "Mechanic",
    "DRIVER": "Driver",
    "CLEANER": "Cleaning Guy",
}

# -------------------------
# Sheet Permissions
# -------------------------
SHEET_PERMISSIONS = {

    "Maintenance_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "delete": [ROLES["SUPERVISOR"]],  # nobody can delete
    },

    "Requests_Parts": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "delete": [ROLES["SUPERVISOR"]],
    },

    "Grease_Oil_Requests": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "delete": [ROLES["SUPERVISOR"]],
    },

    "Cleaning_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "delete": [ROLES["SUPERVISOR"]],
    },

    "Equipment_List": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "add":    [ROLES["SUPERVISOR"]],
        "edit":   [ROLES["SUPERVISOR"]],
        "delete": [ROLES["SUPERVISOR"]],  # 👈 SAME rule as before
    },

    "Users": {
        "view":   [ROLES["SUPERVISOR"]],
        "add":    [ROLES["SUPERVISOR"]],
        "edit":   [ROLES["SUPERVISOR"]],
        "delete": [ROLES["SUPERVISOR"]],
    },

    "Checklist_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "delete": [ROLES["SUPERVISOR"]],
    },
}
