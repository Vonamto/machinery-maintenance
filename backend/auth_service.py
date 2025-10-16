def authenticate_user(username, password):
    """
    Check credentials from Users sheet (case-insensitive and trimmed).
    """
    try:
        sheet = client.open_by_key(SPREADSHEET_ID).worksheet("Users")
        users = sheet.get_all_records()

        username = str(username).strip()
        password = str(password).strip()

        for user in users:
            sheet_username = str(user["Username"]).strip()
            sheet_password = str(user["Password"]).strip()

            if sheet_username.lower() == username.lower() and sheet_password == password:
                payload = {
                    "username": sheet_username,
                    "role": user["Role"],
                    "full_name": user.get("Full Name", ""),
                    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
                return jsonify({
                    "status": "success",
                    "token": token,
                    "user": payload
                })

        return jsonify({"status": "error", "message": "Invalid username or password"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})
