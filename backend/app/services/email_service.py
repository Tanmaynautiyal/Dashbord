import logging
from typing import Any
from fastapi import HTTPException, status
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.core.config import get_settings

logger = logging.getLogger("email_service")
logging.basicConfig(level=logging.INFO)


def is_smtp_configured() -> bool:
    settings = get_settings()
    user = (settings.mail_username or "").strip()
    pwd = (settings.mail_password or "").strip()
    server = (settings.mail_server or "").strip()
    return bool(user and pwd and server)


def get_connection_config(override_settings: dict[str, Any] | None = None) -> ConnectionConfig:
    settings = get_settings()
    username = (settings.mail_username or "").strip()
    # Google App Passwords are 16 letters usually formatted with spaces (e.g. 'xxxx xxxx xxxx xxxx')
    # Automatically strip spaces so both formats work seamlessly
    password = (settings.mail_password or "").replace(" ", "").strip()
    server = (settings.mail_server or "").strip()
    mail_from = (settings.mail_from or "").strip()

    # If sending through Gmail SMTP, Gmail requires sender email to match the authenticated Gmail user
    if "gmail.com" in server.lower() and username:
        if not mail_from or "@gmail.com" not in mail_from.lower():
            mail_from = username

    data = {
        "MAIL_USERNAME": username,
        "MAIL_PASSWORD": password,
        "MAIL_PORT": settings.mail_port,
        "MAIL_SERVER": server,
        "MAIL_STARTTLS": settings.mail_starttls,
        "MAIL_SSL_TLS": settings.mail_ssl_tls,
        "MAIL_FROM": mail_from or username or "noreply@devproductivity.com",
        "MAIL_FROM_NAME": settings.mail_from_name or "Dev Productivity",
        "USE_CREDENTIALS": settings.mail_use_credentials,
        "VALIDATE_CERTS": settings.mail_validate_certs,
    }
    if override_settings:
        for k, v in override_settings.items():
            upper_k = k.upper()
            if upper_k in data:
                data[upper_k] = v
            elif k in data:
                data[k] = v

    return ConnectionConfig(**data)


def build_otp_html(otp: str, purpose: str, name: str | None = None) -> str:
    user_greeting = f"Hello {name}," if name else "Hello,"
    purpose_label = "Account Verification" if purpose == "registration" else "Password Reset"
    action_text = (
        "complete your account registration and sign in"
        if purpose == "registration"
        else "reset your password securely"
    )

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{purpose_label}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #080c14;
      color: #f1f5f9;
      margin: 0;
      padding: 40px 16px;
    }}
    .wrapper {{
      max-width: 540px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }}
    .header-bar {{
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      height: 6px;
      width: 100%;
    }}
    .content {{
      padding: 36px 32px;
    }}
    .brand {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 800;
      color: #a855f7;
      letter-spacing: -0.3px;
      margin-bottom: 24px;
      text-transform: uppercase;
    }}
    h1 {{
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }}
    p {{
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 12px 0;
    }}
    .otp-container {{
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
      border: 1px solid rgba(168, 85, 247, 0.4);
      border-radius: 18px;
      padding: 24px 20px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-label {{
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #c084fc;
      margin-bottom: 8px;
    }}
    .otp-digits {{
      font-family: 'Courier New', Courier, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 12px;
      color: #ffffff;
      text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
      padding-left: 12px;
      user-select: all;
    }}
    .expiry-badge {{
      display: inline-block;
      margin-top: 10px;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 600;
    }}
    .security-notice {{
      background: rgba(239, 68, 68, 0.08);
      border-left: 3px solid #ef4444;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      color: #fca5a5;
      margin: 24px 0 0 0;
      line-height: 1.5;
    }}
    .footer {{
      border-top: 1px solid #1e293b;
      padding: 20px 32px;
      background: #090d16;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header-bar"></div>
    <div class="content">
      <div class="brand">&#9889; DevProductivity Platform</div>
      <h1>{purpose_label}</h1>
      <p>{user_greeting}</p>
      <p>Please enter the following 6-digit verification code to {action_text}.</p>
      
      <div class="otp-container">
        <div class="otp-label">One-Time Verification Code</div>
        <div class="otp-digits">{otp}</div>
        <div class="expiry-badge">&#9200; Valid for 10 minutes</div>
      </div>
      
      <div class="security-notice">
        <strong>Security Warning:</strong> Never share this code with anyone. DevProductivity representatives will never ask for your code.
      </div>
    </div>
    
    </div>
  </div>
</body>
</html>"""


async def send_otp_email(
    email: str,
    otp: str,
    purpose: str,
    name: str | None = None,
) -> dict[str, Any]:
    """
    Sends OTP email directly to the recipient's personal inbox via FastAPI-Mail if SMTP is configured.
    If SMTP is not configured or email delivery fails, gracefully provides the verification code
    in dev_mode so the user is never blocked from registration or password reset.
    """
    if not is_smtp_configured():
        logger.info(f"SMTP not configured. Verification code generated for {email}: {otp}")
        return {
            "success": True,
            "dev_mode": True,
            "otp": otp,
            "message": f"Verification code: {otp} (SMTP not configured in server environment).",
        }

    subject = (
        f"[{otp}] Your Verification Code - Developer Productivity"
        if purpose == "registration"
        else f"[{otp}] Your Password Reset Code - Developer Productivity"
    )
    html_content = build_otp_html(otp=otp, purpose=purpose, name=name)

    try:
        conf = get_connection_config()
        fm = FastMail(conf)
        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )
        await fm.send_message(message)
        logger.info(f"Successfully sent OTP email directly to {email} via SMTP ({conf.MAIL_SERVER})")
        return {
            "success": True,
            "dev_mode": False,
            "message": f"Verification code has been sent directly to {email}. Please check your inbox (and spam folder).",
        }
    except Exception as exc:
        err_str = str(exc)
        logger.warning(f"Failed to send email via SMTP to {email}: {err_str}. Falling back to dev verification code.")
        return {
            "success": True,
            "dev_mode": True,
            "otp": otp,
            "message": f"Email delivery unavailable. Your verification code is {otp}.",
        }
