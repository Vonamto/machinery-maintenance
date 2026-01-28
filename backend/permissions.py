# backend/permissions.py
# ==========================================
# Centralized Role & Sheet Permissions
# (NO behavior change – mirrors app.py)
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
        "view": [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":  [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
        "edit": [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
    },

    "Requests_Parts": {
        "view": [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":  [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit": [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
    },

    "Grease_Oil_Requests": {
        "view": [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":  [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit": [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
    },

    "Cleaning_Log": {
        "view": [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "add":  [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "edit": [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
    },

    "Equipment_List": {
        "view": [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"]],
        "add":  [ROLES["SUPERVISOR"]],
        "edit": [ROLES["SUPERVISOR"]],
    },

    "Users": {
        "view": [ROLES["SUPERVISOR"]],
        "add":  [ROLES["SUPERVISOR"]],
        "edit": [ROLES["SUPERVISOR"]],
    },

    "Checklist_Log": {
        "view": [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "add":  [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"]],
        "edit": [ROLES["SUPERVISOR"], ROLES["MECHANIC"]],
    },
}
