import os
import json
import base64
import io
import pickle
import gspread
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import Request
from flask import jsonify
from datetime import datetime
import pytz

# =====================================================
#  ✅  Load Google OAuth Token (from environment variable)
# =====================================================
TOKEN_B64 = os.environ.get("GOOGLE_OAUTH_TOKEN_B64")
if TOKEN_B64:
    try:
        with open("token.pickle", "wb") as f:
            f.write(base64.b64decode(TOKEN_B64))
    except Exception as e:
        print(f"Error decoding token: {e}")

# =====================================================
#  ✅  Authorize Google Drive using OAuth token.pickle
# =====================================================
creds = None
if os.path.exists("token.pickle"):
    try:
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
    except Exception as e:
        print(f"Error loading token.pickle: {e}")

if creds and creds.expired and creds.refresh_token:
    try:
        creds.refresh(Request())
    except Exception as e:
        print(f"Error refreshing token: {e}")

# Build Drive service (OAuth)
drive_service = build("drive", "v3", credentials=creds)

# =====================================================
#  ✅  Google Sheets access (still uses service account)
# =====================================================
service_account_info = json.loads(os.environ["GOOGLE_CREDENTIALS"])
service_account_info["private_key"] = service_account_info["private_key"].replace("\\\\\\\\n", "\\\\n")

sheet_creds = Credentials.from_service_account_info(
    service_account_info,
    scopes=[
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
)
client = gspread.authorize(sheet_creds)

# =====================================================
#  ✅  Your Google Sheet ID and Drive Folders
# =====================================================
SPREADSHEET_ID = "1j5PbpbLeQFVxofnO69BlluIw851-LZtOCV5HM4NhNOM"
FOLDER_A_ID = "1LXuX4GDaIPsnc0F5yizlL5znfMl22RnD"  # Main photo folder
FOLDERAID_MACHINERY_DOCS = '1NPywJrjTCvobQetVqoGg7V4AbhLcfAXf'  # Machinery Documents folder
FOLDERAID_OPERATORS = '1PRg64C-cG7s1ok31BCaUybJwY68O2t3u'  # Operators folder

# =====================================================
#  ✅  Utility: Current Algeria Time
# =====================================================
def get_current_time():
    algeria_tz = pytz.timezone("Africa/Algiers")
    return datetime.now(algeria_tz).strftime("%Y-%m-%d %H:%M:%S")

# =====================================================
#  ✅  Utility: Upload Base64 image to Google Drive
# =====================================================
def save_image_to_drive(base64_string, filename, subfolder_name):
    try:
        if not base64_string or not isinstance(base64_string, str) or "base64," not in base64_string:
            return ""

        # Ensure subfolder exists
        query = f"'{FOLDER_A_ID}' in parents and name='{subfolder_name}' and mimeType='application/vnd.google-apps.folder'"
        results = drive_service.files().list(q=query, fields="files(id)").execute()
        
        if results["files"]:
            subfolder_id = results["files"][0]["id"]
        else:
            metadata = {
                "name": subfolder_name,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": [FOLDER_A_ID]
            }
            subfolder = drive_service.files().create(body=metadata, fields="id").execute()
            subfolder_id = subfolder["id"]

        # Decode image and upload
        img_data = base64.b64decode(base64_string.split("base64,")[-1])
        file_stream = io.BytesIO(img_data)
        
        file_metadata = {"name": filename, "parents": [subfolder_id]}
        media = MediaIoBaseUpload(file_stream, mimetype="image/jpeg", resumable=True)
        
        uploaded_file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id"
        ).execute()

        # Make public
        drive_service.permissions().create(
            fileId=uploaded_file["id"],
            body={"type": "anyone", "role": "reader"}
        ).execute()

        return f"https://drive.google.com/uc?id={uploaded_file['id']}"
    except Exception as e:
        print(f"Upload Error: {str(e)}")
        return f"ERROR_UPLOAD"

# =====================================================
#  ✅  NEW: Upload PDF to Google Drive
# =====================================================
def save_pdf_to_drive(base64_string, filename, parent_folder_id):
    """
    Upload Base64 PDF to Google Drive
    
    Args:
        base64_string: Base64 encoded PDF string
        filename: Name for the uploaded file
        parent_folder_id: Google Drive folder ID where file will be stored
    
    Returns:
        Google Drive shareable link or empty string on error
    """
    try:
        if not base64_string or 'base64,' not in base64_string:
            print("Invalid base64 string")
            return ""
        
        # Decode PDF data
        pdf_data = base64.b64decode(base64_string.split('base64,')[-1])
        file_stream = io.BytesIO(pdf_data)
        
        # Prepare file metadata
        file_metadata = {
            'name': filename,
            'parents': [parent_folder_id]
        }
        
        # Upload to Drive
        media = MediaIoBaseUpload(file_stream, mimetype='application/pdf', resumable=True)
        uploaded_file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        
        # Make file publicly readable
        drive_service.permissions().create(
            fileId=uploaded_file['id'],
            body={'type': 'anyone', 'role': 'reader'}
        ).execute()
        
        # Return viewable link
        file_link = f"https://drive.google.com/file/d/{uploaded_file['id']}/view"
        print(f"PDF uploaded successfully: {filename} -> {file_link}")
        return file_link
        
    except Exception as e:
        print(f"PDF Upload Error: {str(e)}")
        return ""

# =====================================================
#  ✅  NEW: Delete File from Google Drive
# =====================================================
def delete_file_from_drive(file_url):
    """
    Delete a file from Google Drive using its shareable URL
    
    Args:
        file_url: Google Drive file URL (e.g., https://drive.google.com/file/d/FILE_ID/view)
    
    Returns:
        True if deleted successfully, False otherwise
    """
    try:
        if not file_url or 'drive.google.com' not in file_url:
            return False
        
        # Extract file ID from URL
        # URL format: https://drive.google.com/file/d/FILE_ID/view or https://drive.google.com/uc?id=FILE_ID
        if '/file/d/' in file_url:
            file_id = file_url.split('/file/d/')[1].split('/')[0]
        elif 'id=' in file_url:
            file_id = file_url.split('id=')[1].split('&')[0]
        else:
            print(f"Cannot extract file ID from URL: {file_url}")
            return False
        
        # Delete file
        drive_service.files().delete(fileId=file_id).execute()
        print(f"File deleted successfully: {file_id}")
        return True
        
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return False

# =====================================================
#  ✅  Copy to Maintenance_Log
# =====================================================
def copy_to_maintenance_log(source_sheet, data):
    """
    NOTE: This function is kept for potential future use or for other sheets,
    but it is NO LONGER called automatically for Cleaning_Log submissions.
    """
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
        
        row_to_add = [new_row.get(h, "") for h in headers]
        maintenance.append_row(row_to_add)
        return {"status": "success", "copied_to": "Maintenance_Log"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to copy: {e}"}

# =====================================================
#  ✅  Get Sheet Data
# =====================================================
def get_sheet_data(sheet_name):
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        rows = sheet.get_all_records()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)})

# =====================================================
#  ✅  Append Row (Add) - UPDATED FOR CHECKLIST & SUIVI
# =====================================================
def append_row(sheet_name, new_row):
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)
        current_time = get_current_time()

        # ---------------------------------------------------
        #  SPECIAL LOGIC: Checklist_Log (Nested JSON Photos)
        # ---------------------------------------------------
        if sheet_name == "Checklist_Log" and "Checklist Data" in new_row:
            try:
                # 1. Parse the JSON string coming from frontend
                checklist_data = json.loads(new_row["Checklist Data"])
                
                # 2. Iterate through items to find photos
                # Structure: { "item_id": { "status": "...", "photo": "data:image..." } }
                for item_key, item_val in checklist_data.items():
                    if isinstance(item_val, dict) and "photo" in item_val:
                        photo_data = item_val["photo"]
                        
                        # If it is a Base64 string, upload it
                        if photo_data and isinstance(photo_data, str) and photo_data.startswith("data:image"):
                            filename = f"Checklist_{new_row.get('Plate Number', 'Unknown')}_{item_key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                            uploaded_url = save_image_to_drive(photo_data, filename, "Checklist_Log")
                            
                            # Replace the massive Base64 string with the URL
                            item_val["photo"] = uploaded_url
                
                # 3. Pack the clean data back into JSON string
                new_row["Checklist Data"] = json.dumps(checklist_data)
                
            except Exception as e:
                print(f"Checklist Photo Processing Error: {e}")
                # We continue even if photo processing fails, though sheet might reject if too large

        # ---------------------------------------------------
        #  STANDARD LOGIC: Top-level Photos (Maintenance, Cleaning)
        # ---------------------------------------------------
        else:
            for key in list(new_row.keys()):
                if "Photo" in key and isinstance(new_row[key], str) and new_row[key].startswith("data:image"):
                    filename = f"{sheet_name}_{key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                    new_row[key] = save_image_to_drive(new_row[key], filename, sheet_name)

        # ---------------------------------------------------
        #  NEW: SPECIAL LOGIC for Suivi Sheet - PDF Documents
        # ---------------------------------------------------
        if sheet_name == "Suivi":
            plate_number = new_row.get('Plate Number', 'Unknown')
            driver1_name = new_row.get('Driver 1', 'Unknown').replace(' ', '_')
            driver2_name = new_row.get('Driver 2', 'Unknown').replace(' ', '_')
            
            # Handle Machinery Documents PDF
            if 'Documents' in new_row and isinstance(new_row['Documents'], str) and new_row['Documents'].startswith('data:application/pdf'):
                filename = f"Machinery_{plate_number}_Documents.pdf"
                new_row['Documents'] = save_pdf_to_drive(new_row['Documents'], filename, FOLDERAID_MACHINERY_DOCS)
            
            # Handle Driver 1 Documents PDF
            if 'Driver 1 Doc' in new_row and isinstance(new_row['Driver 1 Doc'], str) and new_row['Driver 1 Doc'].startswith('data:application/pdf'):
                filename = f"Driver1_{driver1_name}_{plate_number}.pdf"
                new_row['Driver 1 Doc'] = save_pdf_to_drive(new_row['Driver 1 Doc'], filename, FOLDERAID_OPERATORS)
            
            # Handle Driver 2 Documents PDF
            if 'Driver 2 Doc' in new_row and isinstance(new_row['Driver 2 Doc'], str) and new_row['Driver 2 Doc'].startswith('data:application/pdf'):
                filename = f"Driver2_{driver2_name}_{plate_number}.pdf"
                new_row['Driver 2 Doc'] = save_pdf_to_drive(new_row['Driver 2 Doc'], filename, FOLDERAID_OPERATORS)

        # ---------------------------------------------------
        #  Write to Sheet
        # ---------------------------------------------------
        row_to_add = []
        for h in headers:
            value = new_row.get(h, "")
            # Auto-fill timestamps if empty
            if h.strip().lower() in ["date", "request date", "timestamp"] and not value:
                value = current_time
            row_to_add.append(value)

        sheet.append_row(row_to_add)

        # ---------------------------------------------------
        #  NEW: Auto-copy Suivi data to Equipment_List sheet (DYNAMIC MAPPING)
        # ---------------------------------------------------
        if sheet_name == "Suivi":
            try:
                equipment_sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Equipment_List")
                eq_headers = equipment_sheet.row_values(1)
                
                # Get machinery type mapping dynamically from Machinery_Types sheet
                machinery_types_sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Machinery_Types")
                machinery_types_data = machinery_types_sheet.get_all_records()
                
                # Build mapping dictionary from sheet data
                machinery_to_equipment_type = {}
                for row in machinery_types_data:
                    english_name = row.get('English', '')
                    equipment_mapping = row.get('Equipment_Type_Mapping', '')
                    if english_name and equipment_mapping:
                        machinery_to_equipment_type[english_name] = equipment_mapping
                
                # Map Suivi data to Equipment_List structure
                machinery_type = new_row.get('Machinery', '')
                equipment_type = machinery_to_equipment_type.get(machinery_type, '')
                
                equipment_row = {
                    'Status': new_row.get('Status', ''),
                    'Equipment Type': equipment_type,
                    'Model / Type': new_row.get('Model / Type', ''),
                    'Plate Number': new_row.get('Plate Number', ''),
                    'Driver 1': new_row.get('Driver 1', ''),
                    'Driver 2': new_row.get('Driver 2', ''),
                    'Notes': ''
                }
                
                # Prepare row in correct column order
                eq_row_to_add = [equipment_row.get(h, '') for h in eq_headers]
                
                # Append to Equipment_List
                equipment_sheet.append_row(eq_row_to_add)
                print(f"Auto-copied to Equipment_List: {plate_number}")
                
            except Exception as e:
                print(f"Auto-copy to Equipment_List failed: {str(e)}")
                # Continue execution even if auto-copy fails

        return {"status": "success", "added": new_row, "timestamp": current_time}

    except Exception as e:
        return {"status": "error", "message": str(e)}

# =====================================================
#  ✅  Update Row (Edit) - UPDATED FOR SUIVI PDF REPLACEMENT
# =====================================================
def update_row(sheet_name, row_index, updated_data):
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        headers = sheet.row_values(1)
        
        # Get existing data to merge
        existing = sheet.row_values(row_index)
        # Pad existing row if shorter than headers
        if len(existing) < len(headers):
            existing += [""] * (len(headers) - len(existing))
            
        current_row = dict(zip(headers, existing))

        # Upload Base64 photos if included
        for key, value in updated_data.items():
            if "Photo" in key and isinstance(value, str) and value.startswith("data:image"):
                filename = f"{sheet_name}_{key}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                updated_data[key] = save_image_to_drive(value, filename, sheet_name)

        # ---------------------------------------------------
        #  NEW: Handle PDF uploads and replacements for Suivi sheet
        # ---------------------------------------------------
        if sheet_name == "Suivi":
            plate_number = updated_data.get('Plate Number') or current_row.get('Plate Number', 'Unknown')
            driver1_name = (updated_data.get('Driver 1') or current_row.get('Driver 1', 'Unknown')).replace(' ', '_')
            driver2_name = (updated_data.get('Driver 2') or current_row.get('Driver 2', 'Unknown')).replace(' ', '_')
            
            # Handle Machinery Documents replacement
            if 'Documents' in updated_data and isinstance(updated_data['Documents'], str):
                if updated_data['Documents'].startswith('data:application/pdf'):
                    # Delete old file if exists
                    old_doc_url = current_row.get('Documents', '')
                    if old_doc_url:
                        delete_file_from_drive(old_doc_url)
                    
                    # Upload new file
                    filename = f"Machinery_{plate_number}_Documents.pdf"
                    updated_data['Documents'] = save_pdf_to_drive(updated_data['Documents'], filename, FOLDERAID_MACHINERY_DOCS)
            
            # Handle Driver 1 Documents replacement
            if 'Driver 1 Doc' in updated_data and isinstance(updated_data['Driver 1 Doc'], str):
                if updated_data['Driver 1 Doc'].startswith('data:application/pdf'):
                    # Delete old file
                    old_doc_url = current_row.get('Driver 1 Doc', '')
                    if old_doc_url:
                        delete_file_from_drive(old_doc_url)
                    
                    # Upload new file
                    filename = f"Driver1_{driver1_name}_{plate_number}.pdf"
                    updated_data['Driver 1 Doc'] = save_pdf_to_drive(updated_data['Driver 1 Doc'], filename, FOLDERAID_OPERATORS)
            
            # Handle Driver 2 Documents replacement
            if 'Driver 2 Doc' in updated_data and isinstance(updated_data['Driver 2 Doc'], str):
                if updated_data['Driver 2 Doc'].startswith('data:application/pdf'):
                    # Delete old file
                    old_doc_url = current_row.get('Driver 2 Doc', '')
                    if old_doc_url:
                        delete_file_from_drive(old_doc_url)
                    
                    # Upload new file
                    filename = f"Driver2_{driver2_name}_{plate_number}.pdf"
                    updated_data['Driver 2 Doc'] = save_pdf_to_drive(updated_data['Driver 2 Doc'], filename, FOLDERAID_OPERATORS)

        # Merge updated fields
        for key, value in updated_data.items():
            current_row[key] = value

        # Handle "Completed" logic for Maintenance
        if "Status" in headers and updated_data.get("Status", "").lower() == "completed":
            completion_date = get_current_time()
            if "Completion Date" in headers:
                current_row["Completion Date"] = completion_date

        updated_row_values = [current_row.get(h, "") for h in headers]
        
        # Update specific row
        sheet.update(range_name=f"A{row_index}:Z{row_index}", values=[updated_row_values])

        return {"status": "success", "updated": current_row}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# =====================================================
#  ✅  Delete Row - UPDATED FOR SUIVI FILE DELETION
# =====================================================
def delete_row(sheet_name, row_index):
    """
    Delete a row from the sheet and associated files from Drive
    
    Args:
        sheet_name: Name of the Google Sheet
        row_index: Row number to delete (1-indexed)
    
    Returns:
        JSON response with status
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet(sheet_name)
        
        # For Suivi sheet, delete associated documents from Drive first
        if sheet_name == "Suivi":
            try:
                # Get the row data before deleting
                row_data = sheet.row_values(row_index)
                headers = sheet.row_values(1)
                row_dict = dict(zip(headers, row_data))
                
                # Delete documents if they exist
                doc_fields = ['Documents', 'Driver 1 Doc', 'Driver 2 Doc']
                for field in doc_fields:
                    doc_url = row_dict.get(field, '')
                    if doc_url:
                        delete_file_from_drive(doc_url)
                        print(f"Deleted {field}: {doc_url}")
                
            except Exception as e:
                print(f"Error deleting files from Drive: {str(e)}")
                # Continue with row deletion even if file deletion fails
        
        # Delete the row from the sheet
        sheet.delete_rows(row_index)
        
        return {"status": "success", "message": f"Row {row_index} deleted successfully"}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
