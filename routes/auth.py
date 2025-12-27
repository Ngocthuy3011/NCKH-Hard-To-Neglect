from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta

auth_bp = Blueprint("auth", __name__)

# Giả lập database
USERS = {
    "51801003": {"password": "123456", "role": "student"},
    "GV001": {"password": "admin123", "role": "teacher"}
}

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username not in USERS or USERS[username]["password"] != password:
        return jsonify({"msg": "Sai tài khoản hoặc mật khẩu"}), 401

    access_token = create_access_token(
        identity=username,
        additional_claims={"role": USERS[username]["role"]}
    )

    return jsonify(access_token=access_token)
