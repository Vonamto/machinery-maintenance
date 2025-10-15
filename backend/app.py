from flask import Flask, jsonify, request
from flask_cors import CORS
from sheets_service import get_sheet_data, append_row

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({"message": "Backend working!"})

# ✅ Get all data from a sheet/tab
@app.route("/api/<sheet_name>", methods=["GET"])
def read_sheet(sheet_name):
    return get_sheet_data(sheet_name)

# ✅ Add a new record to a sheet/tab
@app.route("/api/<sheet_name>", methods=["POST"])
def add_record(sheet_name):
    try:
        new_row = request.get_json()
        result = append_row(sheet_name, new_row)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
