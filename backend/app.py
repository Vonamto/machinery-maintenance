from flask import Flask, jsonify
from flask_cors import CORS
import os
import json
import gspread
from google.oauth2.service_account import Credentials

app = Flask(__name__)
CORS(app)

# Load credentials from Render environment variable
service_account_info = json.loads(os.environ["GOOGLE_CREDENTIALS"])
creds = Credentials.from_service_account_info(
    service_account_info,
    scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
)

gc = gspread.authorize(creds)

# Your Google Sheet link
SHEET_URL = "https://docs.google.com/spreadsheets/d/1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM/edit?usp=sharing"

@app.route("/")
def home():
    return jsonify({"message": "Backend working!"})

@app.route("/test-sheet")
def test_sheet():
    try:
        sheet = gc.open_by_url(SHEET_URL).worksheet("Equipment_List")
        data = sheet.get_all_records()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
