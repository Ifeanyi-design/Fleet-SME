"""Application configuration.

Dev default is SQLite so the API runs on modest hardware with zero setup.
Set DATABASE_URL to a PostgreSQL DSN for the deployment target named in PRD Table 4.1.
"""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Base configuration shared by every environment."""

    # ── persistence ──────────────────────────────────────────────────────
    # SQLite by default; swap for postgresql+psycopg2://user:pass@host/db in production.
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'fms.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── auth (NFR2) ──────────────────────────────────────────────────────
    # Override in production. The fallback exists only so a fresh clone runs.
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_HOURS", "12")))

    # ── CORS ─────────────────────────────────────────────────────────────
    # Vite dev server origin(s). Comma-separated.
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    JSON_SORT_KEYS = False


class TestConfig(Config):
    """In-memory database for the automated test suite."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-secret"
