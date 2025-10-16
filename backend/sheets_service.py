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

# ✅ Your spreadsheet ID
SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"


# =====================================================
# ✅ Get all rows from a sheet
# =====================================================
def get_sheet_data(sheet_name):
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        rows = sheet.get_all_records()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)})


# =====================================================
# ✅ Append row with auto timestamp
# =====================================================
def append_row(sheet_name, new_row):
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)

        # ✅ Determine Algeria time (UTC+1)
        algeria_tz = pytz.timezone("Africa/Algiers")
        current_time = datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

        row_to_add = []
        for h in headers:
            value = new_row.get(h, "")
            if h.strip().lower() in ["date", "request date"] and not value:
                value = current_time
            row_to_add.append(value)

        sheet.append_row(row_to_add)
        return {"status": "success", "added": new_row, "timestamp": current_time}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# =====================================================
# ✅ Update row (PUT) + Auto Copy Logic
# =====================================================
def update_row(sheet_name, row_index, updated_data):
    try:
        sh = client.open_by_key(SPREADSHEET_ID)
        sheet = sh.worksheet(sheet_name)
        headers = sheet.row_values(1)

        # ✅ Convert updated_data keys to exact header match
        row_values = sheet.row_values(row_index)
        updated_row = dict(zip(headers, row_values))

        # ✅ Apply updates
        for key, value in updated_data.items():
            if key in updated_row:
                updated_row[key] = value

        # ✅ Auto-fill completion date if completed
        if "Status" in updated_row and updated_row["Status"].lower() == "completed":
            if "Completion Date" in headers:
                algeria_tz = pytz.timezone("Africa/Algiers")
                updated_row["Completion Date"] = datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

        # ✅ Update the row in the original sheet
        row_to_write = [updated_row.get(h, "") for h in headers]
        sheet.update(f"A{row_index}:", [row_to_write])

        # ✅ Auto-copy completed records to Maintenance_Log
        if updated_row.get("Status", "").lower() == "completed":
            if sheet_name in ["Grease_Oil_Requests", "Cleaning_Log"]:
                maintenance_sheet = sh.worksheet("Maintenance_Log")
                maintenance_headers = maintenance_sheet.row_values(1)
                maintenance_row = {}

                if sheet_name == "Grease_Oil_Requests":
                    mapping = {
                        "Request Date": "Date",
                        "Model / Type": "Model / Type",
                        "Plate Number": "Plate Number",
                        "Driver": "Driver",
                        "Request Type": "Description of Work",
                        "Status": "Status",
                        "Completion Date": "Completion Date",
                        "Handled By": "Performed By",
                        "Comments": "Comments",
                        "Photo Before": "Photo Before",
                        "Photo After": "Photo After"
                    }
                else:  # Cleaning_Log
                    mapping = {
                        "Date": "Date",
                        "Model / Type": "Model / Type",
                        "Plate Number": "Plate Number",
                        "Driver": "Driver",
                        "Cleaned By": "Performed By",
                        "Cleaning Type": "Description of Work",
                        "Comments": "Comments",
                        "Photo Before": "Photo Before",
                        "Photo After": "Photo After"
                    }

                # ✅ Build mapped row
                for src, dest in mapping.items():
                    if dest in maintenance_headers:
                        maintenance_row[dest] = updated_row.get(src, "")

                # ✅ Append to Maintenance_Log
                maintenance_row_to_add = [maintenance_row.get(h, "") for h in maintenance_headers]
                maintenance_sheet.append_row(maintenance_row_to_add)

        return {
            "status": "success",
            "message": f"Row {row_index} updated successfully in {sheet_name}.",
            "updated_fields": updated_data
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
