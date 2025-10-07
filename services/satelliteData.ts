import { RealSatellite } from '../types';

const ISS_TLE_API_URL = 'https://celestrak.com/NORAD/elements/gp.php?GROUP=stations&FORMAT=json';
// Using 'galileo' as a representative group for major ESA operational satellites.
const ESA_TLE_API_URL = 'https://celestrak.com/NORAD/elements/gp.php?GROUP=galileo&FORMAT=json';

async function fetchTleData(url: string, source: string): Promise<RealSatellite[]> {
    try {
        // Use a cache-busting parameter to ensure fresh data
        const response = await fetch(`${url}&_=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`TLE API for ${source} failed with status: ${response.status}`);
        }
        
        const responseText = await response.text();
        let data: any[];

        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error(`Failed to parse JSON from ${source}. The API may be down or returned an error page. Response was:`, responseText);
            throw new Error(`Invalid JSON response from ${source}.`);
        }

        if (!Array.isArray(data)) {
            console.error(`Expected an array from ${source} but received something else:`, data);
            throw new Error(`Unexpected data format from ${source}.`);
        }

        const mappedData = data.map(sat => ({
            OBJECT_NAME: sat.OBJECT_NAME,
            NORAD_CAT_ID: sat.NORAD_CAT_ID,
            TLE_LINE1: sat.TLE_LINE1,
            TLE_LINE2: sat.TLE_LINE2,
            OWNER: sat.COUNTRY_CODE || 'N/A',
            OBJECT_TYPE: sat.OBJECT_TYPE,
            LAUNCH_DATE: sat.LAUNCH_DATE,
        }));
        
        // Validate that TLE data is present before returning
        const validData = mappedData.filter(sat => {
            if (sat.TLE_LINE1 && sat.TLE_LINE2) {
                return true;
            }
            console.warn(`Excluding satellite ${sat.NORAD_CAT_ID} (${sat.OBJECT_NAME}) due to missing TLE data.`);
            return false;
        });

        return validData;

    } catch (error) {
        console.error(`Fatal: Could not fetch or parse satellite data from ${source}.`, error);
        return [];
    }
}

export async function fetchLiveSatelliteCatalog(): Promise<RealSatellite[]> {
    console.log("Fetching real-time satellite data from ISS & ESA feeds...");
    
    const [stationsData, galileoData] = await Promise.all([
        fetchTleData(ISS_TLE_API_URL, "ISS"),
        fetchTleData(ESA_TLE_API_URL, "ESA Operations")
    ]);

    const combinedData = [...stationsData, ...galileoData];

    // Deduplicate based on NORAD_CAT_ID, as a satellite might appear in multiple lists
    const uniqueSats = Array.from(new Map(combinedData.map(sat => [sat.NORAD_CAT_ID, sat])).values());
    
    console.log(`Successfully ingested ${uniqueSats.length} active satellite TLEs.`);
    return uniqueSats;
}