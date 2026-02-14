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
    "ADMIN": "Admin",           # 🆕 NEW: Full access (including Users page)
    "GUEST": "Guest",           # 🆕 NEW: Access to all except Users page
    "MANAGER": "Manager",       # 🆕 NEW: Read-only access to history pages
}

# -------------------------
# Sheet Permissions
# -------------------------
SHEET_PERMISSIONS = {

    "Maintenance_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"]],  # ✅ Manager can view history
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Requests_Parts": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Grease_Oil_Requests": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"]],
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Cleaning_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"]],  # ✅ Manager can view history
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"], ROLES["ADMIN"], ROLES["GUEST"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"], ROLES["ADMIN"], ROLES["GUEST"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

    "Equipment_List": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["CLEANER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"]],  # ✅ Manager can view list
        "add":    [ROLES["SUPERVISOR"], ROLES["ADMIN"], ROLES["GUEST"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["ADMIN"], ROLES["GUEST"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },

"Suivi": {
    'view': [ROLES['SUPERVISOR'], ROLES['MECHANIC'], ROLES['DRIVER'], ROLES['ADMIN'], ROLES['GUEST'], ROLES['MANAGER']],
    'add': [ROLES['SUPERVISOR'], ROLES['ADMIN'], ROLES['GUEST']],
    'edit': [ROLES['SUPERVISOR'], ROLES['ADMIN'], ROLES['GUEST']],
    'delete': [ROLES['SUPERVISOR'], ROLES['ADMIN']],
},
    
"Machinery_Types": {
    'view': [ROLES['SUPERVISOR'], ROLES['MECHANIC'], ROLES['DRIVER'], ROLES['ADMIN'], ROLES['GUEST'], ROLES['MANAGER']],
    'add': [ROLES['ADMIN']],
    'edit': [ROLES['ADMIN']],
    'delete': [ROLES['ADMIN']],
},

    "Users": {
        "view":   [ROLES["ADMIN"]],    # 🔒 Only Admin (Supervisor removed)
        "add":    [ROLES["ADMIN"]],    # 🔒 Only Admin
        "edit":   [ROLES["ADMIN"]],    # 🔒 Only Admin
        "delete": [ROLES["ADMIN"]],    # 🔒 Only Admin
    },

    "Checklist_Log": {
        "view":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"], ROLES["MANAGER"]],  # ✅ Manager can view history
        "add":    [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["DRIVER"], ROLES["ADMIN"], ROLES["GUEST"]],
        "edit":   [ROLES["SUPERVISOR"], ROLES["MECHANIC"], ROLES["ADMIN"], ROLES["GUEST"]],
        "delete": [ROLES["SUPERVISOR"], ROLES["ADMIN"]],
    },
}
