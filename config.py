from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Optional with default values
    HOST_NAME: str = "localhost"
    USER_NAME: str = "root"
    USER_PASSWORD: str = "password"
    DB_NAME: str = "mydatabase"
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    TWILIO_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
print("DEBUG SETTINGS:", settings.model_dump())