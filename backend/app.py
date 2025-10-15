from flask import Flask, jsonify
from flask_cors import CORS
import sheets_service  # <-- import our new helper

app = Flask(__name__)
CORS(app)

# Set your Google Sheet file name (the one visible in Drive)
SHEET_NAME = "Machinery_Maintenance_Data"

@app.route("/")
def home():
    return jsonify({"message": "Backend working!"})

@app.route("/equipment")
def get_equipment():
    try:
        data = sheets_service.read_tab(SHEET_NAME, "Equipment_List")
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
