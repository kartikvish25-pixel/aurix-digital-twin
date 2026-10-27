import sqlite3
from datetime import datetime

DB_NAME = "substation.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # 1. Real-time Alert Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT,
            color TEXT,
            msg TEXT,
            time TEXT
        )
    ''')
    
    # 2. CMMS Tickets Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            asset TEXT,
            severity TEXT,
            action TEXT,
            status TEXT,
            time TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_alert(level, color, msg):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    time_str = datetime.now().strftime("%H:%M:%S")
    cursor.execute("INSERT INTO alerts (level, color, msg, time) VALUES (?, ?, ?, ?)", (level, color, msg, time_str))
    conn.commit()
    conn.close()

def get_db_alerts():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT level, color, msg, time FROM alerts ORDER BY id DESC LIMIT 20")
    rows = cursor.fetchall()
    conn.close()
    return [{"level": r[0], "color": r[1], "msg": r[2], "time": r[3]} for r in rows]

def save_ticket(ticket_id, asset, severity, action):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("INSERT OR REPLACE INTO tickets (id, asset, severity, action, status, time) VALUES (?, ?, ?, ?, ?, ?)", 
                   (ticket_id, asset, severity, action, "OPEN", time_str))
    conn.commit()
    conn.close()

def get_db_tickets():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, asset, severity, action, status, time FROM tickets ORDER BY time DESC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "asset": r[1], "severity": r[2], "action": r[3], "status": r[4], "time": r[5]} for r in rows]

# Initialize on import
init_db()