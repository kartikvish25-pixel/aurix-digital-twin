import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

DATABASE_PATH = "./substation.db"

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def _now_str() -> str:
    return utcnow().isoformat()

def _parse(ts: Optional[str]) -> Optional[datetime]:
    return datetime.fromisoformat(ts) if ts else None

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

@dataclass
class LoginLog:
    id: int
    username: str
    status: str
    timestamp: Optional[datetime]

@dataclass
class ErrorLog:
    id: int
    error_message: str
    level: str
    timestamp: Optional[datetime]

@dataclass
class TicketLog:
    id: int
    ticket_id: str
    severity: str
    action: str
    timestamp: Optional[datetime]

# ---------- Schema Initialization ----------
def init_db():
    with get_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS login_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                status TEXT,
                timestamp TEXT
            );
            CREATE INDEX IF NOT EXISTS ix_login_logs_username ON login_logs (username);

            CREATE TABLE IF NOT EXISTS error_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                error_message TEXT,
                level TEXT,
                timestamp TEXT
            );

            CREATE TABLE IF NOT EXISTS ticket_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT UNIQUE,
                severity TEXT,
                action TEXT,
                timestamp TEXT
            );
            """
        )

# ---------- Inserts ----------
def add_login_log(username: str, status: str) -> int:
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO login_logs (username, status, timestamp) VALUES (?, ?, ?)",
            (username, status, _now_str()),
        )
        return cur.lastrowid

def add_error_log(error_message: str, level: str) -> int:
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO error_logs (error_message, level, timestamp) VALUES (?, ?, ?)",
            (error_message, level, _now_str()),
        )
        return cur.lastrowid

def add_ticket_log(ticket_id: str, severity: str, action: str) -> int:
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO ticket_logs (ticket_id, severity, action, timestamp) VALUES (?, ?, ?, ?)",
            (ticket_id, severity, action, _now_str()),
        )
        return cur.lastrowid

# ---------- Queries ----------
def get_login_logs(username: Optional[str] = None, limit: int = 100) -> List[LoginLog]:
    sql = "SELECT * FROM login_logs"
    params: list = []
    if username:
        sql += " WHERE username = ?"
        params.append(username)
    sql += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    with get_db() as db:
        rows = db.execute(sql, params).fetchall()
    return [
        LoginLog(r["id"], r["username"], r["status"], _parse(r["timestamp"]))
        for r in rows
    ]

def get_error_logs(limit: int = 100) -> List[ErrorLog]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM error_logs ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [
        ErrorLog(r["id"], r["error_message"], r["level"], _parse(r["timestamp"]))
        for r in rows
    ]

def get_ticket_logs(limit: int = 100) -> List[TicketLog]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM ticket_logs ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [
        TicketLog(
            r["id"], r["ticket_id"], r["severity"], r["action"], _parse(r["timestamp"])
        )
        for r in rows
    ]

def get_ticket_by_ticket_id(ticket_id: str) -> Optional[TicketLog]:
    with get_db() as db:
        r = db.execute(
            "SELECT * FROM ticket_logs WHERE ticket_id = ?", (ticket_id,)
        ).fetchone()
    if r is None:
        return None
    return TicketLog(
        r["id"], r["ticket_id"], r["severity"], r["action"], _parse(r["timestamp"])
    )