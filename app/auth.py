import datetime
from passlib.context import CryptContext
import jwt
from flask import request, make_response
from .database import SessionLocal
from .models import Faculty
from sqlalchemy.orm import Session
import os

pwd_ctx = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
JWT_SECRET = os.environ.get('ANUMATI_JWT_SECRET') or 'change-this-secret'
JWT_ALGO = 'HS256'


def verify_password(plain, hashed):
    return pwd_ctx.verify(plain, hashed)


def hash_password(password):
    return pwd_ctx.hash(password)


def create_token(faculty_id: str, role: str, department: str):
    payload = {
        'sub': faculty_id,
        'role': role,
        'department': department,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except Exception:
        return None


def current_user_from_request():
    token = None
    # Prefer cookie
    token = request.cookies.get('anam_token') or (request.headers.get('Authorization') or '').replace('Bearer ', '')
    if not token:
        return None
    data = decode_token(token)
    if not data:
        return None
    db: Session = SessionLocal()
    user = db.query(Faculty).filter_by(faculty_id=data['sub']).first()
    db.close()
    if not user or not user.is_active:
        return None
    # attach role/department from token for speed
    user._token_role = data.get('role')
    user._token_department = data.get('department')
    return user


def logout(response):
    response.set_cookie('anam_token', '', expires=0)
    return response
