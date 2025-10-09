<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# **OrbitWatch: AI-Powered Satellite Threat Detection**

OrbitWatch is a sophisticated, web-based Space Domain Awareness (SDA) application that leverages the power of Google's Gemini AI to perform real-time threat analysis on live satellite data. It provides a clean, intuitive interface for visualizing satellite orbits and, with a single click, delivers a deep, AI-driven assessment of potential anomalies and cyber-physical threats.

This project is designed not only as a powerful tool for modern space security but also as a premier portfolio piece to showcase advanced frontend development and the seamless integration of cutting-edge AI services.

---

### **Live Demo**

**[LINK TO YOUR DEPLOYED APPLICATION]**

---

### **Architecture: Modern, Decoupled, and AI-Driven**

This application is built with a modern, decoupled architecture that ensures a fast, responsive user experience while harnessing the power of a world-class AI model for analysis.

*   **Frontend:** A dynamic, single-page application built with **React** and **TypeScript**, providing a rich and interactive user interface.
*   **Backend:** Instead of a traditional, self-hosted backend, OrbitWatch communicates directly with the **Google Gemini API**. This serverless approach simplifies deployment, enhances scalability, and allows the application to benefit from one of the most powerful generative AI models available.

This architecture means you do not need to run a separate backend server. All the heavy lifting of the ML analysis is handled by Google's infrastructure.

---

### **Prerequisites**

To run this project locally, you will need the following:

*   **Node.js:** (v18 or higher recommended) - [Download here](https://nodejs.org/)
*   **npm:** (comes with Node.js)
*   **Google AI Studio Account:** To get the required API key.
    *   [Visit Google AI Studio](https://ai.studio.google.com/) and create a free account.
    *   Once logged in, navigate to the "API Keys" section to generate your key.

---

### **Setup: A Flawless, Step-by-Step Guide**

Follow these instructions carefully to ensure a smooth, error-free setup.

1.  **Clone the Repository:**
    ```bash
    git clone [URL_OF_YOUR_REPOSITORY]
    cd [REPOSITORY_DIRECTORY]
    ```

2.  **Install Dependencies:**
    This project uses `npm` for package management. Run the following command in the root directory to install all necessary frontend libraries:
    ```bash
    npm install
    ```
    This will create a `node_modules` directory with all the required packages.

3.  **Configure Your Environment Variables:**
    The application requires an API key to communicate with the Google Gemini service.
    *   Create a new file in the root directory named `.env.local`.
    *   Copy the contents of `.env.local.example` into your new `.env.local` file.
    *   Replace `"YOUR_API_KEY_HERE"` with the actual API key you obtained from Google AI Studio.

    Your `.env.local` file should look like this:
    ```
    # Google AI Studio API Key
    # Get yours from https://ai.studio/
    API_KEY="AIzaSy...YOUR...ACTUAL...KEY"
    ```

4.  **Run the Application:**
    Once the dependencies are installed and your API key is configured, you can start the local development server:
    ```bash
    npm run dev
    ```
    This command will launch the application, and you can view it in your web browser at the local address provided (usually `http://localhost:5173`).

---

### **How It Works**

1.  **Real-Time Data Ingestion:** The application fetches live satellite orbital data (in TLE format) directly from **CelesTrak**, a public, authoritative source for space situational awareness data.
2.  **Interactive Visualization:** The frontend parses this data and renders the satellites and their orbits on an interactive globe.
3.  **AI-Powered Analysis:** When you click "Start ML Analysis," the application sends the TLE data for a selected satellite to the **Google Gemini API**.
4.  **Threat Assessment:** A specialized prompt instructs the Gemini model to act as a deep learning system for space security. It analyzes the orbital data for anomalies related to maneuvering, proximity threats, and pattern-of-life deviations.
5.  **Structured Response:** The AI returns a detailed analysis in a structured JSON format, including a risk score, a description of the anomaly, and a mapping to the MITRE ATT&CK® for Space and SPARTA threat frameworks.
6.  **Displaying Results:** The frontend then displays this information in a clear, easy-to-understand format, highlighting any satellites with detected anomalies.

---

### **Technologies Used**

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite
*   **AI & Data:**
    *   Google Gemini API
    *   CelesTrak API
*   **Deployment:**
    *   (Add your deployment platform here, e.g., Vercel, Netlify, AWS)