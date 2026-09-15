from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # Development defaults provided to allow running without env file.
    database_url: str = "sqlite:////tmp/dashboard.db"
    jwt_secret_key: SecretStr = SecretStr("dev-secret")
    access_token_expire_minutes: int = Field(default=30, gt=0)
    ai_api_key: SecretStr = SecretStr("")
    ai_api_base_url: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-3.5-turbo"

    # SMTP / Gmail Mail Settings
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = "noreply@devproductivity.com"
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_from_name: str = "Dev Productivity"
    mail_starttls: bool = True
    mail_ssl_tls: bool = False
    mail_use_credentials: bool = True
    mail_validate_certs: bool = True

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
