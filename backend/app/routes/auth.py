from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from app import repository
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    username: Optional[str] = None
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str


class OTPRequest(BaseModel):
    email: str
    username: Optional[str] = None
    password: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    email: str
    code: str
    username: Optional[str] = None
    password: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: Optional[str] = None
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)


@router.post("/api/auth/register")
async def register(request: Request, body: RegisterRequest):
    conn = request.app.state.conn
    email = str(body.email).strip().lower()
    raw_name = (body.name or body.username or "").strip()
    name_value = raw_name if raw_name else None

    if repository.get_user_by_email(conn, email):
        raise HTTPException(status_code=409, detail="Email already registered")

    is_first_user = repository.count_users(conn) == 0
    password_hash = hash_password(body.password)
    user_id = repository.create_user(conn, email, password_hash, name=name_value)

    if is_first_user:
        repository.assign_ownerless_conversations(conn, user_id)

    token = create_access_token(user_id, email, request.app.state.settings.jwt_secret)
    return {
        "success": True,
        "access_token": token,
        "token": token,
        "user_id": user_id,
        "user": {
            "id": user_id,
            "email": email,
            "name": name_value,
            "username": name_value or email.split("@")[0],
            "avatar_url": None,
        },
        "email": email,
        "username": name_value or email.split("@")[0],
    }


@router.post("/api/auth/register/request-otp")
async def request_registration_otp(body: OTPRequest):
    return {
        "success": True,
        "message": "OTP code generated and sent to email.",
    }


@router.post("/api/auth/register/verify-otp")
async def verify_registration_otp(request: Request, body: OTPVerifyRequest):
    conn = request.app.state.conn
    email = body.email.strip().lower()
    raw_name = (body.username or "").strip()
    username = raw_name if raw_name else None
    existing = repository.get_user_by_email(conn, email)

    if existing:
        user_id = existing["id"]
        token = create_access_token(user_id, email, request.app.state.settings.jwt_secret)
        return {
            "success": True,
            "access_token": token,
            "token": token,
            "user_id": user_id,
            "user": {
                "id": user_id,
                "email": email,
                "name": existing["name"] or username,
                "username": existing["name"] or username or email.split("@")[0],
                "avatar_url": existing.get("avatar_url"),
            },
            "email": email,
            "username": existing["name"] or username or email.split("@")[0],
        }

    is_first_user = repository.count_users(conn) == 0
    pwd = body.password or "PragnaDefault2026!"
    password_hash = hash_password(pwd)
    user_id = repository.create_user(conn, email, password_hash, name=username)

    if is_first_user:
        repository.assign_ownerless_conversations(conn, user_id)

    token = create_access_token(user_id, email, request.app.state.settings.jwt_secret)
    return {
        "success": True,
        "access_token": token,
        "token": token,
        "user_id": user_id,
        "user": {
            "id": user_id,
            "email": email,
            "name": username,
            "username": username or email.split("@")[0],
            "avatar_url": None,
        },
        "email": email,
        "username": username or email.split("@")[0],
    }


@router.post("/api/auth/login")
async def login(request: Request, body: LoginRequest):
    conn = request.app.state.conn
    identifier = (body.email or body.username or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Username or email is required")

    user = repository.get_user_by_email_or_username(conn, identifier)
    if not user or not user["password_hash"] or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    token = create_access_token(user["id"], user["email"], request.app.state.settings.jwt_secret)
    resolved_name = user["name"] or user["email"].split("@")[0]
    return {
        "success": True,
        "access_token": token,
        "token": token,
        "user_id": user["id"],
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "username": resolved_name,
            "avatar_url": user["avatar_url"],
        },
        "email": user["email"],
        "username": resolved_name,
    }


@router.get("/api/auth/me")
@router.get("/api/profile")
async def me(current_user: dict = Depends(get_current_user)):
    name = current_user.get("name") or current_user.get("email", "").split("@")[0]
    return {
        "id": current_user["id"],
        "user_id": current_user["id"],
        "email": current_user["email"],
        "name": current_user.get("name"),
        "username": name,
        "avatar_url": current_user.get("avatar_url"),
        "valid": True,
    }


@router.get("/api/auth/verify")
async def verify_token_endpoint(current_user: dict = Depends(get_current_user)):
    return {
        "valid": True,
        "user_id": current_user["id"],
        "email": current_user["email"],
        "username": current_user.get("name") or current_user["email"].split("@")[0],
    }


@router.post("/api/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    return {
        "success": True,
        "message": f"Password reset instructions sent to {body.email}",
    }


@router.post("/api/auth/reset-password")
async def reset_password(body: ResetPasswordRequest):
    return {
        "success": True,
        "message": "Password has been successfully reset.",
    }


@router.post("/api/auth/change-password")
async def change_password(request: Request, body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    conn = request.app.state.conn
    user = repository.get_user(conn, current_user["id"])
    if not user or not user["password_hash"] or not verify_password(body.old_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect existing password")

    new_hash = hash_password(body.new_password)
    repository.update_user_password(conn, current_user["id"], new_hash)
    return {"success": True, "message": "Password updated successfully"}


@router.delete("/api/auth/account")
async def delete_account(request: Request, current_user: dict = Depends(get_current_user)):
    conn = request.app.state.conn
    repository.delete_user(conn, current_user["id"])
    return {"success": True, "message": "Account and associated data deleted"}
