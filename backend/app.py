from flask import Flask, request, jsonify
from flask_cors import CORS
from sheets_service import get_sheet_data, append_row
from auth_service import authenticate_user, verify_token

app = Flask(__name__)
CORS(app)

# ✅ JWT Protection decorator
def require_token(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"status": "error", "message": "Missing token"}), 401

        # Remove "Bearer " prefix if present
        token = token.replace("Bearer ", "")
        decoded = verify_token(token)
        if not decoded:
            return jsonify({"status": "error", "message": "Invalid or expired token"}), 401

        request.user = decoded  # store user info
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


# ✅ Login route
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username") or data.get("Username")
    password = data.get("password") or data.get("Password")
    return authenticate_user(username, password)


# ✅ Protected test route
@app.route("/api/protected", methods=["GET"])
@require_token
def protected():
    return jsonify({"status": "success", "user": request.user})


# ✅ Get data from a sheet tab
@app.route("/api/<sheet_name>", methods=["GET"])
@require_token
def get_data(sheet_name):
    return get_sheet_data(sheet_name)


# ✅ Add a new row
@app.route("/api/add/<sheet_name>", methods=["POST"])
@require_token
def add_row(sheet_name):
    new_row = request.get_json()
    result = append_row(sheet_name, new_row)
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
