import { GoogleGenAI, Type } from "@google/genai";
import { RealSatellite, AnomalyDetails } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function generateAnomalyAnalysis(satellite: RealSatellite): Promise<Omit<AnomalyDetails, 'operatorNotes'>> {
    const prompt = `
        You are the OrbitWatch AI, a sophisticated deep learning model specialized in Space Domain Awareness. Your core function is to analyze orbital data to detect potential cyber-physical threats. You are trained on vast datasets of telemetry, orbital mechanics, and known space-based threat vectors.

        Given the following Two-Line Element set (TLE) data for a live satellite:
        - Name: ${satellite.OBJECT_NAME}
        - NORAD ID: ${satellite.NORAD_CAT_ID}
        - Owner/Operator: ${satellite.OWNER}
        - Type: ${satellite.OBJECT_TYPE}
        - TLE Line 1: ${satellite.TLE_LINE1}
        - TLE Line 2: ${satellite.TLE_LINE2}

        Perform a deep threat assessment by analyzing the TLE for any characteristics that would indicate anomalous behavior. Your analysis should consider, but is not limited to:
        1.  **Anomalous Maneuvering:** Scrutinize the mean motion derivatives and BSTAR drag term. Detect any slight, unannounced changes in orbit that deviate from expected station-keeping behavior for this type of asset.
        2.  **Proximity Threats:** Based on the satellite's orbital plane, inclination, and type, assess the implied risk of a close approach to other assets. For example, an unannounced maneuver in a crowded orbit or movement towards a high-value target's orbital slot is a high-concern indicator.
        3.  **Signature Changes:** Analyze the BSTAR drag term for significant fluctuations, which could imply a change in the satellite's physical cross-section (e.g., unexpected appendage deployment) or orientation.
        4.  **Pattern-of-Life Deviations:** Compare its current orbital state to the typical behavior for satellites of its class and mission. Is it behaving erratically or out of character?

        Generate a concise, plausible, and cyber-suspicious anomaly based on your analysis. The threat could be related to spoofing, jamming, data interception, or physical threats inferred from the orbital data.

        Your response MUST be a JSON object that includes the following fields:
        1.  "description": A brief, technical description of the specific anomalous characteristic detected (e.g., "Minor inclination burn detected, inconsistent with station-keeping norms.").
        2.  "assessment": A threat assessment explaining the potential cause and impact (e.g., "The maneuver could be an attempt to reposition for signal interception of a nearby GEO satellite.").
        3.  "riskLevel": The assessed risk level. Must be one of: 'Informational', 'Low', 'Moderate', 'High', 'Critical'.
        4.  "riskScore": An ML-powered risk score from 0 to 100, representing your model's confidence in the anomaly.
        5.  "mitreTechnique": The most relevant MITRE ATT&CK for Space Technique ID and Name (e.g., "T0801: Data Manipulation").
        6.  "spartaClassification": The most relevant SPARTA threat classification ID and Name (e.g., "C0010: Disrupt Mission Communications").
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "A brief, technical description of the anomalous behavior detected."
                        },
                        assessment: {
                            type: Type.STRING,
                            description: "A threat assessment of the anomaly, explaining the potential cause and impact."
                        },
                        riskLevel: {
                            type: Type.STRING,
                            description: "The assessed risk level. Must be one of: 'Informational', 'Low', 'Moderate', 'High', 'Critical'."
                        },
                        riskScore: {
                            type: Type.NUMBER,
                            description: "An ML-powered risk score from 0 to 100."
                        },
                        mitreTechnique: {
                            type: Type.STRING,
                            description: "The most relevant MITRE ATT&CK for Space Technique ID and Name."
                        },
                        spartaClassification: {
                            type: Type.STRING,
                            description: "The most relevant SPARTA threat classification ID and Name."
                        }
                    },
                    required: ["description", "assessment", "riskLevel", "riskScore", "mitreTechnique", "spartaClassification"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        // Validate risk level
        const validRiskLevels = new Set(['Informational', 'Low', 'Moderate', 'High', 'Critical']);
        if (!validRiskLevels.has(parsed.riskLevel)) {
            console.warn(`Gemini returned an invalid risk level: '${parsed.riskLevel}'. Defaulting to 'Moderate'.`);
            parsed.riskLevel = 'Moderate';
        }

        return parsed;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate AI analysis.");
    }
}