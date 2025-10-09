# OrbitWatch - Satellite Anomaly Detection & Analysis

OrbitWatch is a real-time satellite tracking and anomaly detection system. It provides a dynamic world map displaying the current positions of a catalog of satellites, and uses ML analysis to identify and assess potential anomalies.

## Features

- **Live Satellite Tracking**: Visualizes real-time satellite positions on a global map.
- **ML-Powered Anomaly Detection**: Automatically analyzes satellite telemetry to detect and flag potential anomalies.
- **Risk Assessment**: Provides detailed risk analysis for each detected anomaly, including severity and potential MITRE techniques.
- **Data Archiving**: Allows operators to save and load anomaly reports for later review.
- **Elasticsearch Integration**: Logs all generated anomaly alerts to an Elasticsearch instance for long-term storage and analysis.

---

## System Architecture

The system consists of two main components:

1.  **Frontend**: A React/Vite application that provides the user interface for satellite visualization and anomaly monitoring. It fetches live satellite data from CelesTrak and uses the Google Gemini API for ML analysis.
2.  **Backend**: A Node.js/Express server that acts as a secure intermediary to log data into Elasticsearch.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- An active [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- Access to an [Elasticsearch](https://www.elastic.co/downloads/elasticsearch) instance

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/orbitwatch.git
    cd orbitwatch
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    cd ..
    ```

### Environment Configuration

#### Frontend

Create a `.env.local` file in the root of the project and add your Google Gemini API key:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Backend

Create a `.env` file in the `backend` directory and add your Elasticsearch connection details:

```
# The endpoint of your Elasticsearch instance
ELASTICSEARCH_NODE=http://localhost:9200

# Optional: Credentials if your instance is secured
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
```

---

## Running the Application

You will need to run both the frontend and backend services in separate terminals.

1.  **Start the backend server:**
    ```bash
    cd backend
    npx ts-node src/index.ts
    ```
    The server will start on `http://localhost:3001`.

2.  **Start the frontend application:**
    In a new terminal, from the project root:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.