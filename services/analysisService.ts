import { RealSatellite, AnomalyDetails } from "../types";

// This is a mock analysis service. It simulates a call to a machine learning
// model to generate a threat assessment for a given satellite. In a real-world
// application, this would be replaced with a call to a live model endpoint.

export async function generateAnomalyAnalysis(satellite: RealSatellite): Promise<Omit<AnomalyDetails, 'operatorNotes'>> {
    console.log(`Requesting ML analysis for satellite: ${satellite.OBJECT_NAME} (${satellite.NORAD_CAT_ID})`);

    // Simulate network latency for the API call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    // To make the demo more interesting, we'll generate a plausible-sounding
    // anomaly. We can use the satellite's data to make it more specific.
    const descriptions = [
        `Unscheduled burn detected, inconsistent with public ephemeris data for ${satellite.OBJECT_NAME}.`,
        `Slight but significant change in inclination for ${satellite.OBJECT_NAME}.`,
        `BSTAR drag term shows anomalous fluctuation, suggesting a change in the satellite's cross-section or orientation.`,
        `Deviation from expected pattern-of-life for a ${satellite.OBJECT_TYPE} satellite in this orbit.`
    ];

    const assessments = [
        "The maneuver could be an attempt to reposition for signal interception of a nearby asset.",
        "This could indicate a test of a new, undeclared propulsion system or an evasive maneuver.",
        "Potential indicator of an undeclared payload deployment or a satellite malfunction.",
        "The behavior is suspicious and warrants closer monitoring for potential proximity threats."
    ];

    const riskLevels: AnomalyDetails['riskLevel'][] = ['Low', 'Moderate', 'High', 'Critical'];

    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomAssessment = assessments[Math.floor(Math.random() * assessments.length)];
    const randomRiskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const randomRiskScore = Math.floor(Math.random() * 60) + 40; // Score between 40 and 100

    // In a real system, these would be derived from the analysis.
    const mockAnalysis: Omit<AnomalyDetails, 'operatorNotes'> = {
        description: randomDescription,
        assessment: randomAssessment,
        riskLevel: randomRiskLevel,
        riskScore: randomRiskScore,
        mitreTechnique: "T0801: Data Manipulation", // Example
        spartaClassification: "C0010: Disrupt Mission Communications" // Example
    };

    // Simulate a chance of failure for the analysis
    if (Math.random() < 0.05) { // 5% chance of failure
        console.error(`ML analysis failed for ${satellite.OBJECT_NAME}: Simulated API error.`);
        throw new Error("The analysis model endpoint could not be reached.");
    }

    console.log(`ML analysis complete for ${satellite.OBJECT_NAME}. Risk: ${mockAnalysis.riskLevel}`);

    return mockAnalysis;
}