from flask import Flask, jsonify, request
from flask_cors import CORS
from sheets_service import get_sheet_data, append_row

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({"message": "Backend working!"})

# ✅ Read data
@app.route("/api/<sheet_name>", methods=["GET"])
def read_sheet(sheet_name):
    return get_sheet_data(sheet_name)

# ✅ Add new row
@app.route("/api/add/<sheet_name>", methods=["POST"])
def add_row(sheet_name):
    try:
        data = request.get_json()
        result = append_row(sheet_name, data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
