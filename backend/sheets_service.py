# backend/sheets_service.py
import os
import json
import gspread
from google.oauth2.service_account import Credentials

# Load creds from Render environment variable (or local service_account.json for local dev)
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

# Authenticate using the JSON stored in the environment variable GOOGLE_CREDENTIALS
# (Render: we store the service account JSON there). For local dev you could load from a file.
_service_account_json = os.environ.get("GOOGLE_CREDENTIALS")
if not _service_account_json:
    raise RuntimeError("GOOGLE_CREDENTIALS environment variable is not set")

_service_account_info = json.loads(_service_account_json)
# Ensure private key has correct newlines if it contains escaped \n
if "private_key" in _service_account_info and "\\n" in _service_account_info["private_key"]:
    _service_account_info["private_key"] = _service_account_info["private_key"].replace("\\n", "\n")

creds = Credentials.from_service_account_info(_service_account_info, scopes=SCOPES)
gc = gspread.authorize(creds)


def _open_worksheet_by_tab(sheet_name, tab_name):
    """
    Open a Google Sheet by its title (sheet_name) and return the worksheet object for tab_name.
    sheet_name is the name of the Google Sheet file (title shown in Drive).
    tab_name is the specific tab (worksheet) inside that file.
    """
    sh = gc.open(sheet_name)
    worksheet = sh.worksheet(tab_name)
    return worksheet


def read_tab(sheet_name, tab_name):
    """
    Return all rows from the given sheet tab as a list of dictionaries (header -> value).
    """
    worksheet = _open_worksheet_by_tab(sheet_name, tab_name)
    records = worksheet.get_all_records()  # returns list of dicts using first row as header
    return records


def add_row(sheet_name, tab_name, row_data):
    """
    Append a row to the sheet tab.
    - If row_data is a dict: it will write values in the order of the sheet header row (first row).
      Missing keys -> empty string.
    - If row_data is a list/tuple: it will append that row as-is.
    Returns the appended row index (1-based) or True on success.
    """
    worksheet = _open_worksheet_by_tab(sheet_name, tab_name)

    # If dict: align to header order
    if isinstance(row_data, dict):
        headers = worksheet.row_values(1)
        row = [row_data.get(h, "") for h in headers]
    elif isinstance(row_data, (list, tuple)):
        row = list(row_data)
    else:
        raise ValueError("row_data must be a dict or list")

    # Append row at bottom
    worksheet.append_row(row, value_input_option="USER_ENTERED")
    return True


def update_cell(sheet_name, tab_name, row, col, value):
    """
    Update a single cell (row and col are 1-based indices).
    Example: update_cell("Machinery_Maintenance_Data", "Requests_Parts", 3, 6, "Completed")
    """
    worksheet = _open_worksheet_by_tab(sheet_name, tab_name)
    worksheet.update_cell(row, col, value)
    return True
