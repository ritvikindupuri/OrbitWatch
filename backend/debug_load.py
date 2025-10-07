import tensorflow as tf
import os

# --- Configuration ---
MODELS_DIR = "backend/trained_models"
CNN_MODEL_PATH = os.path.join(MODELS_DIR, "cnn_model.keras")

# --- Load Model ---
print("Attempting to load the CNN model...")
try:
    # Set a timeout for the model loading if possible (tf doesn't support this directly)
    # We rely on the overall script execution timeout to catch hangs.
    cnn_model = tf.keras.models.load_model(CNN_MODEL_PATH)
    print("CNN model loaded successfully.")
except Exception as e:
    print(f"An error occurred while loading the CNN model: {e}")

print("Debug script finished.")