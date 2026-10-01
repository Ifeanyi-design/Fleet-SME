"""Application configuration.

Dev default is SQLite so the API runs on modest hardware with zero setup.
Set DATABASE_URL to a PostgreSQL DSN for the deployment target named in PRD Table 4.1.
"""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _normalise_database_url(raw: str) -> str:
    """Make a hosted DATABASE_URL usable by SQLAlchemy 2.x.

    Render (and Heroku-style providers) hand out `postgres://…`, which SQLAlchemy 2.x
    rejects with "Can't load plugin: sqlalchemy.dialects:postgres". The driver must be
    named explicitly, so rewrite the scheme. Also pins SSL for managed Postgres, which
    Render requires.
    """
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql+psycopg2://", 1)
    elif raw.startswith("postgresql://"):
        raw = raw.replace("postgresql://", "postgresql+psycopg2://", 1)

    # Managed providers terminate TLS at the proxy; psycopg2 needs to be told.
    if raw.startswith("postgresql+psycopg2://") and "sslmode=" not in raw:
        raw += ("&" if "?" in raw else "?") + "sslmode=require"

    return raw


class Config:
    """Base configuration shared by every environment."""

    # ── persistence ──────────────────────────────────────────────────────
    # SQLite by default so a fresh clone runs with zero setup. On a host with an
    # ephemeral filesystem (Render, Heroku) this MUST be overridden with DATABASE_URL,
    # otherwise the data is lost on every deploy.
    SQLALCHEMY_DATABASE_URI = _normalise_database_url(
        os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'fms.db')}")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Pool settings suited to a small managed Postgres. `pool_pre_ping` avoids handing
    # out connections the provider has already closed (common on free tiers).
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    # ── auth (NFR2) ──────────────────────────────────────────────────────
    # Override in production. The fallback exists only so a fresh clone runs.
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv("JWT_HOURS", "12")))

    # ── CORS ─────────────────────────────────────────────────────────────
    # Comma-separated list of origins allowed to call the API. In production this must
    # include the deployed frontend origin, e.g. https://fleet-sme-web.onrender.com
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]

    # ── seeding ──────────────────────────────────────────────────────────
    # Seed the Case Organisation A baseline when the database is empty. Set to "false"
    # to start with a completely empty system.
    AUTO_SEED = os.getenv("AUTO_SEED", "true").lower() not in {"false", "0", "no"}

    JSON_SORT_KEYS = False


class TestConfig(Config):
    """In-memory database for the automated test suite."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-secret"
    SQLALCHEMY_ENGINE_OPTIONS: dict = {}

