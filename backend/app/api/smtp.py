import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from fastapi_mail import FastMail, MessageSchema, MessageType

from app.core.config import ENV_FILE, get_settings
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import SMTPConfigInfo, SMTPConfigUpdate, SMTPTestRequest
from app.services.email_service import get_connection_config, is_smtp_configured

router = APIRouter(prefix="/settings/smtp", tags=["SMTP Settings"])


def update_env_file(key_values: dict[str, str]) -> None:
    """Updates or appends key-value pairs in the .env file."""
    env_path = ENV_FILE
    if not env_path.exists():
        lines = []
    else:
        lines = env_path.read_text(encoding="utf-8").splitlines()

    updated_keys = set()
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            k, _ = stripped.split("=", 1)
            k = k.strip()
            if k in key_values:
                new_lines.append(f"{k}={key_values[k]}")
                updated_keys.add(k)
                continue
        new_lines.append(line)

    for k, v in key_values.items():
        if k not in updated_keys:
            new_lines.append(f"{k}={v}")

    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


@router.get("", response_model=SMTPConfigInfo)
def get_smtp_settings(current_user: User = Depends(get_current_user)) -> SMTPConfigInfo:
    """Returns current SMTP settings."""
    settings = get_settings()
    return SMTPConfigInfo(
        is_configured=is_smtp_configured(),
        mail_server=settings.mail_server,
        mail_port=settings.mail_port,
        mail_username=settings.mail_username,
        mail_from=settings.mail_from,
        mail_from_name=settings.mail_from_name,
        mail_starttls=settings.mail_starttls,
        mail_ssl_tls=settings.mail_ssl_tls,
    )


@router.put("", response_model=SMTPConfigInfo)
def update_smtp_settings(
    update_data: SMTPConfigUpdate,
    current_user: User = Depends(get_current_user),
) -> SMTPConfigInfo:
    """
    Updates SMTP / Gmail configuration.
    Updates in-memory settings and writes to backend .env file.
    """
    settings = get_settings()
    settings.mail_server = update_data.mail_server.strip()
    settings.mail_port = update_data.mail_port
    settings.mail_username = update_data.mail_username.strip()
    settings.mail_from = update_data.mail_from.strip()
    settings.mail_from_name = update_data.mail_from_name.strip()
    settings.mail_starttls = update_data.mail_starttls
    settings.mail_ssl_tls = update_data.mail_ssl_tls

    env_updates: dict[str, str] = {
        "MAIL_SERVER": settings.mail_server,
        "MAIL_PORT": str(settings.mail_port),
        "MAIL_USERNAME": settings.mail_username,
        "MAIL_FROM": settings.mail_from,
        "MAIL_FROM_NAME": settings.mail_from_name,
        "MAIL_STARTTLS": str(settings.mail_starttls),
        "MAIL_SSL_TLS": str(settings.mail_ssl_tls),
    }

    if update_data.mail_password is not None and update_data.mail_password != "":
        settings.mail_password = update_data.mail_password
        env_updates["MAIL_PASSWORD"] = update_data.mail_password

    try:
        update_env_file(env_updates)
    except Exception as e:
        # Don't fail if file write fails in some container environments
        pass

    get_settings.cache_clear()

    return SMTPConfigInfo(
        is_configured=is_smtp_configured(),
        mail_server=settings.mail_server,
        mail_port=settings.mail_port,
        mail_username=settings.mail_username,
        mail_from=settings.mail_from,
        mail_from_name=settings.mail_from_name,
        mail_starttls=settings.mail_starttls,
        mail_ssl_tls=settings.mail_ssl_tls,
    )


@router.post("/test")
async def test_smtp_configuration(
    test_req: SMTPTestRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, str | bool]:
    """Sends a test email to the provided address using active SMTP settings."""
    settings = get_settings()
    if not is_smtp_configured():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMTP credentials (username, password, server) are not yet fully configured.",
        )

    try:
        conf = get_connection_config()
        fm = FastMail(conf)
        message = MessageSchema(
            subject="Developer Productivity Dashboard - SMTP Test Email",
            recipients=[test_req.test_email],
            body=f"""<div style="font-family: sans-serif; padding: 20px; color: #111;">
                <h2>SMTP Connection Test Succeeded! 🎉</h2>
                <p>Hello {current_user.name},</p>
                <p>Your SMTP mail configuration is functioning properly!</p>
                <ul>
                    <li>Server: {settings.mail_server}</li>
                    <li>Port: {settings.mail_port}</li>
                    <li>Sender: {settings.mail_from}</li>
                </ul>
            </div>""",
            subtype=MessageType.html,
        )
        await fm.send_message(message)
        return {"success": True, "message": f"Test email sent successfully to {test_req.test_email}!"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SMTP send failed: {str(exc)}",
        )
