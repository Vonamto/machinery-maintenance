from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from sheets_service import get_sheet_data, append_row, update_row
from auth_service import authenticate_user, verify_token

# 🔐 Centralized permissions
from permissions import SHEET_PERMISSIONS

app = Flask(__name__)

# =====================================================
# ✅ CORS (ENV-based, PROD + PREVIEW SAFE)
# =====================================================
CORS(
    app,
    origins=os.environ.get("FRONTEND_URL", "*").split(","),
    supports_credentials=True
)

# =====================================================
# ✅ Root route (for test)
# =====================================================
@app.route("/")
def home():
    return jsonify({"message": "Backend connected successfully"}), 200


# =====================================================
# ✅ JWT Protection decorator
# =====================================================
def require_token(func):
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"status": "error", "message": "Missing token"}), 401

        token = token.replace("Bearer ", "")
        decoded = verify_token(token)
        if not decoded:
            return jsonify({"status": "error", "message": "Invalid or expired token"}), 401

        request.user = decoded
        return func(*args, **kwargs)

    wrapper.__name__ = func.__name__
    return wrapper


# =====================================================
# ✅ Helper: Role Permission Checker
# =====================================================
def check_permission(sheet_name, action):
    role = request.user.get("role")
    allowed_roles = SHEET_PERMISSIONS.get(sheet_name, {}).get(action, [])

    if role not in allowed_roles:
        return jsonify({
            "status": "error",
            "message": f"Access denied: {role} cannot {action} in {sheet_name}"
        }), 403

    return None


# =====================================================
# ✅ LOGIN
# =====================================================
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username") or data.get("Username")
    password = data.get("password") or data.get("Password")
    return authenticate_user(username, password)


# =====================================================
# ✅ TEST Protected Endpoint
# =====================================================
@app.route("/api/protected", methods=["GET"])
@require_token
def protected():
    return jsonify({"status": "success", "user": request.user})


# =====================================================
# ✅ Public-safe endpoint for dropdowns
# =====================================================
@app.route("/api/usernames", methods=["GET"])
@require_token
def get_usernames():
    from sheets_service import client, SPREADSHEET_ID
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Users")
        records = sheet.get_all_records()
        return jsonify([
            {
                "Name": r.get("Full Name") or r.get("Name"),
                "Role": r.get("Role")
            }
            for r in records
            if r.get("Full Name") or r.get("Name")
        ])
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ Fetch Machinery Types for dropdowns
# =====================================================
@app.route('/api/machinery-types', methods=['GET'])
@require_token
def get_machinery_types():
    try:
        from sheets_service import client, SPREADSHEET_ID
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet('Machinery_Types')
        records = sheet.get_all_records()
        machinery_types = [
            {
                'english': r.get('English', ''),
                'arabic': r.get('Arabic', ''),
                'mapping': r.get('Equipment_Type_Mapping', '')
            }
            for r in records if r.get('English')
        ]
        return jsonify(machinery_types)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# =====================================================
# ✅ Fetch Suivi data (alias for consistency)
# =====================================================
@app.route('/api/suivi', methods=['GET'])
@require_token
def get_suivi():
    check = check_permission('Suivi', 'view')
    if check:
        return check
    return get_sheet_data('Suivi')


# =====================================================
# ✅ VIEW
# =====================================================
@app.route("/api/<sheet_name>", methods=["GET"])
@require_token
def get_data(sheet_name):
    aliases = {
        "users": "Users"
    }
    sheet_key = aliases.get(sheet_name.lower(), sheet_name)

    check = check_permission(sheet_key, "view")
    if check:
        return check

    return get_sheet_data(sheet_key)


# =====================================================
# ✅ ADD
# =====================================================
@app.route("/api/add/<sheet_name>", methods=["POST"])
@require_token
def add_row_api(sheet_name):
    check = check_permission(sheet_name, "add")
    if check:
        return check

    new_row = request.get_json() or {}
    return jsonify(append_row(sheet_name, new_row))


# =====================================================
# ✅ EDIT
# =====================================================
@app.route("/api/edit/<sheet_name>/<int:row_index>", methods=["PUT"])
@require_token
def edit_row(sheet_name, row_index):
    check = check_permission(sheet_name, "edit")
    if check:
        return check

    try:
        updated_data = request.get_json() or {}
        return jsonify(update_row(sheet_name, row_index, updated_data))
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# ✅ DELETE (fully centralized)
# =====================================================
@app.route("/api/delete/<sheet_name>/<int:row_index>", methods=["DELETE"])
@require_token
def delete_row_api(sheet_name, row_index):
    from sheets_service import delete_row

    check = check_permission(sheet_name, "delete")
    if check:
        return check

    try:
        return jsonify(delete_row(sheet_name, row_index))
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# =====================================================
# 🆕 HSE: Restock — Add received PPE to stock
# =====================================================
@app.route('/api/hse/restock', methods=['POST'])
@require_token
def hse_restock():
    check = check_permission('PPE_Stock', 'add')
    if check:
        return check

    data = request.get_json() or {}
    ppe_type = data.get('PPE_Type', '').strip()
    size = str(data.get('Size', '')).strip()
    added_by = data.get('Added_by', '').strip()
    try:
        quantity = int(data.get('Quantity', 0))
    except (ValueError, TypeError):
        return jsonify({'status': 'error', 'message': 'Invalid quantity'}), 400

    if not ppe_type or quantity <= 0:
        return jsonify({'status': 'error', 'message': 'PPE type and positive quantity are required'}), 400

    from sheets_service import client, SPREADSHEET_ID, get_current_time
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet('PPE_Stock')
        records = sheet.get_all_records()
        headers = sheet.row_values(1)
        col_letter = chr(64 + len(headers))
        current_time = get_current_time()

        # If this PPE type + size already exists, add to it
        for idx, row in enumerate(records, start=2):
            if row.get('PPE_Type', '').strip() == ppe_type and str(row.get('Size', '')).strip() == size:
                new_qty = int(row.get('Quantity', 0)) + quantity
                existing = sheet.row_values(idx)
                if len(existing) < len(headers):
                    existing += [''] * (len(headers) - len(existing))
                row_dict = dict(zip(headers, existing))
                row_dict['Quantity'] = new_qty
                row_dict['Last_Updated'] = current_time
                row_dict['Added_by'] = added_by
                sheet.update(
                    range_name=f'A{idx}:{col_letter}{idx}',
                    values=[[row_dict.get(h, '') for h in headers]]
                )
                return jsonify({'status': 'success', 'new_quantity': new_qty, 'action': 'updated'})

        # If not found — create a new row
        new_row = {h: '' for h in headers}
        new_row['PPE_Type'] = ppe_type
        new_row['Size'] = size
        new_row['Quantity'] = quantity
        new_row['Last_Updated'] = current_time
        new_row['Added_by'] = added_by
        sheet.append_row([new_row.get(h, '') for h in headers])
        return jsonify({'status': 'success', 'new_quantity': quantity, 'action': 'created'})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# =====================================================
# 🆕 HSE: Distribute — Issue PPE to a worker
# =====================================================
@app.route('/api/hse/distribute', methods=['POST'])
@require_token
def hse_distribute():
    check = check_permission('PPE_Distribution_Log', 'add')
    if check:
        return check

    data = request.get_json() or {}
    ppe_type = data.get('PPE_Type', '').strip()
    size = str(data.get('Size', '')).strip()
    worker_name = data.get('Worker_Name', '').strip()
    worker_position = data.get('Worker_Position', '').strip()
    notes = data.get('Notes', '').strip()
    try:
        quantity = int(data.get('Quantity', 1))
    except (ValueError, TypeError):
        return jsonify({'status': 'error', 'message': 'Invalid quantity'}), 400

    if not ppe_type or not worker_name or quantity <= 0:
        return jsonify({'status': 'error', 'message': 'PPE type, worker name, and positive quantity are required'}), 400

    from sheets_service import client, SPREADSHEET_ID, get_current_time
    try:
        current_time = get_current_time()

        # --- Step 1: Find stock row and check quantity ---
        stock_sheet = client.open_by_key(SPREADSHEET_ID).worksheet('PPE_Stock')
        stock_records = stock_sheet.get_all_records()
        stock_headers = stock_sheet.row_values(1)
        col_letter = chr(64 + len(stock_headers))

        stock_row_idx = None
        current_qty = 0
        for idx, row in enumerate(stock_records, start=2):
            if row.get('PPE_Type', '').strip() == ppe_type and str(row.get('Size', '')).strip() == size:
                stock_row_idx = idx
                current_qty = int(row.get('Quantity', 0))
                break

        if stock_row_idx is None:
            label = ppe_type + (f' size {size}' if size else '')
            return jsonify({'status': 'error', 'message': f'No stock found for {label}. Please add stock first.'}), 400

        if current_qty < quantity:
            return jsonify({'status': 'error', 'message': f'Not enough stock. Only {current_qty} available.'}), 400

        # --- Step 2: Deduct from stock ---
        new_qty = current_qty - quantity
        existing = stock_sheet.row_values(stock_row_idx)
        if len(existing) < len(stock_headers):
            existing += [''] * (len(stock_headers) - len(existing))
        row_dict = dict(zip(stock_headers, existing))
        row_dict['Quantity'] = new_qty
        row_dict['Last_Updated'] = current_time
        stock_sheet.update(
            range_name=f'A{stock_row_idx}:{col_letter}{stock_row_idx}',
            values=[[row_dict.get(h, '') for h in stock_headers]]
        )

        # --- Step 3: Log the distribution ---
        log_sheet = client.open_by_key(SPREADSHEET_ID).worksheet('PPE_Distribution_Log')
        log_headers = log_sheet.row_values(1)
        given_by = request.user.get('full_name') or request.user.get('username', '')
        log_row = {
            'Date': current_time,
            'Worker_Name': worker_name,
            'Worker_Position': worker_position,
            'PPE_Type': ppe_type,
            'Size': size,
            'Quantity': quantity,
            'Given_By': given_by,
            'Notes': notes
        }
        log_sheet.append_row([log_row.get(h, '') for h in log_headers])

        return jsonify({
            'status': 'success',
            'remaining_stock': new_qty,
            'message': f'PPE issued successfully. Remaining stock: {new_qty}'
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# =====================================================
# ✅ HSE: Delete distribution log entry
#
# PPE_Stock is a pure restock ledger — it is NEVER
# decremented when PPE is distributed (the frontend
# uses /api/add/PPE_Distribution_Log for that).
# Available stock is computed on the frontend as:
#   available = sum(PPE_Stock.Quantity)
#             - sum(PPE_Distribution_Log.Quantity)
# Deleting a log entry already reduces distributed
# total so available goes up automatically.
# We must NOT touch PPE_Stock here at all.
# =====================================================
@app.route('/api/hse/delete-distribution/<int:row_index>', methods=['DELETE'])
@require_token
def hse_delete_distribution(row_index):
    check = check_permission('PPE_Distribution_Log', 'delete')
    if check:
        return check

    # return_to_stock is kept for frontend compatibility but has no
    # effect on PPE_Stock — deleting the log entry is always an
    # implicit "return" since available = stock - dist recalculates.
    return_to_stock = request.args.get('return_to_stock', 'false').lower() == 'true'

    from sheets_service import delete_row
    try:
        delete_row('PPE_Distribution_Log', row_index)
        msg = 'Log deleted and item returned to stock.' if return_to_stock else 'Log deleted successfully.'
        return jsonify({'status': 'success', 'message': msg})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# =====================================================
# ✅ HSE: Edit distribution log entry
#
# Same reasoning as delete above — PPE_Stock is a
# restock ledger and must NOT be touched here.
# Just update the log row. The frontend formula
# (available = stock - dist) recalculates automatically.
# =====================================================
@app.route('/api/hse/edit-distribution/<int:row_index>', methods=['PUT'])
@require_token
def hse_edit_distribution(row_index):
    check = check_permission('PPE_Distribution_Log', 'edit')
    if check:
        return check

    data = request.get_json() or {}
    new_ppe_type        = data.get('PPE_Type', '').strip()
    new_size            = str(data.get('Size', '')).strip()
    new_worker_name     = data.get('Worker_Name', '').strip()
    new_worker_position = data.get('Worker_Position', '').strip()
    new_notes           = data.get('Notes', '').strip()
    try:
        new_quantity = int(data.get('Quantity', 1))
    except (ValueError, TypeError):
        return jsonify({'status': 'error', 'message': 'Invalid quantity'}), 400

    if not new_ppe_type or not new_worker_name or new_quantity <= 0:
        return jsonify({'status': 'error', 'message': 'PPE type, worker name, and positive quantity are required'}), 400

    from sheets_service import client, SPREADSHEET_ID, get_current_time
    try:
        current_time   = get_current_time()
        log_sheet      = client.open_by_key(SPREADSHEET_ID).worksheet('PPE_Distribution_Log')
        log_headers    = log_sheet.row_values(1)
        log_col_letter = chr(64 + len(log_headers))

        # Read existing row to preserve original Date and Given_By
        row_data = log_sheet.row_values(row_index)
        if len(row_data) < len(log_headers):
            row_data += [''] * (len(log_headers) - len(row_data))
        old_row = dict(zip(log_headers, row_data))

        given_by = request.user.get('full_name') or request.user.get('username', '')

        updated_log = {
            'Date':            old_row.get('Date', current_time),
            'Worker_Name':     new_worker_name,
            'Worker_Position': new_worker_position,
            'PPE_Type':        new_ppe_type,
            'Size':            new_size,
            'Quantity':        new_quantity,
            'Given_By':        given_by,
            'Notes':           new_notes,
        }
        log_sheet.update(
            range_name=f'A{row_index}:{log_col_letter}{row_index}',
            values=[[updated_log.get(h, '') for h in log_headers]]
        )

        return jsonify({'status': 'success', 'message': 'Distribution log updated successfully.'})

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# =====================================================
# ✅ Run App
# =====================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
