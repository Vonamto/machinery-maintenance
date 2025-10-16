import os
import json
import gspread
from google.oauth2.service_account import Credentials
from flask import jsonify
from datetime import datetime
import pytz

# =====================================================
# ✅ Load credentials from Render environment variable
# =====================================================
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

# ✅ Spreadsheet ID
SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"


# =====================================================
# ✅ READ SHEET DATA
# =====================================================
def get_sheet_data(sheet_name):
    """
    Reads all records from a specific sheet tab.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        rows = sheet.get_all_records()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ ADD NEW ROW
# =====================================================
def append_row(sheet_name, new_row):
    """
    Adds a new row to the given sheet tab.
    Automatically fills 'Date' or 'Request Date' fields with current time (Algeria timezone)
    if not provided.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)

        # 🇩🇿 Algeria time (UTC+1)
        algeria_tz = pytz.timezone("Africa/Algiers")
        current_time = datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

        row_to_add = []
        for h in headers:
            value = new_row.get(h, "")
            # Auto-timestamp fields
            if h.strip().lower() in ["date", "request date"] and not value:
                value = current_time
            row_to_add.append(value)

        sheet.append_row(row_to_add)
        return {"status": "success", "added": new_row, "timestamp": current_time}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# =====================================================
# ✅ UPDATE EXISTING ROW
# =====================================================
def update_row(sheet_name, row_index, updated_data):
    """
    Updates specific columns in a given row (by index).
    - sheet_name: the tab name in the Google Sheet
    - row_index: the 1-based row number (including header row)
    - updated_data: dictionary of {column_name: new_value}
    
    Example:
      update_row("Requests_Parts", 5, {"Status": "Completed", "Handled By": "John"})
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)

        # 🇩🇿 Algeria time
        algeria_tz = pytz.timezone("Africa/Algiers")
        current_time = datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

        # Loop through headers, find matching columns
        for col_name, new_value in updated_data.items():
            if col_name in headers:
                col_index = headers.index(col_name) + 1  # gspread is 1-based
                # Auto-fill Completion Date when Status changes to "Completed"
                if col_name.lower() == "status" and new_value.lower() == "completed":
                    if "Completion Date" in headers:
                        date_col = headers.index("Completion Date") + 1
                        sheet.update_cell(row_index, date_col, current_time)
                sheet.update_cell(row_index, col_index, new_value)

        return {
            "status": "success",
            "message": f"Row {row_index} updated successfully in {sheet_name}.",
            "updated_fields": updated_data
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
