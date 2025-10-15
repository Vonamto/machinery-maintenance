import gspread
import os
import json
from google.oauth2.service_account import Credentials
from flask import jsonify

# Load service account credentials from environment variable
service_account_info = json.loads(os.environ["GOOGLE_CREDENTIALS"])
service_account_info["private_key"] = service_account_info["private_key"].replace("\\n", "\n")

creds = Credentials.from_service_account_info(
    service_account_info,
    scopes=["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
)
gc = gspread.authorize(creds)

# Your spreadsheet name
SPREADSHEET_NAME = "Machinery_Maintenance_Data"

def get_sheet_data(sheet_name):
    """
    Reads all records from a specific sheet tab.
    """
    try:
        sh = gc.open(SPREADSHEET_NAME)
        worksheet = sh.worksheet(sheet_name)
        rows = worksheet.get_all_records()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)})
