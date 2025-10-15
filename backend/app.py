from flask import Flask, jsonify, request
from flask_cors import CORS
from sheets_service import get_sheet_data

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({"message": "Backend working and connected to Google Sheets!"})

@app.route("/equipment")
def get_equipment():
    from sheets_service import get_sheet_data
    return get_sheet_data("Equipment_List")

@app.route("/maintenance")
def get_maintenance():
    from sheets_service import get_sheet_data
    return get_sheet_data("Maintenance_Log")

@app.route("/requests-parts")
def get_parts_requests():
    from sheets_service import get_sheet_data
    return get_sheet_data("Requests_Parts")

@app.route("/grease-oil")
def get_grease_oil():
    from sheets_service import get_sheet_data
    return get_sheet_data("Grease_Oil_Requests")

@app.route("/cleaning-log")
def get_cleaning_log():
    from sheets_service import get_sheet_data
    return get_sheet_data("Cleaning_Log")

@app.route("/users")
def get_users():
    from sheets_service import get_sheet_data
    return get_sheet_data("Users")

# 🧠 NEW: filtering endpoint
@app.route("/filter/<sheet_name>")
def filter_sheet(sheet_name):
    from sheets_service import get_sheet_data
    data = get_sheet_data(sheet_name).json

    # Example query: /filter/Equipment_List?Status=OK
    filters = request.args
    if not filters:
        return jsonify(data)

    filtered = []
    for row in data:
        match = all(str(row.get(k, "")).lower() == v.lower() for k, v in filters.items())
        if match:
            filtered.append(row)
    return jsonify(filtered)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
