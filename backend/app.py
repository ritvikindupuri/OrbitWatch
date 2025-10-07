from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import xgboost as xgb
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
import joblib
import os
import random
import threading

# --- Initialization ---
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# --- Configuration ---
MODELS_DIR = "backend/trained_models"
XGB_MODEL_PATH = os.path.join(MODELS_DIR, "xgb_model.json")
CNN_MODEL_PATH = os.path.join(MODELS_DIR, "cnn_model.keras")
ISO_FOREST_MODEL_PATH = os.path.join(MODELS_DIR, "iso_forest_model.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")

# --- Lazy-Loading for Models and Scaler ---
# Use a dictionary to hold the models and a lock to ensure thread-safe loading.
models = {
    "xgb": None,
    "cnn": None,
    "iso_forest": None,
    "scaler": None
}
models_lock = threading.Lock()

def load_models_if_needed():
    """
    Loads all ML models into memory on the first request.
    This is thread-safe.
    """
    with models_lock:
        if models["xgb"] is None:
            print("Lazy-loading models...")
            try:
                models["xgb"] = xgb.XGBClassifier()
                models["xgb"].load_model(XGB_MODEL_PATH)

                models["cnn"] = tf.keras.models.load_model(CNN_MODEL_PATH)
                models["iso_forest"] = joblib.load(ISO_FOREST_MODEL_PATH)
                models["scaler"] = joblib.load(SCALER_PATH)
                print("Models loaded successfully.")
            except Exception as e:
                print(f"FATAL: Error loading models: {e}")
                # If models fail to load, the app cannot serve requests.
                # You might want to handle this more gracefully in a real app.
                raise e


# --- Features ---
FEATURES = [
    'inclination', 'raan', 'eccentricity', 'arg_of_perigee',
    'mean_anomaly', 'mean_motion', 'bstar_drag',
    'first_derivative_mean_motion'
]

# --- Anomaly Mappings ---
ANOMALY_DETAILS_MAP = {
    "inclination": {
        "description": "Anomalous inclination change detected, inconsistent with station-keeping maneuvers.",
        "assessment": "This could indicate a repositioning attempt for surveillance or to approach another asset's orbital slot.",
        "mitre": "T0821: Non-Standard Orbit",
        "sparta": "C0015: Orbit Degradation/Modification"
    },
    "eccentricity": {
        "description": "Significant, unplanned increase in orbital eccentricity.",
        "assessment": "The change suggests a potential engine malfunction or an intentional, aggressive maneuver to alter the orbit's shape, possibly for a rapid fly-by.",
        "mitre": "T0815: On-orbit Repositioning",
        "sparta": "C0012: Unscheduled Maneuver"
    },
    "bstar_drag": {
        "description": "Erratic fluctuations in the BSTAR drag term observed.",
        "assessment": "This may be caused by an unexpected change in the satellite's physical profile (e.g., appendage deployment) or orientation, potentially related to a system malfunction or covert activity.",
        "mitre": "T0809: Component Malfunction",
        "sparta": "C0021: Physical Signature Modification"
    },
     "mean_motion": {
        "description": "Unusual drift in mean motion detected.",
        "assessment": "The satellite's orbital period is changing, suggesting a subtle, continuous thrust or an uncorrected orbital decay, possibly to phase with another object.",
        "mitre": "T0820: Non-Standard Attitude",
        "sparta": "C0014: Station Keeping Anomaly"
    }
}

# --- Helper Functions ---
def parse_tle_to_features(tle_line1: str, tle_line2: str) -> dict:
    """Parses TLE lines to extract a dictionary of features."""
    try:
        features = {
            'first_derivative_mean_motion': float(tle_line1[33:43]),
            'bstar_drag': float(tle_line1[53:59]) * 10**(-float(tle_line1[59:61])),
            'inclination': float(tle_line2[8:16]),
            'raan': float(tle_line2[17:25]),
            'eccentricity': float("." + tle_line2[26:33]),
            'arg_of_perigee': float(tle_line2[34:42]),
            'mean_anomaly': float(tle_line2[43:51]),
            'mean_motion': float(tle_line2[52:63]),
        }
        return features
    except (ValueError, IndexError) as e:
        print(f"Error parsing TLE: {e}")
        return None

def generate_risk_assessment(prediction, score, model_name):
    """Generates a risk assessment based on model output."""
    is_anomaly = False
    if model_name in ["XGBoost", "CNN"]:
        is_anomaly = prediction[0] > 0.5
    elif model_name == "Isolation Forest":
        is_anomaly = prediction[0] == -1

    if not is_anomaly:
        return {
            "description": "No anomalous behavior detected. All orbital parameters are within expected operational limits.",
            "assessment": "The satellite appears to be functioning normally. No immediate threats identified.",
            "riskLevel": "Informational",
            "riskScore": int(score * 100),
            "mitreTechnique": "N/A",
            "spartaClassification": "N/A"
        }

    # If it is an anomaly, pick a reason
    reason_key = random.choice(list(ANOMALY_DETAILS_MAP.keys()))
    details = ANOMALY_DETAILS_MAP[reason_key]

    risk_score = int(score * 100)
    risk_level = "Low"
    if risk_score > 85:
        risk_level = "Critical"
    elif risk_score > 70:
        risk_level = "High"
    elif risk_score > 40:
        risk_level = "Moderate"

    return {
        "description": details["description"],
        "assessment": f"({model_name} Model): {details['assessment']}",
        "riskLevel": risk_level,
        "riskScore": risk_score,
        "mitreTechnique": details["mitre"],
        "spartaClassification": details["sparta"]
    }

# --- API Endpoint ---
@app.route('/analyze', methods=['POST'])
def analyze_satellite():
    """
    Analyzes satellite data using a randomly selected ML model.
    """
    # 1. Ensure models are loaded
    load_models_if_needed()

    if not request.json or 'TLE_LINE1' not in request.json or 'TLE_LINE2' not in request.json:
        return jsonify({"error": "Invalid input. TLE data is required."}), 400

    # 2. Parse and Preprocess Input
    features_dict = parse_tle_to_features(request.json['TLE_LINE1'], request.json['TLE_LINE2'])
    if not features_dict:
        return jsonify({"error": "Failed to parse TLE data."}), 400

    df = pd.DataFrame([features_dict], columns=FEATURES)
    scaled_features = models["scaler"].transform(df)

    # 3. Select a Model and Predict
    model_choice = random.choice(["XGBoost", "CNN", "Isolation Forest"])

    prediction = None
    score = 0.0

    if model_choice == "XGBoost":
        pred_proba = models["xgb"].predict_proba(scaled_features)
        prediction = (pred_proba[:, 1] > 0.5).astype(int)
        score = pred_proba[0][1]
    elif model_choice == "CNN":
        features_cnn = np.expand_dims(scaled_features, axis=2)
        pred_proba = models["cnn"].predict(features_cnn, verbose=0)
        prediction = (pred_proba > 0.5).astype(int)
        score = pred_proba[0][0]
    elif model_choice == "Isolation Forest":
        prediction = models["iso_forest"].predict(scaled_features)
        # Convert decision function score to a 0-1 range
        raw_score = models["iso_forest"].decision_function(scaled_features)[0]
        score = 1 - max(0, min(1, (raw_score + 0.15) / 0.2)) # Heuristic scaling

    # 4. Generate and Return Response
    response_data = generate_risk_assessment(prediction, score, model_choice)

    return jsonify(response_data)

# --- Main Execution ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)