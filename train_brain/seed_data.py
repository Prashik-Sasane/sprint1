import pandas as pd
import random
import os
import urllib.parse
import pathlib
from sqlalchemy import Integer, Float, String, Boolean
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# --- 0. CONNECTION SETUP ---
load_dotenv()

user = os.getenv("DB_USER", "root")
raw_password = os.getenv("DB_PASSWORD", "12410279")
host = os.getenv("DB_HOST", "db")
db = os.getenv("DB_NAME", "smart_planner")
password = urllib.parse.quote_plus(raw_password)

engine = create_engine(f"mysql+pymysql://{user}:{password}@{host}/{db}")

print("🚀 Starting Phase 1: Full Database Population...")
print("DB CONFIG:", user, host, raw_password)
# --- 1. TABLE: DEVELOPERS ---
skills = ['Backend', 'Frontend', 'API', 'DevOps', 'UI/UX', 'Database', 'Security', 'Mobile']
levels = ['Junior', 'Mid', 'Senior']

devs_data = []
for i in range(1, 151):  # Generate 150 developers
    devs_data.append({
        'dev_id': i,
        'name': f'Developer_{i}',
        'experience_level': random.choice(levels),
        'primary_skill': random.choice(skills),
        'current_load': 0
    })
df_devs = pd.DataFrame(devs_data)
print(f"✅ Generated {len(df_devs)} developers.")

# --- 2. TABLE: SPRINT_CONTEXT ---
# Simulating the last 5 sprints
sprints_data = []
for i in range(1, 160):
    sprints_data.append({
        'sprint_id': i,
        'team_load_percentage': random.choice([80, 90, 100, 110]), 
        'is_holiday_season': 1 if i%25 == 0 else 0 
    })
df_sprints = pd.DataFrame(sprints_data) 

# --- 3. TABLE: HISTORICAL_TASKS (With Failure Logic) ---
tasks_data = []
for i in range(1, 2001): 
    assigned_dev = random.choice(devs_data)
    sprint = random.choice(sprints_data)
    est_points = random.choice([1, 2, 3, 5, 8])
    
    
    multiplier = 1.0
    if assigned_dev['experience_level'] == 'Junior': 
        multiplier = 1.8   
    elif assigned_dev['experience_level'] == 'Mid': 
        multiplier = 1.3   
    elif assigned_dev['experience_level'] == 'Senior': 
        multiplier = 0.9  
    
    # Add fatigue if team is overloaded
    if sprint['team_load_percentage'] > 100: 
        multiplier *= 1.2
    
    # Calculate final hours with slight randomness
    actual_hrs = (est_points * 8) * multiplier + random.uniform(-2, 2)
    
    # Failure Logic
    expected_hours = est_points * 8
    is_failed = 1 if actual_hrs > (expected_hours * 1.25) else 0
    
    tasks_data.append({
        'task_id': i,
        'dev_id': assigned_dev['dev_id'],
        'sprint_id': sprint['sprint_id'],
        'category': assigned_dev['primary_skill'],
        'story_points': est_points,
        'actual_hours': round(actual_hrs, 2),
        'is_failed': is_failed 
    })
df_tasks = pd.DataFrame(tasks_data)

# --- 4. NEW TABLE: SPRINT_TABLE (The 600 New Tasks to be assigned) ---
print("📝 Generating 600 unassigned tasks for the upcoming sprint...")
new_tasks = []
for i in range(1, 601):
    new_tasks.append({
        'task_id': i,
        'story_points': random.choice([1, 2, 3, 5, 8]),
        'priority': random.choice(['High', 'Medium', 'Low']),
        'status': 'Unassigned' # AI will change this later
    })
df_sprint_table = pd.DataFrame(new_tasks)

# --- 5. PUSHING TO MYSQL (Unified Order) ---
try:
    print("⏳ Clearing and updating tables for Enterprise Scale...")

    # Recreate schema explicitly so parent columns are indexed for FKs.
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        conn.execute(text("DROP TABLE IF EXISTS historical_tasks;"))
        conn.execute(text("DROP TABLE IF EXISTS sprint_table;"))
        conn.execute(text("DROP TABLE IF EXISTS sprint_context;"))
        conn.execute(text("DROP TABLE IF EXISTS developers;"))

        conn.execute(text("""
            CREATE TABLE developers (
                dev_id INT NOT NULL,
                name VARCHAR(100),
                experience_level VARCHAR(20),
                primary_skill VARCHAR(50),
                PRIMARY KEY (dev_id),
                current_load INT DEFAULT 0
            );
        """))

        conn.execute(text("""
            CREATE TABLE sprint_context (
                sprint_id INT NOT NULL,
                team_load_percentage INT,
                is_holiday_season BOOLEAN,
                PRIMARY KEY (sprint_id)
            );
        """))

        conn.execute(text("""
            CREATE TABLE historical_tasks (
                task_id INT NOT NULL,
                dev_id INT NOT NULL,
                sprint_id INT NOT NULL,
                category VARCHAR(50),
                story_points INT,
                actual_hours FLOAT,
                is_failed BOOLEAN,
                PRIMARY KEY (task_id),
                CONSTRAINT historical_tasks_ibfk_1
                    FOREIGN KEY (dev_id) REFERENCES developers(dev_id),
                CONSTRAINT historical_tasks_ibfk_2
                    FOREIGN KEY (sprint_id) REFERENCES sprint_context(sprint_id)
            );
        """))

        conn.execute(text("""
            CREATE TABLE sprint_table (
                task_id INT NOT NULL,
                story_points INT,
                priority VARCHAR(20),
                status VARCHAR(50),
                PRIMARY KEY (task_id)
            );
        """))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))

    # Insert data after schema is created.
    df_devs.to_sql('developers', con=engine, if_exists='append', index=False)
    print("✅ Table 1: 'developers' (150 rows) updated.")

    df_sprints.to_sql('sprint_context', con=engine, if_exists='append', index=False)
    print("✅ Table 2: 'sprint_context' (160 rows) updated.")

    df_tasks.to_sql('historical_tasks', con=engine, if_exists='append', index=False)
    print("✅ Table 3: 'historical_tasks' (2000 rows) updated.")

    df_sprint_table.to_sql('sprint_table', con=engine, if_exists='append', index=False)
    print("✅ Table 4: 'sprint_table' (600 rows) updated.")

    print("\n🎉 ALL SYSTEMS GO! Database is fully populated for Enterprise Testing.")

except Exception as e:
    print(f"❌ Error during database push: {e}")