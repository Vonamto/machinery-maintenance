from flask import Flask, request, jsonify
from flask_cors import CORS
from sheets_service import get_sheet_data, append_row, update_row
from auth_service import authenticate_user, verify_token

app = Flask(__name__)

# =====================================================
# ✅ Allow CORS only from your frontend (Vercel)
# =====================================================
CORS(app, origins=["https://machinery-maintenance.vercel.app"])

# =====================================================
# ✅ Root route (for test)
# =====================================================
@app.route("/")
def home():
    return jsonify({"message": "Backend connected successfully"}), 200


# =====================================================
# ✅ Role-Based Access Rules (match your Google Sheet tab names)
# =====================================================
ROLE_PERMISSIONS = {
    "Maintenance_Log": {
        "view": ["Supervisor", "Mechanic", "Driver"],
        "add": ["Supervisor", "Mechanic"],
        "edit": ["Supervisor", "Mechanic"]
    },
    "Requests_Parts": {
        "view": ["Supervisor", "Mechanic", "Driver"],
        "add": ["Supervisor", "Mechanic", "Driver"],
        "edit": ["Supervisor", "Mechanic"]
    },
    "Grease_Oil_Requests": {
        "view": ["Supervisor", "Mechanic", "Driver"],
        "add": ["Supervisor", "Mechanic", "Driver"],
        "edit": ["Supervisor", "Mechanic"]
    },
    "Cleaning_Log": {
        "view": ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
        "add": ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
        "edit": ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"]
    },
    "Equipment_List": {
        "view": ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
        "add": ["Supervisor"],
        "edit": ["Supervisor"]
    },
    "Users": {
        # Full Users list: Supervisor only
        "view": ["Supervisor"],
        "add": ["Supervisor"],
        "edit": ["Supervisor"]
    },
    "Checklist_Log": {
        "view": ["Supervisor", "Mechanic", "Driver"],
        "add": ["Supervisor", "Mechanic", "Driver"],  # Allow Drivers to add
        "edit": ["Supervisor", "Mechanic"]
    }
}


# =====================================================
# ✅ JWT Protection decorator
# =====================================================
def require_token(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"status": "error", "message": "Missing token"}), 401

        token = token.replace("Bearer ", "")
        decoded = verify_token(token)
        if not decoded:
            return jsonify({"status": "error", "message": "Invalid or expired token"}), 401

        request.user = decoded  # Store user info for later use
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


# =====================================================
# ✅ Helper: Role Permission Checker
# =====================================================
def check_permission(sheet_name, action):
    role = request.user.get("role")
    allowed_roles = ROLE_PERMISSIONS.get(sheet_name, {}).get(action, [])
    if role not in allowed_roles:
        return jsonify({
            "status": "error",
            "message": f"Access denied: {role} cannot {action} in {sheet_name}"
        }), 403
    return None


# =====================================================
# ✅ LOGIN
# =====================================================
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username") or data.get("Username")
    password = data.get("password") or data.get("Password")
    return authenticate_user(username, password)


# =====================================================
# ✅ TEST Protected Endpoint
# =====================================================
@app.route("/api/protected", methods=["GET"])
@require_token
def protected():
    return jsonify({"status": "success", "user": request.user})


# =====================================================
# ✅ Public-safe endpoint for dropdowns (no passwords)
# =====================================================
@app.route("/api/usernames", methods=["GET"])
@require_token
def get_usernames():
    from sheets_service import client, SPREADSHEET_ID
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Users")
        records = sheet.get_all_records()
        safe_list = [
            {
                "Name": r.get("Full Name") or r.get("Name"),
                "Role": r.get("Role")
            }
            for r in records
            if r.get("Full Name") or r.get("Name")
        ]
        return jsonify(safe_list)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ VIEW (GET)
# =====================================================
@app.route("/api/<sheet_name>", methods=["GET"])
@require_token
def get_data(sheet_name):
    # Map short names to actual Google Sheet tab names
    aliases = {
        "equipment": "Equipment_List",
        "users": "Users"
    }
    sheet_key = aliases.get(sheet_name.lower(), sheet_name)
    check = check_permission(sheet_key, "view")
    if check:
        return check
    return get_sheet_data(sheet_key)


# =====================================================
# ✅ ADD (POST)
# =====================================================
@app.route("/api/add/<sheet_name>", methods=["POST"])
@require_token
def add_row_api(sheet_name):
    check = check_permission(sheet_name, "add")
    if check:
        return check

    new_row = request.get_json() or {}
    result = append_row(sheet_name, new_row)
    return jsonify(result)


# =====================================================
# ✅ EDIT (PUT)
# =====================================================
@app.route("/api/edit/<sheet_name>/<int:row_index>", methods=["PUT"])
@require_token
def edit_row(sheet_name, row_index):
    check = check_permission(sheet_name, "edit")
    if check:
        return check

    try:
        updated_data = request.get_json() or {}
        result = update_row(sheet_name, row_index, updated_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ DELETE (DELETE) - Add this route to your app.py
# =====================================================
@app.route("/api/delete/<sheet_name>/<int:row_index>", methods=["DELETE"])
@require_token
def delete_row_api(sheet_name, row_index):
    """
    Completely deletes a row from the specified sheet.
    Only Supervisor can delete from Equipment_List.
    """
    from sheets_service import delete_row
    
    # Check permissions (only Supervisor can delete equipment)
    if sheet_name == "Equipment_List":
        if request.user.get("role") != "Supervisor":
            return jsonify({
                "status": "error",
                "message": "Only Supervisors can delete equipment"
            }), 403
    
    try:
        result = delete_row(sheet_name, row_index)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# =====================================================
# ✅ Run App
# =====================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
