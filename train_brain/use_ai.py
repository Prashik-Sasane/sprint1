import joblib
import pandas as pd
import numpy as np
import urllib.parse
import os
from sqlalchemy import create_engine, text
from pathlib import Path
from dotenv import load_dotenv

# --- 1. PATH & ENV SETUP ---
load_dotenv()
# BASE_DIR is /train_brain | MODEL_DIR is the root folder /sprint_planer/
BASE_DIR = Path(__file__).resolve().parent  
MODEL_DIR = BASE_DIR.parent                 

# --- 2. DATABASE CONFIG ---
user = os.getenv("DB_USER", "root")
password = urllib.parse.quote_plus(os.getenv("DB_PASSWORD", ""))
host = os.getenv("DB_HOST", "db")
db_name = os.getenv("DB_NAME", "smart_planner")

# Create Engine
engine = create_engine(f"mysql+pymysql://{user}:{password}@{host}/{db_name}")

# Global variables for ML models
time_model = None
risk_model = None

def initialize_models():
    global time_model, risk_model
    try:
        # Loading .pkl files from the Root folder (MODEL_DIR)
        time_model = joblib.load(MODEL_DIR / 'time_model.pkl')
        risk_model = joblib.load(MODEL_DIR / 'risk_model.pkl')
        print(f"✅ AI Inference: Models loaded successfully from {MODEL_DIR}")
    except Exception as e:
        print(f"❌ AI Inference Model Error: {e}")

# Run the loader once when the script starts
initialize_models()

# --- 3. HELPER: DATABASE BOOKING ---

def get_and_book_dev(level_name, hours):
    """
    Finds the least-loaded dev using 'dev_id' and updates their load in the DB.
    """
    query = text("""
        SELECT dev_id, name FROM developers 
        WHERE experience_level = :level 
        AND (current_load + :hours) <= max_capacity
        ORDER BY current_load ASC 
        LIMIT 1
    """)
    
    with engine.begin() as conn:
        result = conn.execute(query, {"level": level_name, "hours": hours}).fetchone()
        
        if result:
            db_id, dev_name = result
            conn.execute(
                text("UPDATE developers SET current_load = current_load + :hours WHERE dev_id = :id"),
                {"hours": hours, "id": db_id}
            )
            return [dev_name]
        
        return ["Resource Full"]

# --- 4. MAIN PROCESSOR ---

def process_tasks(tasks, team_load_input, user_deadline=40.0):
    global time_model, risk_model
    if time_model is None or risk_model is None:
        return []

    # Reset all developer loads to 0 for a fresh simulation
    with engine.begin() as conn:
        conn.execute(text("UPDATE developers SET current_load = 0"))

    # --- WEIGHTING CONFIGURATION ---
    # High Time weight (0.7) makes the 'Balanced' pick focus on the 40h deadline 
    # instead of just the AI's risk probability.
    TIME_WEIGHT = 0.7 
    RISK_WEIGHT = 0.3

    analysis_results = []
    levels = {1: "Junior", 2: "Mid", 3: "Senior"}

    for task in tasks:
        all_levels_data = {}  # Dictionary to store stats for all 3 levels
        options_list = []
        
        # Support both Pydantic objects (FastAPI) and standard Dictionaries
        sp = task.story_points if hasattr(task, 'story_points') else task['story_points']
        tid = task.task_id if hasattr(task, 'task_id') else task['task_id']

        # 1. GENERATE PREDICTIONS FOR EVERY LEVEL
        for val, name in levels.items():
            feat = pd.DataFrame([[sp, val, team_load_input]], 
                                columns=['story_points', 'experience_level', 'team_load_percentage'])
            
            time_pred = float(time_model.predict(feat)[0])
            risk_score = float(risk_model.predict_proba(feat)[0][1]) # 0.0 to 1.0
            
            # Calculate Weighted Score for the Physical Pick
            weighted_score = (time_pred * TIME_WEIGHT) + (risk_score * 100 * RISK_WEIGHT)
            
            level_stats = {
                "level": name,
                "hours": round(time_pred, 2),
                "risk_pct": round(risk_score * 100, 1),
                "score": weighted_score,
                "on_time": time_pred <= user_deadline
            }
            
            all_levels_data[name.lower()] = level_stats
            options_list.append(level_stats)

        # 2. SELECTION STRATEGIES
        
        # Strategy A: AI Suggestion (Strictly the lowest risk/safest path)
        ai_pick = sorted(options_list, key=lambda x: x['risk_pct'])[0]
        
        # Strategy B: Balanced Suggestion (The Physical Pick)
        # Filters for developers who actually finish before the 40h deadline
        on_time_opts = [o for o in options_list if o['on_time']]
        
        if on_time_opts:
            # Picks the one with the best weighted score (prioritizing time)
            bal_pick = sorted(on_time_opts, key=lambda x: x['score'])[0]
        else:
            # Fallback to the fastest level if everyone is over 40h
            bal_pick = sorted(options_list, key=lambda x: x['hours'])[0]

        # 3. DATABASE BOOKING
        # We book based on the Balanced Suggestion to update developer availability
        assigned_devs = get_and_book_dev(bal_pick['level'], bal_pick['hours'])

        # 4. CONSTRUCT RESPONSE
        analysis_results.append({
            "task_id": int(tid),
            "full_comparison": all_levels_data, # Detailed stats for Junior, Mid, Senior
            "ai_suggestion": {
                "strategy": "Safety-First (Lowest Risk)",
                "level": str(ai_pick['level']),
                "hours": ai_pick['hours'],
                "risk": ai_pick['risk_pct']
            },
            "balanced_suggestion": {
                "strategy": "Physical (Time & Resource Efficient)",
                "level": str(bal_pick['level']),
                "hours": bal_pick['hours'],
                "risk": bal_pick['risk_pct'],
                "assigned_to": assigned_devs
            }
        })

    return analysis_results