import pandas as pd
import os
from sqlalchemy import create_engine
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
import urllib.parse
from dotenv import load_dotenv

# 1. Database Connection
load_dotenv()

user = os.getenv("DB_USER", "root")
raw_password = os.getenv("DB_PASSWORD", "")
host = os.getenv("DB_HOST", "db")
db_name = os.getenv("DB_NAME", "smart_planner")
password = urllib.parse.quote_plus(raw_password)
engine = create_engine(f"mysql+pymysql://{user}:{password}@{host}/{db_name}")

# 2. Fetch the data
query = """
SELECT t.story_points, t.actual_hours, t.is_failed, d.experience_level, s.team_load_percentage 
FROM historical_tasks t
JOIN developers d ON t.dev_id = d.dev_id
JOIN sprint_context s ON t.sprint_id = s.sprint_id;
"""
df = pd.read_sql(query, con=engine)

# 3. Encoding
level_map = {'Junior': 1, 'Mid': 2, 'Senior': 3}
df['experience_level'] = df['experience_level'].map(level_map)

# 4. Define Inputs (X)
X = df[['story_points', 'experience_level', 'team_load_percentage']]

# --- BRAIN 1: THE REGRESSOR (Predicts Time) ---
# Added StandardScaler to prevent numerical bias
model_time = Pipeline([
    ('scaler', StandardScaler()),
    ('regressor', RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42))
])
model_time.fit(X, df['actual_hours'])

# --- BRAIN 2: THE CLASSIFIER (Predicts Failure Probability) ---
# Added 'class_weight=balanced' to force the AI to trust Junior/Mid data
model_risk = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier(
        n_estimators=100, 
        max_depth=10, 
        class_weight='balanced', 
        random_state=42
    ))
])
model_risk.fit(X, df['is_failed'])

# 5. Save both brains (Filenames kept exactly the same)
joblib.dump(model_time, 'time_model.pkl')
joblib.dump(model_risk, 'risk_model.pkl')

print("Phase 4.5 Training Complete: Both brains are ready!")
