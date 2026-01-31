from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from sheets_service import get_sheet_data, append_row, update_row
from auth_service import authenticate_user, verify_token

# 🔐 Centralized permissions
from permissions import SHEET_PERMISSIONS

app = Flask(__name__)

# =====================================================
# ✅ CORS (ENV-based, PROD + PREVIEW SAFE)
# =====================================================
CORS(
    app,
    origins=os.environ.get("FRONTEND_URL", "*").split(","),
    supports_credentials=True
)

# =====================================================
# ✅ Root route (for test)
# =====================================================
@app.route("/")
def home():
    return jsonify({"message": "Backend connected successfully"}), 200


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

        request.user = decoded
        return func(*args, **kwargs)

    wrapper.__name__ = func.__name__
    return wrapper


# =====================================================
# ✅ Helper: Role Permission Checker
# =====================================================
def check_permission(sheet_name, action):
    role = request.user.get("role")
    allowed_roles = SHEET_PERMISSIONS.get(sheet_name, {}).get(action, [])

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
# ✅ Public-safe endpoint for dropdowns
# =====================================================
@app.route("/api/usernames", methods=["GET"])
@require_token
def get_usernames():
    from sheets_service import client, SPREADSHEET_ID
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Users")
        records = sheet.get_all_records()
        return jsonify([
            {
                "Name": r.get("Full Name") or r.get("Name"),
                "Role": r.get("Role")
            }
            for r in records
            if r.get("Full Name") or r.get("Name")
        ])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ VIEW
# =====================================================
@app.route("/api/<sheet_name>", methods=["GET"])
@require_token
def get_data(sheet_name):
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
# ✅ ADD
# =====================================================
@app.route("/api/add/<sheet_name>", methods=["POST"])
@require_token
def add_row_api(sheet_name):
    check = check_permission(sheet_name, "add")
    if check:
        return check

    new_row = request.get_json() or {}
    return jsonify(append_row(sheet_name, new_row))


# =====================================================
# ✅ EDIT
# =====================================================
@app.route("/api/edit/<sheet_name>/<int:row_index>", methods=["PUT"])
@require_token
def edit_row(sheet_name, row_index):
    check = check_permission(sheet_name, "edit")
    if check:
        return check

    try:
        updated_data = request.get_json() or {}
        return jsonify(update_row(sheet_name, row_index, updated_data))
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ DELETE (fully centralized)
# =====================================================
@app.route("/api/delete/<sheet_name>/<int:row_index>", methods=["DELETE"])
@require_token
def delete_row_api(sheet_name, row_index):
    from sheets_service import delete_row

    check = check_permission(sheet_name, "delete")
    if check:
        return check

    try:
        return jsonify(delete_row(sheet_name, row_index))
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ Run App
# =====================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
