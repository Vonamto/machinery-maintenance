import os
import json
import gspread
import jwt
import datetime
from google.oauth2.service_account import Credentials
from flask import jsonify

# ✅ Load Google credentials from environment (Render)
service_account_info = json.loads(os.environ["GOOGLE_CREDENTIALS"])
service_account_info["private_key"] = service_account_info["private_key"].replace("\\n", "\n")

creds = Credentials.from_service_account_info(
    service_account_info,
    scopes=[
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
)

client = gspread.authorize(creds)

# ✅ Config
SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"
SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey")  # ⚠️ set this in Render ENV vars


# ✅ USER AUTHENTICATION FUNCTION
def authenticate_user(username, password):
    """
    Authenticate a user against Google Sheets 'Users' tab.
    Returns a JWT token if credentials are valid.
    """
    try:
        if not username or not password:
            return jsonify({"status": "error", "message": "Missing username or password"}), 400

        sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Users")
        users = sheet.get_all_records()

        username = str(username).strip()
        password = str(password).strip()

        for user in users:
            sheet_username = str(user.get("Username", "")).strip()
            sheet_password = str(user.get("Password", "")).strip()

            if sheet_username.lower() == username.lower() and sheet_password == password:
                payload = {
                    "username": sheet_username,
                    "role": user.get("Role", ""),
                    "full_name": user.get("Full Name", ""),
                    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
                return jsonify({
                    "status": "success",
                    "token": token,
                    "user": payload
                }), 200

        return jsonify({"status": "error", "message": "Invalid username or password"}), 401

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ✅ TOKEN VERIFICATION FUNCTION
def verify_token(token):
    """
    Decode and verify a JWT token.
    Returns the payload if valid, otherwise None.
    """
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data
    except Exception:
        return None
