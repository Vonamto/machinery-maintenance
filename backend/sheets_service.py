import os
import json
import base64
import io
import gspread
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
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
drive_service = build("drive", "v3", credentials=creds)

SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"

# ✅ Folder IDs
FOLDER_A_ID = "1LXuX4GDaIPsnc0F5yizlL5znfMl22RnD"
FOLDER_B_ID = "1gYBTgjuVC-7JxnOzkHJCtNM4HmcMm4dF"


# =====================================================
# ✅ Utility: Time in Algeria
# =====================================================
def get_current_time():
    algeria_tz = pytz.timezone("Africa/Algiers")
    return datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")


# =====================================================
# ✅ Utility: Check Drive folder size (simple approximation)
# =====================================================
def get_folder_size(folder_id):
    query = f"'{folder_id}' in parents and trashed=false"
    results = drive_service.files().list(q=query, fields="files(size)").execute()
    total = 0
    for f in results.get("files", []):
        total += int(f.get("size", 0))
    return total


# =====================================================
# ✅ Utility: Upload Base64 image to Drive
# =====================================================
def save_image_to_drive(base64_string, filename, subfolder_name):
    try:
        # Decide target folder (A or B)
        folder_id = FOLDER_A_ID
        size_a = get_folder_size(FOLDER_A_ID)
        if size_a > 13 * 1024 * 1024 * 1024:  # 13GB threshold
            folder_id = FOLDER_B_ID

        # Ensure subfolder exists
        query = f"'{folder_id}' in parents and name='{subfolder_name}' and mimeType='application/vnd.google-apps.folder'"
        results = drive_service.files().list(q=query, fields="files(id)").execute()
        if results["files"]:
            subfolder_id = results["files"][0]["id"]
        else:
            # Create subfolder
            metadata = {
                "name": subfolder_name,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": [folder_id]
            }
            subfolder = drive_service.files().create(body=metadata, fields="id").execute()
            subfolder_id = subfolder["id"]

        # Decode Base64 string
        img_data = base64.b64decode(base64_string.split(",")[-1])
        file_stream = io.BytesIO(img_data)

        file_metadata = {
            "name": filename,
            "parents": [subfolder_id]
        }

        media = MediaIoBaseUpload(file_stream, mimetype="image/jpeg", resumable=True)
        uploaded_file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id"
        ).execute()

        # Make public link
        drive_service.permissions().create(
            fileId=uploaded_file["id"],
            body={"type": "anyone", "role": "reader"}
        ).execute()

        file_url = f"https://drive.google.com/uc?id={uploaded_file['id']}"
        return file_url

    except Exception as e:
        return f"ERROR_UPLOAD: {str(e)}"


# =====================================================
# ✅ Copy to Maintenance_Log (same as before)
# =====================================================
def copy_to_maintenance_log(source_sheet, data):
    try:
        maintenance = client.open_by_key(SPREADSHEET_ID).worksheet("Maintenance_Log")
        headers = maintenance.row_values(1)
        current_time = get_current_time()

        new_row = {}

        if source_sheet == "Cleaning_Log":
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
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)
        current_time = get_current_time()

        # Upload any Base64 photos to Drive
        for key in list(new_row.keys()):
            if "Photo" in key and isinstance(new_row[key], str) and new_row[key].startswith("data:image"):
                filename = f"{sheet_name}_{key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                new_row[key] = save_image_to_drive(new_row[key], filename, sheet_name)

        # Auto timestamps
        row_to_add = []
        for h in headers:
            value = new_row.get(h, "")
            if h.strip().lower() in ["date", "request date"] and not value:
                value = current_time
            row_to_add.append(value)

        sheet.append_row(row_to_add)

        if sheet_name == "Cleaning_Log":
            copy_to_maintenance_log("Cleaning_Log", new_row)

        return {"status": "success", "added": new_row, "timestamp": current_time}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# =====================================================
# ✅ Update Row (Edit)
# =====================================================
def update_row(sheet_name, row_index, updated_data):
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)

        existing = sheet.row_values(row_index)
        current_row = dict(zip(headers, existing))

        # Upload Base64 photos to Drive if included
        for key, value in updated_data.items():
            if "Photo" in key and isinstance(value, str) and value.startswith("data:image"):
                filename = f"{sheet_name}_{key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                updated_data[key] = save_image_to_drive(value, filename, sheet_name)

        # Merge updates
        for key, value in updated_data.items():
            current_row[key] = value

        # Handle completion date logic
        if "Status" in headers and updated_data.get("Status", "").lower() == "completed":
            completion_date = get_current_time()
            if "Completion Date" in headers:
                current_row["Completion Date"] = completion_date
            copy_to_maintenance_log(sheet_name, current_row)

        updated_row = [current_row.get(h, "") for h in headers]
        sheet.update(f"A{row_index}:Z{row_index}", [updated_row])

        return {"status": "success", "updated": current_row}

    except Exception as e:
        return {"status": "error", "message": str(e)}
