import { RealSatellite, AnomalyDetails } from "../types";

// The URL for the Python backend API
const API_URL = "http://127.0.0.1:5001/analyze";

/**
 * Calls the backend ML service to get a threat assessment for a satellite.
 * @param satellite The satellite to analyze.
 * @returns A promise that resolves to the anomaly details from the model.
 */
export async function generateAnomalyAnalysis(satellite: RealSatellite): Promise<Omit<AnomalyDetails, 'operatorNotes'>> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Pass the TLE data to the backend
                TLE_LINE1: satellite.TLE_LINE1,
                TLE_LINE2: satellite.TLE_LINE2,
            }),
        });

        if (!response.ok) {
            // Try to get a more specific error message from the backend
            const errorData = await response.json().catch(() => ({ message: "The analysis service returned an invalid response." }));
            throw new Error(errorData.error || `Request failed with status: ${response.status}`);
        }

        const analysisResult: Omit<AnomalyDetails, 'operatorNotes'> = await response.json();

        // A simple validation to ensure the response has the expected structure
        if (!analysisResult.riskLevel || typeof analysisResult.riskScore !== 'number') {
            throw new Error("Invalid analysis format received from the server.");
        }

        return analysisResult;

    } catch (error) {
        console.error("Error calling analysis service:", error);
        // Re-throw a user-friendly error to be caught by the UI
        throw new Error("The backend analysis service is unavailable. Please ensure it is running.");
    }
}