"""
Migration script — run once to update existing database schema.
Usage: python migrate.py
"""
import os
import sqlite3

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./financecontrol.db").replace("sqlite:///", "").replace("./", "")

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def table_exists(cursor, table):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cursor.fetchone() is not None

def run():
    if not DB_PATH or not os.path.exists(DB_PATH):
        print(f"Database not found at '{DB_PATH}'. It will be created on first startup.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    changes = 0

    # 1. Add 'role' column to users
    if not column_exists(cur, "users", "role"):
        cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'admin'")
        print("  [OK] users.role column added (default: admin)")
        changes += 1
    else:
        print("  [--] users.role already exists")

    # 2. Create employees table
    if not table_exists(cur, "employees"):
        cur.execute("""
            CREATE TABLE employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(120) NOT NULL,
                cpf VARCHAR(14),
                position VARCHAR(80),
                department VARCHAR(80),
                base_salary REAL DEFAULT 0.0,
                hire_date DATE,
                status VARCHAR(20) DEFAULT 'active',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  [OK] employees table created")
        changes += 1
    else:
        print("  [--] employees table already exists")

    # 3. Create salary_payments table
    if not table_exists(cur, "salary_payments"):
        cur.execute("""
            CREATE TABLE salary_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                periodo_referencia VARCHAR(7) NOT NULL,
                base_salary REAL NOT NULL,
                bonus REAL DEFAULT 0.0,
                deductions REAL DEFAULT 0.0,
                inss REAL DEFAULT 0.0,
                fgts REAL DEFAULT 0.0,
                net_salary REAL NOT NULL,
                payment_date DATE,
                status VARCHAR(20) DEFAULT 'pending',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  [OK] salary_payments table created")
        changes += 1
    else:
        print("  [--] salary_payments table already exists")

    conn.commit()
    conn.close()

    print(f"\nMigration complete — {changes} change(s) applied.")

if __name__ == "__main__":
    print(f"Migrating database: {DB_PATH}\n")
    run()
