import os
import json
import gspread
import jwt
import datetime
from google.oauth2.service_account import Credentials
from flask import jsonify

# ✅ Load credentials from Render environment variable
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

SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"
SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkey")  # ⚠️ change later

def authenticate_user(username, password):
    """
    Check credentials from Users sheet.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Users")
        users = sheet.get_all_records()

        for user in users:
            if user["Username"] == username and str(user["Password"]) == str(password):
                payload = {
                    "username": username,
                    "role": user["Role"],
                    "full_name": user.get("Full Name", ""),
                    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
                return jsonify({
                    "status": "success",
                    "token": token,
                    "user": payload
                })
        return jsonify({"status": "error", "message": "Invalid username or password"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

def verify_token(token):
    """
    Decode and verify JWT token.
    """
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data
    except Exception:
        return None
