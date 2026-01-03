import sqlite3
import os

db_path = os.path.join('db.sqlite3')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check current columns
cursor.execute('PRAGMA table_info(DHT_incident)')
columns = cursor.fetchall()
print('Current columns:', [col[1] for col in columns])

# Add missing columns
missing_columns = [
    ('status', "VARCHAR(20) DEFAULT 'en_cours'"),
    ('temperature', 'REAL'),
    ('humidity', 'REAL'),
    ('op1_date', 'DATETIME'),
    ('op2_date', 'DATETIME'),
    ('op3_date', 'DATETIME'),
]

for col_name, col_type in missing_columns:
    if col_name not in [col[1] for col in columns]:
        try:
            cursor.execute(f'ALTER TABLE DHT_incident ADD COLUMN {col_name} {col_type}')
            print(f'Added column {col_name}')
        except Exception as e:
            print(f'Error adding {col_name}: {e}')

conn.commit()
conn.close()