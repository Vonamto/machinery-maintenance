import os
import json
import gspread
from google.oauth2.service_account import Credentials
from flask import jsonify
from datetime import datetime
import pytz

# =====================================================
# ✅ Google Service Account Authorization
# =====================================================
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

# ✅ Your Google Sheet ID
SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"

# =====================================================
# ✅ Utility: Get current Algeria time
# =====================================================
def get_current_time():
    algeria_tz = pytz.timezone("Africa/Algiers")
    return datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

# =====================================================
# ✅ Utility: Copy data to Maintenance_Log
# =====================================================
def copy_to_maintenance_log(source_sheet, data):
    """
    Copies a cleaned-up version of the record into Maintenance_Log,
    depending on whether it came from Cleaning_Log or Grease_Oil_Requests.
    """

    try:
        maintenance = client.open_by_key(SPREADSHEET_ID).worksheet("Maintenance_Log")
        headers = maintenance.row_values(1)
        algeria_tz = pytz.timezone("Africa/Algiers")
        current_time = datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

        new_row = {}

        if source_sheet == "Cleaning_Log":
            # Map Cleaning_Log → Maintenance_Log
            new_row = {
                "Date": data.get("Date", current_time),
                "Model / Type": data.get("Model / Type", ""),
                "Plate Number": data.get("Plate Number", ""),
                "Driver": data.get("Driver", ""),
                "Description of Work": data.get("Cleaning Type", ""),
                "Performed By": data.get("Cleaned By", ""),
                "Comments": data.get("Comments", ""),
                "Photo Before": data.get("Photo Before", ""),
                "Photo After": data.get("Photo After", "")
            }

        elif source_sheet == "Grease_Oil_Requests":
            # Map Grease/Oil → Maintenance_Log
            new_row = {
                "Date": data.get("Request Date", current_time),
                "Model / Type": data.get("Model / Type", ""),
                "Plate Number": data.get("Plate Number", ""),
                "Driver": data.get("Driver", ""),
                "Description of Work": data.get("Request Type", ""),
                "Performed By": data.get("Handled By", ""),
                "Status": data.get("Status", "Completed"),
                "Completion Date": data.get("Completion Date", current_time),
                "Comments": data.get("Comments", ""),
                "Photo Before": data.get("Photo Before", ""),
                "Photo After": data.get("Photo After", "")
            }

        # Arrange according to Maintenance_Log headers
        row_to_add = [new_row.get(h, "") for h in headers]
        maintenance.append_row(row_to_add)
        return {"status": "success", "copied_to": "Maintenance_Log"}

    except Exception as e:
        return {"status": "error", "message": f"Failed to copy to Maintenance_Log: {e}"}


# =====================================================
# ✅ Get Sheet Data
# =====================================================
def get_sheet_data(sheet_name):
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        rows = sheet.get_all_records()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)})


# =====================================================
# ✅ Append Row (Add)
# =====================================================
def append_row(sheet_name, new_row):
    """
    Adds a new row to the given sheet.
    Automatically timestamps 'Date' or 'Request Date'.
    For Cleaning_Log, auto-copies to Maintenance_Log.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)
        current_time = get_current_time()

        # Auto-fill timestamps
        row_to_add = []
        for h in headers:
            value = new_row.get(h, "")
            if h.strip().lower() in ["date", "request date"] and not value:
                value = current_time
            row_to_add.append(value)

        # Add new row
        sheet.append_row(row_to_add)

        # Auto-copy for Cleaning_Log only
        if sheet_name == "Cleaning_Log":
            copy_to_maintenance_log("Cleaning_Log", new_row)

        return {"status": "success", "added": new_row, "timestamp": current_time}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# =====================================================
# ✅ Update Row (Edit)
# =====================================================
def update_row(sheet_name, row_index, updated_data):
    """
    Updates an existing row by index (1-based).
    Auto-fills completion date if status is 'Completed'.
    Auto-copies Grease/Oil entry to Maintenance_Log on completion.
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)

        # Fetch the current row data
        existing = sheet.row_values(row_index)
        current_row = dict(zip(headers, existing))

        # Merge updated fields
        for key, value in updated_data.items():
            current_row[key] = value

        # Auto-fill completion date if applicable
        if "Status" in headers and updated_data.get("Status", "").lower() == "completed":
            algeria_tz = pytz.timezone("Africa/Algiers")
            completion_date = datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")
            if "Completion Date" in headers:
                current_row["Completion Date"] = completion_date

            # ✅ Auto-copy to Maintenance_Log when completed
            copy_to_maintenance_log(sheet_name, current_row)

        # Write back to Google Sheet
        updated_row = [current_row.get(h, "") for h in headers]
        sheet.update(f"A{row_index}:Z{row_index}", [updated_row])

        return {"status": "success", "updated": current_row}

    except Exception as e:
        return {"status": "error", "message": str(e)}
