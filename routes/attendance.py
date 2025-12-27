from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from utils.jwt_utils import role_required
from utils.face_utils import recognize_face

attendance_bp = Blueprint("attendance", __name__)

@attendance_bp.route("/attendance", methods=["POST"])
@jwt_required()
@role_required("teacher")
def attendance():
    file = request.files.get("image")
    if not file:
        return jsonify(msg="Thiếu ảnh"), 400

    student_id = recognize_face(file)

    if not student_id:
        return jsonify(msg="Không nhận diện được khuôn mặt"), 404

    # Lưu vào DB (giả lập)
    return jsonify(msg="Điểm danh thành công", student_id=student_id)
