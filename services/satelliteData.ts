import { RealSatellite } from '../types';

const ISS_TLE_API_URL = 'https://celestrak.com/NORAD/elements/gp.php?GROUP=stations&FORMAT=json-tle';
// Using 'galileo' as a representative group for major ESA operational satellites.
const ESA_TLE_API_URL = 'https://celestrak.com/NORAD/elements/gp.php?GROUP=galileo&FORMAT=json-tle';

function inferOwnerFromName(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('css') || lowerName.includes('shenzhou') || lowerName.includes('tianhe') || lowerName.includes('wentian') || lowerName.includes('mengtian') || lowerName.includes('tianzhou')) return 'China';
    if (lowerName.includes('iss')) return 'Multi-national';
    if (lowerName.includes('soyuz') || lowerName.includes('progress') || lowerName.includes('kosmos')) return 'Russia';
    if (lowerName.includes('dragon') || lowerName.includes('cygnus') || lowerName.includes('starlink')) return 'USA';
    if (lowerName.includes('gsat')) return 'India';
    if (lowerName.includes('galileo')) return 'ESA';
    return 'N/A';
}

async function fetchTleData(url: string, source: string): Promise<RealSatellite[]> {
    try {
        // Use a cache-busting parameter to ensure fresh data
        const response = await fetch(`${url}&_=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`TLE API for ${source} failed with status: ${response.status}`);
        }
        
        const tleData = await response.text();
        const lines = tleData.trim().split(/\r?\n/);
        const satellites: RealSatellite[] = [];

        for (let i = 0; i < lines.length; i += 3) {
            const name = lines[i].trim();
            const tle1 = lines[i + 1]?.trim();
            const tle2 = lines[i + 2]?.trim();

            if (name && tle1 && tle2) {
                const noradId = parseInt(tle1.substring(2, 7), 10);
                if (!isNaN(noradId)) {
                    satellites.push({
                        OBJECT_NAME: name,
                        NORAD_CAT_ID: noradId,
                        TLE_LINE1: tle1,
                        TLE_LINE2: tle2,
                        OWNER: inferOwnerFromName(name),
                        OBJECT_TYPE: 'UNKNOWN',
                        LAUNCH_DATE: 'N/A',
                    });
                }
            }
        }
        return satellites;

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