from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Optional with default values
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "mydatabase"

    # Required (no defaults)
    API_KEY: str
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    SESSION_SECRET: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
print("DEBUG SETTINGS:", settings.model_dump())