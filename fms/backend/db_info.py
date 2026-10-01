"""Print where the database lives and what is in it.

Run:
    .venv/Scripts/python db_info.py

Handy because the SQLite file is gitignored (*.db), so Git-aware editors dim or
hide it and it is easy to think it is missing.
"""

import os
import sqlite3

from config import Config

# Resolve the same URI the app uses, so this always reports the real file.
uri = Config.SQLALCHEMY_DATABASE_URI
path = uri.replace("sqlite:///", "").replace("sqlite://", "")
if not os.path.isabs(path):
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), path)

print("=" * 62)
print("  FLEET MANAGEMENT SYSTEM — DATABASE")
print("=" * 62)

if uri.startswith("postgresql"):
    print(f"  Backend : PostgreSQL")
    print(f"  DSN     : {uri}")
    print("\n  Row counts are available through the API (/api/dashboard/metrics).")
    raise SystemExit(0)

print(f"  Backend : SQLite")
print(f"  File    : {os.path.abspath(path)}")

if not os.path.exists(path):
    print("\n  The file does not exist yet.")
    print("  It is created and seeded automatically the first time you run:")
    print("      .venv/Scripts/python app.py")
    raise SystemExit(0)

print(f"  Size    : {os.path.getsize(path):,} bytes")
print()

connection = sqlite3.connect(path)
tables = [
    row[0]
    for row in connection.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
]

print("  TABLES")
print("  " + "-" * 58)
for table in tables:
    count = connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
    print(f"    {table:<24} {count:>8,} rows")

print()
print("  To browse it visually, open the file above in any SQLite viewer")
print("  (DB Browser for SQLite, TablePlus, or the SQLite extension for VS Code).")
print("=" * 62)

connection.close()
