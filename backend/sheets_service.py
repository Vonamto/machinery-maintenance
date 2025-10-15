import os
import json
import gspread
from google.oauth2.service_account import Credentials
from flask import jsonify

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
    'new_row' should be a dict matching the column headers.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)
        row_to_add = [new_row.get(h, "") for h in headers]
        sheet.append_row(row_to_add)
        return {"status": "success", "added": new_row}
    except Exception as e:
        return {"status": "error", "message": str(e)}
