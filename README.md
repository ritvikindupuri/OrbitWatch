<div align="center">
  <img width="1200" height="475" alt="OrbitWatch Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# **OrbitWatch: ML-Powered Satellite Anomaly Detection System**

OrbitWatch is a sophisticated, full-stack web application designed to monitor earth-orbiting satellites in real-time and identify anomalous behavior using a custom-trained machine learning backend. It provides a dynamic, interactive 3D globe visualization and a dashboard that flags potential threats based on live satellite telemetry data.

This project demonstrates a complete end-to-end development cycle, from data acquisition and model training to building a responsive frontend and a robust backend API.

---

## **Key Features**

*   **Real-Time Satellite Tracking:** Ingests live orbital data from CelesTrak to plot the positions of active satellites on an interactive 3D globe.
*   **ML-Powered Anomaly Detection:** Utilizes a powerful Python backend to analyze satellite data and flag deviations from normal operational behavior.
*   **Diverse Model Backend:** Employs a suite of three distinct machine learning models (XGBoost, a 1D CNN, and an Isolation Forest) to provide a robust and varied analysis of potential anomalies.
*   **Interactive Dashboard:** A comprehensive dashboard to view active alerts, filter data, and inspect the details of any detected anomaly, including risk scores and threat classifications (mapped to MITRE ATT&CK® for Space and SPARTA).
*   **Data Archiving:** Allows users to save detailed anomaly assessments as JSON files for offline analysis and record-keeping.

---

## **Technical Architecture**

The application is built with a modern, decoupled full-stack architecture.

### **Frontend**
*   **Framework:** React with TypeScript
*   **Build Tool:** Vite
*   **Mapping:** Leaflet for the 2D/3D globe visualization
*   **Styling:** Tailwind CSS

### **Backend**
*   **Framework:** Flask (Python)
*   **API:** RESTful API to serve ML model predictions.
*   **CORS:** `Flask-Cors` for handling cross-origin requests from the frontend.

### **Machine Learning Pipeline**
*   **Models:**
    *   **XGBoost Classifier:** For gradient-boosted decision tree analysis.
    *   **1D Convolutional Neural Network (CNN):** Built with TensorFlow/Keras to detect patterns in orbital parameter sequences.
    *   **Isolation Forest:** An unsupervised learning algorithm from Scikit-learn, excellent for anomaly detection.
*   **Data Source:**
    *   **Live Data:** The application fetches live satellite Two-Line Element (TLE) data from [CelesTrak](https://celestrak.com/).
    *   **Training Data:** The models are trained on a comprehensive dataset of active satellites from CelesTrak, which is synthetically enhanced with realistic anomalies to train the models to recognize potential threats.

---

## **Getting Started: Installation & Setup**

These instructions will guide you through setting up and running the entire application locally, assuming a fresh environment on a Unix-like system (Linux, macOS).

### **Prerequisites**

*   **Git:** For cloning the repository.
*   **A command-line terminal:** To run installation and server commands.
*   **`curl` or `wget`:** Usually pre-installed. Needed for installing `pyenv` and `nvm`.

### **Step 1: Clone the Repository**

First, clone this repository to your local machine.

```bash
git clone <repository-url>
cd <repository-directory>
```

### **Step 2: Backend Setup (Python)**

The backend serves the ML models. It needs to be running before you start the frontend.

**a) Install and Configure Python**

We recommend using `pyenv` to manage Python versions to avoid conflicts with your system's default Python.

```bash
# Install pyenv
curl https://pyenv.run | bash

# Add pyenv to your shell's startup file (e.g., .bashrc, .zshrc)
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init --path)"' >> ~/.zshrc

# Restart your shell or source the file
source ~/.zshrc

# Install a specific Python version (e.g., 3.11.4)
pyenv install 3.11.4
pyenv global 3.11.4
```

**b) Create and Activate a Virtual Environment**

This isolates the project's dependencies.

```bash
python -m venv venv
source venv/bin/activate
```

**c) Install Python Dependencies**

Navigate to the `backend` directory and install the required packages.

```bash
cd backend
pip install -r requirements.txt
```

**d) Prepare Data and Train Models (One-Time Setup)**

These scripts will download the satellite data and train the three ML models. This may take a few minutes.

```bash
python data_preparation.py
python models.py
```
*You should see output indicating that the models were trained and saved in the `backend/trained_models` directory.*

**e) Run the Backend Server**

Start the Flask API server. It will run on `http://127.0.0.1:5001`.

```bash
python app.py
```
**Leave this terminal window running.** The backend is now ready.

### **Step 3: Frontend Setup (Node.js)**

In a **new terminal window**, set up and run the React frontend.

**a) Install and Configure Node.js**

We recommend using `nvm` (Node Version Manager) to manage Node.js versions.

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Restart your shell or source your .zshrc/.bashrc file
source ~/.zshrc

# Install a recent LTS version of Node.js
nvm install 18
nvm use 18
```

**b) Install Node.js Dependencies**

From the project's root directory, run `npm install`.

```bash
# Make sure you are in the root directory of the project
npm install
```

**c) Run the Frontend Development Server**

This command will start the React application and automatically open it in your default web browser at `http://localhost:5173`.

```bash
npm run dev
```

The application is now fully running! You can interact with the globe and start the anomaly detection to see the system in action.