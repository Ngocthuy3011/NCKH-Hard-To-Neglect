from flask import Flask
from flask_jwt_extended import JWTManager
from routes.auth import auth_bp

app = Flask(__name__)


app.config["JWT_SECRET_KEY"] = "super-secret-key"  # sau này đưa vào .env


jwt = JWTManager(app)


app.register_blueprint(auth_bp)

@app.route("/")
def home():
    return {"status": "API is running"}

if __name__ == "__main__":
    app.run(debug=True)
