import pandas as pd
import numpy as np
import xgboost as xgb
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

# --- Configuration ---
DATA_PATH = "backend/satellite_data_processed.csv"
MODELS_DIR = "backend/trained_models"
XGB_MODEL_PATH = os.path.join(MODELS_DIR, "xgb_model.json")
CNN_MODEL_PATH = os.path.join(MODELS_DIR, "cnn_model.keras")
ISO_FOREST_MODEL_PATH = os.path.join(MODELS_DIR, "iso_forest_model.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.joblib")

# --- Features ---
# Using a subset of numeric features from the TLE data
FEATURES = [
    'inclination', 'raan', 'eccentricity', 'arg_of_perigee',
    'mean_anomaly', 'mean_motion', 'bstar_drag',
    'first_derivative_mean_motion'
]
TARGET = 'anomaly_label'

# --- Model Training ---
def load_and_preprocess_data(path: str):
    """Loads and preprocesses the satellite data."""
    print("Loading and preprocessing data...")
    df = pd.read_csv(path)
    df = df.dropna(subset=FEATURES + [TARGET])

    X = df[FEATURES]
    y = df[TARGET]

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Save the scaler for later use in the API
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
    joblib.dump(scaler, SCALER_PATH)
    print(f"Scaler saved to {SCALER_PATH}")

    return X_scaled, y, X.columns

def train_xgboost_classifier(X_train, y_train):
    """Trains and saves an XGBoost classifier."""
    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)

    model.save_model(XGB_MODEL_PATH)
    print(f"XGBoost model saved to {XGB_MODEL_PATH}")
    return model

def train_cnn_model(X_train, y_train):
    """Trains and saves a 1D CNN model."""
    print("Training 1D CNN model...")
    # Reshape data for 1D CNN (samples, timesteps, features)
    X_train_cnn = np.expand_dims(X_train, axis=2)

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(X_train.shape[1], 1)),
        tf.keras.layers.Conv1D(filters=32, kernel_size=3, activation='relu'),
        tf.keras.layers.MaxPooling1D(pool_size=2),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(50, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])

    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(X_train_cnn, y_train, epochs=10, batch_size=32, verbose=0)

    model.save(CNN_MODEL_PATH)
    print(f"CNN model saved to {CNN_MODEL_PATH}")
    return model

def train_isolation_forest(X_train_unsupervised):
    """Trains and saves an Isolation Forest model."""
    print("Training Isolation Forest model...")
    # Isolation Forest is unsupervised, so it doesn't use labels.
    # We train it on the "normal" data to learn its structure.
    model = IsolationForest(contamination='auto', random_state=42)
    model.fit(X_train_unsupervised)

    joblib.dump(model, ISO_FOREST_MODEL_PATH)
    print(f"Isolation Forest model saved to {ISO_FOREST_MODEL_PATH}")
    return model

# --- Main Execution ---
def main():
    """Main function to run the model training pipeline."""
    # 1. Load Data
    X, y, feature_names = load_and_preprocess_data(DATA_PATH)

    # 2. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 3. Train Models
    train_xgboost_classifier(X_train, y_train)
    train_cnn_model(X_train, y_train)

    # For Isolation Forest, we'll train on the portion of the training data that is "normal"
    X_train_normal = X_train[y_train == 0]
    train_isolation_forest(X_train_normal)

    print("\nAll models trained and saved successfully.")

if __name__ == "__main__":
    main()