import sqlite3
import os

db_path = os.path.join('db.sqlite3')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='DHT_incidentcomment'")
if cursor.fetchone():
    print('Table DHT_incidentcomment already exists')
else:
    # Create the table
    cursor.execute('''
        CREATE TABLE DHT_incidentcomment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            incident_id INTEGER NOT NULL REFERENCES DHT_incident(id),
            author_id INTEGER NOT NULL REFERENCES auth_user(id)
        )
    ''')
    print('Created table DHT_incidentcomment')

conn.commit()
conn.close()