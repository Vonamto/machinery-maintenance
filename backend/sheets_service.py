import os
import json
import gspread
from google.oauth2.service_account import Credentials
from flask import jsonify
from datetime import datetime
import pytz

# ✅ Load credentials from Render environment variable
service_account_info = json.loads(os.environ["GOOGLE_CREDENTIALS"])
service_account_info["private_key"] = service_account_info["private_key"].replace("\\n", "\n")

# ✅ Authorize Google Sheets access
creds = Credentials.from_service_account_info(
    service_account_info,
    scopes=[
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
)

client = gspread.authorize(creds)

# ✅ Your spreadsheet ID (from the URL of your sheet)
SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"

def get_sheet_data(sheet_name):
    """
    Reads all records from a specific sheet tab.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        rows = sheet.get_all_records()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)})

def append_row(sheet_name, new_row):
    """
    Adds a new row to the given sheet tab.
    Automatically fills the current date/time in columns named 'Date' or 'Request Date'
    if the user didn’t provide one.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)

        # ✅ Determine Algeria time (UTC+1)
        algeria_tz = pytz.timezone("Africa/Algiers")
        current_time = datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

        row_to_add = []
        for h in headers:
            value = new_row.get(h, "")
            # Automatically insert timestamp if header is Date/Request Date
            if h.strip().lower() in ["date", "request date"] and not value:
                value = current_time
            row_to_add.append(value)

        sheet.append_row(row_to_add)
        return {"status": "success", "added": new_row, "timestamp": current_time}

    except Exception as e:
        return {"status": "error", "message": str(e)}
