import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database.seed import DEFAULT_ADMIN_EMAIL
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.otp import EmailOTP
from app.models.user import User, UserRole
from app.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginResponse,
    RegisterInitiateRequest,
    RegisterInitiateResponse,
    RegisterVerifyRequest,
    ResetPasswordRequest,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.activity import log_activity
from app.services.email_service import is_smtp_configured, send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/smtp-status")
def get_smtp_status() -> dict[str, bool | str]:
    """Returns whether real SMTP email delivery is configured."""
    return {
        "configured": is_smtp_configured(),
        "mode": "live_smtp" if is_smtp_configured() else "dev_console",
    }


@router.post("/register-otp", response_model=RegisterInitiateResponse)
async def request_registration_otp(
    request_data: RegisterInitiateRequest,
    db: Session = Depends(get_db),
) -> RegisterInitiateResponse:
    """
    Step 1 of new user signup:
    Validates input, checks for existing user, creates an OTP, and sends email.
    """
    existing_user = db.scalar(select(User).where(User.email == request_data.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    # Invalidate any previous unused registration OTPs for this email
    db.query(EmailOTP).filter(
        EmailOTP.email == request_data.email,
        EmailOTP.purpose == "registration",
        EmailOTP.is_used.is_(False),
    ).update({"is_used": True})

    # Generate 6-digit random numeric OTP
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Prepare pending user data
    payload = json.dumps(
        {
            "name": request_data.name,
            "password_hash": hash_password(request_data.password),
        }
    )

    otp_record = EmailOTP(
        email=request_data.email,
        otp_code=otp_code,
        purpose="registration",
        payload_data=payload,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(otp_record)
    db.commit()

    # Send OTP email
    email_result = await send_otp_email(
        email=request_data.email,
        otp=otp_code,
        purpose="registration",
        name=request_data.name,
    )

    return RegisterInitiateResponse(
        message=email_result.get("message", f"Verification code sent directly to {request_data.email}."),
        email=request_data.email,
    )


@router.post("/verify-registration-otp", response_model=LoginResponse)
def verify_registration_otp(
    verify_data: RegisterVerifyRequest,
    db: Session = Depends(get_db),
) -> LoginResponse:
    """
    Step 2 of new user signup:
    Verifies OTP, persists new user, and signs them in immediately.
    """
    now = datetime.now(timezone.utc)
    otp_record = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.email == verify_data.email,
            EmailOTP.otp_code == verify_data.otp,
            EmailOTP.purpose == "registration",
            EmailOTP.is_used.is_(False),
            EmailOTP.expires_at > now,
        )
        .order_by(EmailOTP.created_at.desc())
    )

    if otp_record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please request a new OTP.",
        )

    # Mark OTP used
    otp_record.is_used = True

    try:
        user_info = json.loads(otp_record.payload_data or "{}")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid registration payload. Please sign up again.",
        )

    # Check if user was already created
    user = db.scalar(select(User).where(User.email == verify_data.email))
    if user is None:
        user = User(
            name=user_info.get("name", "New User"),
            email=verify_data.email,
            password_hash=user_info.get("password_hash"),
            role=UserRole.USER,
            is_active=True,
        )
        db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    try:
        log_activity(db, user=user, action="register", resource_type="user", resource_id=str(user.id))
    except Exception:
        pass

    return LoginResponse(
        message="Registration verified successfully! Welcome to the dashboard.",
        access_token=create_access_token(str(user.id)),
        user=user,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)) -> User:
    """Direct registration (retained for backward compatibility and testing)."""
    existing_user = db.scalar(select(User).where(User.email == user_data.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)) -> LoginResponse:
    normalized_email = str(credentials.email).lower()
    user = db.scalar(select(User).where(User.email == normalized_email))

    if user is None and normalized_email == DEFAULT_ADMIN_EMAIL:
        from app.database.seed import ensure_default_admin
        ensure_default_admin()
        user = db.scalar(select(User).where(User.email == normalized_email))

    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    try:
        log_activity(db, user=user, action="login", resource_type="user", resource_id=str(user.id))
    except Exception:
        pass

    return LoginResponse(
        message="Login successful.",
        access_token=create_access_token(str(user.id)),
        user=user,
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    """
    Generates and sends a password reset OTP code to the requested email.
    """
    user = db.scalar(select(User).where(User.email == request_data.email))
    if user is None:
        # Generic message so emails cannot be easily probed, but clear guidance
        return ForgotPasswordResponse(
            message="If an account with that email exists, an OTP code has been sent.",
            email=request_data.email,
            dev_otp=None,
        )

    # Invalidate previous unused forgot_password OTPs for this email
    db.query(EmailOTP).filter(
        EmailOTP.email == request_data.email,
        EmailOTP.purpose == "forgot_password",
        EmailOTP.is_used.is_(False),
    ).update({"is_used": True})

    otp_code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp_record = EmailOTP(
        email=request_data.email,
        otp_code=otp_code,
        purpose="forgot_password",
        payload_data=None,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(otp_record)
    db.commit()

    email_result = await send_otp_email(
        email=request_data.email,
        otp=otp_code,
        purpose="forgot_password",
        name=user.name,
    )

    return ForgotPasswordResponse(
        message=email_result.get("message", "Password reset code sent to your email."),
        email=request_data.email,
    )


@router.post("/reset-password")
def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Validates reset OTP and updates user's password.
    """
    now = datetime.now(timezone.utc)
    otp_record = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.email == reset_data.email,
            EmailOTP.otp_code == reset_data.otp,
            EmailOTP.purpose == "forgot_password",
            EmailOTP.is_used.is_(False),
            EmailOTP.expires_at > now,
        )
        .order_by(EmailOTP.created_at.desc())
    )

    if otp_record is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code. Please request a new code.",
        )

    user = db.scalar(select(User).where(User.email == reset_data.email))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    # Update password and mark OTP used
    user.password_hash = hash_password(reset_data.new_password)
    otp_record.is_used = True
    db.commit()

    try:
        log_activity(db, user=user, action="reset_password", resource_type="user", resource_id=str(user.id))
    except Exception:
        pass

    return {"message": "Password reset successfully! You can now log in with your new password."}


@router.post("/change-password")
def change_password(
    change_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Allows authenticated users to change their password by validating current password.
    """
    if not verify_password(change_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match our records.",
        )

    current_user.password_hash = hash_password(change_data.new_password)
    db.commit()

    try:
        log_activity(db, user=current_user, action="change_password", resource_type="user", resource_id=str(current_user.id))
    except Exception:
        pass

    return {"message": "Your password has been changed successfully."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user
