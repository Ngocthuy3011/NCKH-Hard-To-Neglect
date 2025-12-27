from flask import Flask
from flask_jwt_extended import JWTManager
from config import Config
from routes.auth import auth_bp
from routes.attendance import attendance_bp

app = Flask(__name__)
app.config.from_object(Config)

jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(attendance_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)


