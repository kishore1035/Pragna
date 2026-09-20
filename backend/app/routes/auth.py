import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from app import repository, email_service
from app.auth import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)

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
    email: EmailStr
    username: Optional[str] = None
    name: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str
    password: str = Field(min_length=6)
    username: Optional[str] = None
    name: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)


def _require_email_auth(settings) -> None:
    if not settings.email_auth_enabled:
        raise HTTPException(status_code=404, detail="Email auth is disabled")
    if not settings.is_emailjs_configured():
        raise HTTPException(status_code=503, detail="Email service not configured")


@router.post("/api/auth/register")
async def register(request: Request, body: RegisterRequest):
    settings = request.app.state.settings
    if settings.email_auth_enabled:
        raise HTTPException(status_code=403, detail="Email verification required")

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

    token = create_access_token(user_id, email, settings.jwt_secret)
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
async def request_registration_otp(request: Request, body: OTPRequest):
    settings = request.app.state.settings
    _require_email_auth(settings)

    conn = request.app.state.conn
    email = str(body.email).strip().lower()

    if repository.get_user_by_email(conn, email):
        raise HTTPException(status_code=409, detail="Email already registered")

    now_dt = datetime.now(timezone.utc)

    # Hourly limit: max 5 sends per email per hour
    one_hour_ago = (now_dt - timedelta(hours=1)).isoformat()
    recent_count = repository.get_recent_email_otps_count(conn, email, one_hour_ago)
    if recent_count >= 5:
        raise HTTPException(
            status_code=429,
            detail="Too many code requests. Please try again later.",
            headers={"Retry-After": "3600"},
        )

    # Per-email cooldown (EMAIL_COOLDOWN_SECONDS)
    latest_otp = repository.get_latest_email_otp(conn, email)
    if latest_otp:
        created_at_dt = datetime.fromisoformat(latest_otp["created_at"])
        elapsed = (now_dt - created_at_dt).total_seconds()
        if elapsed < settings.email_cooldown_seconds:
            remaining = int(settings.email_cooldown_seconds - elapsed) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting a new code",
                headers={"Retry-After": str(remaining)},
            )

    otp_code = f"{secrets.randbelow(1000000):06d}"
    code_hash = repository.hash_secret(otp_code, settings.jwt_secret)
    expires_at = (now_dt + timedelta(minutes=settings.otp_ttl_minutes)).isoformat()

    otp_id = repository.create_email_otp(conn, email, code_hash, expires_at)

    try:
        await email_service.send_email(
            settings=settings,
            template_id=settings.emailjs_template_id_otp,
            to_email=email,
            params={
                "otp_code": otp_code,
                "expires_in_minutes": settings.otp_ttl_minutes,
                "app_name": "Pragna-1 A",
            },
        )
    except email_service.EmailSendError:
        repository.delete_email_otp(conn, otp_id)
        raise HTTPException(status_code=502, detail="Couldn't send the code, try again")

    return {
        "success": True,
        "message": "OTP code generated and sent to email.",
        "expires_in": settings.otp_ttl_minutes * 60,
        "resend_after": settings.email_cooldown_seconds,
    }


@router.post("/api/auth/register/verify-otp")
async def verify_registration_otp(request: Request, body: OTPVerifyRequest):
    settings = request.app.state.settings
    _require_email_auth(settings)

    conn = request.app.state.conn
    email = str(body.email).strip().lower()
    raw_name = (body.name or body.username or "").strip()
    name_value = raw_name if raw_name else None

    if repository.get_user_by_email(conn, email):
        raise HTTPException(status_code=409, detail="Email already registered")

    latest_otp = repository.get_latest_email_otp(conn, email)
    if not latest_otp:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    now_iso = datetime.now(timezone.utc).isoformat()
    if latest_otp["expires_at"] < now_iso:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    if latest_otp["attempts"] >= settings.otp_max_attempts:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please request a new code.")

    provided_hash = repository.hash_secret(body.code.strip(), settings.jwt_secret)
    if not hmac.compare_digest(provided_hash, latest_otp["code_hash"]):
        attempts = repository.increment_otp_attempts(conn, latest_otp["id"])
        if attempts >= settings.otp_max_attempts:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Please request a new code.")
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    repository.consume_email_otp(conn, latest_otp["id"])

    is_first_user = repository.count_users(conn) == 0
    password_hash = hash_password(body.password)
    user_id = repository.create_user(conn, email, password_hash, name=name_value)

    if is_first_user:
        repository.assign_ownerless_conversations(conn, user_id)

    token = create_access_token(user_id, email, settings.jwt_secret)
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


async def _send_forgot_password_email(db_path: str, settings, email: str) -> None:
    import sqlite3
    conn = sqlite3.connect(db_path, timeout=30.0)
    conn.row_factory = sqlite3.Row
    try:
        user = repository.get_user_by_email(conn, email)
        if not user or not user["password_hash"]:
            return

        now_dt = datetime.now(timezone.utc)
        reset_token = secrets.token_urlsafe(32)
        token_hash = repository.hash_secret(reset_token, settings.jwt_secret)
        expires_at = (now_dt + timedelta(minutes=settings.reset_token_ttl_minutes)).isoformat()

        repository.create_password_reset(conn, user["id"], token_hash, expires_at)

        frontend_url = (settings.frontend_public_url or "http://localhost:4028").rstrip("/")
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"

        await email_service.send_email(
            settings=settings,
            template_id=settings.emailjs_template_id_reset,
            to_email=email,
            params={
                "reset_link": reset_link,
                "expires_in_minutes": settings.reset_token_ttl_minutes,
                "app_name": "Pragna-1 A",
            },
        )
    except Exception as exc:
        logger.error("Failed to process forgot password email: %s", exc)
    finally:
        conn.close()


@router.post("/api/auth/forgot-password")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
):
    settings = request.app.state.settings
    _require_email_auth(settings)

    email = str(body.email).strip().lower()
    background_tasks.add_task(_send_forgot_password_email, settings.db_path, settings, email)

    return {
        "success": True,
        "message": "If an account exists for that email, a reset link has been sent",
    }


@router.post("/api/auth/reset-password")
async def reset_password(request: Request, body: ResetPasswordRequest):
    settings = request.app.state.settings
    _require_email_auth(settings)

    if not body.token or not body.token.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    conn = request.app.state.conn
    token_hash = repository.hash_secret(body.token.strip(), settings.jwt_secret)
    reset_row = repository.get_password_reset_by_hash(conn, token_hash)

    if not reset_row:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    now_iso = datetime.now(timezone.utc).isoformat()
    if reset_row["used_at"] is not None or reset_row["expires_at"] < now_iso:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    new_hash = hash_password(body.new_password)
    repository.update_user_password(conn, reset_row["user_id"], new_hash)
    repository.consume_password_reset(conn, reset_row["id"], reset_row["user_id"])

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
