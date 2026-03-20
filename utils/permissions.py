from flask_jwt_extended import get_jwt

def require_role(required_role):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') != required_role:
                return {"msg": "Permission denied"}, 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
