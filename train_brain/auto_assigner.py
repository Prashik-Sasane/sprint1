import joblib
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import urllib.parse
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent  # /train_brain
MODEL_DIR = BASE_DIR.parent


user = os.getenv("DB_USER", "root")
raw_password = os.getenv("DB_PASSWORD", "")
host = os.getenv("DB_HOST", "db")
db = os.getenv("DB_NAME", "smart_planner")
password = urllib.parse.quote_plus(raw_password)
engine = create_engine(f"mysql+pymysql://{user}:{password}@{host}/{db}")

try:
    time_model = joblib.load(MODEL_DIR / 'time_model.pkl')
    risk_model = joblib.load(MODEL_DIR / 'risk_model.pkl')
    print("✅ Auto-Assigner: Models loaded successfully from Root.")
except Exception as e:
    print(f"❌ Auto-Assigner Model Error: {e}")
    time_model = None
    risk_model = None

def run_auto_assignment():
    if time_model is None or risk_model is None:
        return {"status": "error", "message": "Models are not loaded."}
    try:
        # Ensure schema columns exist.
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE sprint_table MODIFY COLUMN status VARCHAR(50)"))
            try:
                conn.execute(text("ALTER TABLE sprint_table ADD COLUMN assigned_to VARCHAR(255)"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE sprint_table ADD COLUMN predicted_hours FLOAT"))
            except Exception:
                pass

        tasks_df = pd.read_sql("SELECT * FROM sprint_table WHERE status = 'Unassigned'", con=engine)
        devs_df = pd.read_sql("SELECT * FROM developers", con=engine)

        if tasks_df.empty or devs_df.empty:
            return {"status": "error", "message": "No unassigned tasks or developers found."}

        devs_df['remaining_hours'] = 40.0
        level_map = {'Junior': 1, 'Mid': 2, 'Senior': 3}
        devs_df['lv_val'] = devs_df['experience_level'].map(level_map)

        assignments = []
        tasks_df = tasks_df.sort_values(by='story_points', ascending=False)
        print(f"⚡ Turbo Assigning {len(tasks_df)} tasks...")

        for _, task in tasks_df.iterrows():
            input_data = pd.DataFrame({
                'story_points': [task['story_points']] * len(devs_df),
                'experience_level': devs_df['lv_val'].values,
                'team_load_percentage': [100] * len(devs_df)
            })

            all_times = time_model.predict(input_data)
            all_risks = risk_model.predict_proba(input_data)[:, 1]
            costs = all_times + (all_risks * 20)
            can_fit = devs_df['remaining_hours'].values >= all_times

            if np.any(can_fit):
                valid_indices = np.where(can_fit)[0]
                best_idx = valid_indices[np.argmin(costs[valid_indices])]

                dev_name = devs_df.at[best_idx, 'name']
                pred_time = all_times[best_idx]
                devs_df.at[best_idx, 'remaining_hours'] -= pred_time

                assignments.append({
                    'task_id': task['task_id'],
                    'assigned_to': dev_name,
                    'predicted_hours': round(float(pred_time), 2),
                    'status': 'Assigned'
                })

        if not assignments:
            return {"status": "error", "message": "No feasible assignments generated."}

        results_df = pd.DataFrame(assignments)
        results_df.to_sql('temp_assignments', con=engine, if_exists='replace', index=False)

        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE sprint_table s
                JOIN temp_assignments t ON s.task_id = t.task_id
                SET s.assigned_to = t.assigned_to,
                    s.status = t.status,
                    s.predicted_hours = t.predicted_hours
            """))
            conn.execute(text("DROP TABLE temp_assignments"))

        print(f"🎉 Done! All {len(assignments)} tasks assigned.")
        return {"status": "success", "assigned": len(assignments)}
    except Exception as e:
        return {"status": "error", "message": str(e)}