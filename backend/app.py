from flask import Flask, request, jsonify
from flask_cors import CORS
from sheets_service import get_sheet_data, append_row, update_row
from auth_service import authenticate_user, verify_token

app = Flask(__name__)
CORS(app)

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
        "view": ["Supervisor"],
        "add": ["Supervisor"],
        "edit": ["Supervisor"]
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
    """
    Verifies if the logged-in user has the right to perform this action.
    Returns None if allowed, or an error response if denied.
    """
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
# ✅ VIEW (GET) Endpoint – Requires permission
# Example: GET /api/Maintenance_Log
# =====================================================
@app.route("/api/<sheet_name>", methods=["GET"])
@require_token
def get_data(sheet_name):
    check = check_permission(sheet_name, "view")
    if check:
        return check  # Access denied
    return get_sheet_data(sheet_name)


# =====================================================
# ✅ ADD (POST) Endpoint – Requires permission
# Example: POST /api/add/Requests_Parts  (body = JSON matching headers)
# =====================================================
@app.route("/api/add/<sheet_name>", methods=["POST"])
@require_token
def add_row_api(sheet_name):
    check = check_permission(sheet_name, "add")
    if check:
        return check  # Access denied

    new_row = request.get_json() or {}
    result = append_row(sheet_name, new_row)
    return jsonify(result)


# =====================================================
# ✅ EDIT (PUT) Endpoint – Requires permission
# Example: PUT /api/edit/Requests_Parts/6 (body = {"Status":"Completed"})
# Note: row_index is the actual sheet row number (1-based, header = 1)
# =====================================================
@app.route("/api/edit/<sheet_name>/<int:row_index>", methods=["PUT"])
@require_token
def edit_row(sheet_name, row_index):
    check = check_permission(sheet_name, "edit")
    if check:
        return check  # Access denied

    try:
        updated_data = request.get_json() or {}
        result = update_row(sheet_name, row_index, updated_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ Run App
# =====================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
