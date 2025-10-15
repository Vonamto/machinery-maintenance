from flask import Flask, jsonify
from flask_cors import CORS
from sheets_service import get_sheet_data  # <-- import from your helper file

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({"message": "Backend connected to Google Sheets successfully!"})

@app.route("/equipment")
def get_equipment():
    return get_sheet_data("Equipment_List")

@app.route("/maintenance")
def get_maintenance():
    return get_sheet_data("Maintenance_Log")

@app.route("/requests-parts")
def get_requests_parts():
    return get_sheet_data("Requests_Parts")

@app.route("/grease-oil")
def get_grease_oil():
    return get_sheet_data("Grease_Oil_Requests")

@app.route("/cleaning")
def get_cleaning():
    return get_sheet_data("Cleaning_Log")

@app.route("/users")
def get_users():
    return get_sheet_data("Users")

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
