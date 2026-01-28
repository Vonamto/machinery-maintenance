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
        "delete": [],  # nobody can delete
    },

    "Requests_Parts": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "delete": [],
    },

    "Grease_Oil_Requests": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "delete": [],
    },

    "Cleaning_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "delete": [],
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
        "delete": [],
    },

    "Checklist_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "delete": [],
    },
}
