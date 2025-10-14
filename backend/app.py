from flask import Flask, jsonify
from flask_cors import CORS  # <-- add this line

app = Flask(__name__)
CORS(app)  # <-- add this line

@app.route("/")
def home():
    return jsonify({"message": "Backend working!"})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
