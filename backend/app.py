from flask import Flask, request, jsonify
from flask_cors import CORS
from sheets_service import get_sheet_data, append_row
from auth_service import authenticate_user, verify_token

app = Flask(__name__)
CORS(app)

# ✅ Login route
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    return authenticate_user(username, password)

# ✅ Protected test route
@app.route("/api/protected", methods=["GET"])
def protected():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"status": "error", "message": "Missing token"}), 401

    decoded = verify_token(token)
    if not decoded:
        return jsonify({"status": "error", "message": "Invalid or expired token"}), 401

    return jsonify({"status": "success", "user": decoded})

# ✅ Get data from a sheet tab
@app.route("/api/<sheet_name>", methods=["GET"])
def get_data(sheet_name):
    return get_sheet_data(sheet_name)

# ✅ Add a new row
@app.route("/api/add/<sheet_name>", methods=["POST"])
def add_row(sheet_name):
    new_row = request.get_json()
    result = append_row(sheet_name, new_row)
    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
