import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnomalyAlert, RealSatellite, AnomalyDetails } from './types';
import { Header } from './components/Header';
import { GlobalStatsBar } from './components/GlobalStatsBar';
import { DashboardPanel } from './components/DashboardPanel';
import MapDisplay from './components/MapDisplay';
import { ArchiveModal } from './components/ArchiveModal';
import { fetchLiveSatelliteCatalog } from './services/satelliteData';
import { generateAnomalyAnalysis } from './services/analysisService';

// --- LIVE DATA MODE ---
// Setting to false uses live API calls. Mock data has been removed.
const USE_MOCK_DATA = false;

const MAX_ALERTS = 100;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<number | null>(null);
  
  // Live Data & Analysis State
  const [satelliteCatalog, setSatelliteCatalog] = useState<RealSatellite[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [archivedAlerts, setArchivedAlerts] = useState<AnomalyAlert[]>([]);
  const [isAnalysisActive, setIsAnalysisActive] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(7000);
  
  const analysisIntervalRef = useRef<number | null>(null);

  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  
  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Fetch initial satellite catalog
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const catalog = await fetchLiveSatelliteCatalog();
        if (catalog.length === 0) {
          setError("Failed to fetch satellite data. The network may be down or the API is unavailable.");
        }
        setSatelliteCatalog(catalog);
        
      } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to initialize system: ${e.message}`);
        } else {
            setError("An unknown error occurred during initialization.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadCatalog();
  }, []);


  // Core analysis logic
  useEffect(() => {
    if (isAnalysisActive && satelliteCatalog.length > 0) {
      analysisIntervalRef.current = window.setInterval(async () => {
        // Pick a random satellite that doesn't already have an active alert
        const nonAlertedSats = satelliteCatalog.filter(sat => 
            !alerts.some(alert => alert.satellite.NORAD_CAT_ID === sat.NORAD_CAT_ID)
        );
        
        if (nonAlertedSats.length === 0) {
          console.warn("Analysis tick skipped: All available satellites have active alerts.");
          // Optional: Clear alerts to allow new ones if all are alerted
          if (alerts.length === satelliteCatalog.length) {
              setAlerts([]);
          }
          return;
        }
        
        const targetSat = nonAlertedSats[Math.floor(Math.random() * nonAlertedSats.length)];

        const pendingAlert: AnomalyAlert = {
          satellite: targetSat,
          analysisState: 'pending',
          timestamp: Date.now()
        };
        
        setAlerts(prev => [pendingAlert, ...prev.slice(0, MAX_ALERTS - 1)]);
        
        try {
          const analysisDetails = await generateAnomalyAnalysis(targetSat);
            
          setAlerts(prev => prev.map(a => 
            a.timestamp === pendingAlert.timestamp 
              ? { ...a, analysisState: 'complete', details: analysisDetails }
              : a
          ));
        } catch (error) {
           console.error(`Failed to get AI analysis for ${targetSat.OBJECT_NAME}`, error);
           setAlerts(prev => prev.map(a => 
            a.timestamp === pendingAlert.timestamp 
              ? { ...a, analysisState: 'failed', details: { description: 'AI analysis failed.', assessment: 'Could not connect to the model.', riskLevel: 'Low', riskScore: 10, mitreTechnique: 'N/A', spartaClassification: 'N/A' } }
              : a
          ));
        }
      }, analysisInterval); 

    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isAnalysisActive, satelliteCatalog, alerts, analysisInterval]);


  const handleAnalysisToggle = useCallback(() => {
    if (!isAnalysisActive) {
        setAlerts([]); // Clear old alerts on new run
    }
    setIsAnalysisActive(prev => !prev);
  }, [isAnalysisActive]);

  const handleArchiveAlert = useCallback((noradId: number) => {
    const alert = alerts.find(s => s.satellite.NORAD_CAT_ID === noradId);
    if (alert) {
        const alertJson = JSON.stringify(alert, null, 2);
        const blob = new Blob([alertJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anomaly_assessment_${alert.satellite.NORAD_CAT_ID}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  }, [alerts]);
  
  const handleLoadArchives = useCallback(async (files: FileList) => {
    const loadedAlerts: AnomalyAlert[] = [];
    for (const file of Array.from(files)) {
        if (file.type === 'application/json') {
            try {
                const text = await file.text();
                const alert = JSON.parse(text) as AnomalyAlert;
                if (alert.satellite && alert.satellite.NORAD_CAT_ID) {
                    loadedAlerts.push(alert);
                }
            } catch (e) {
                console.error("Failed to parse archive file:", file.name, e);
            }
        }
    }
    setArchivedAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.satellite.NORAD_CAT_ID));
        const newUniqueAlerts = loadedAlerts.filter(a => !existingIds.has(a.satellite.NORAD_CAT_ID));
        return [...prev, ...newUniqueAlerts].sort((a, b) => (b.details?.riskLevel || '').localeCompare(a.details?.riskLevel || ''));
    });
  }, []);

  const handleSelectSatellite = useCallback((noradId: number | null) => {
    setSelectedSatelliteId(noradId);
  }, []);
  
  const handleSaveNotes = useCallback((noradId: number, notes: string) => {
    setAlerts(prevAlerts => prevAlerts.map(alert => {
        if (alert.satellite.NORAD_CAT_ID === noradId && alert.details) {
            return {
                ...alert,
                details: {
                    ...alert.details,
                    operatorNotes: notes,
                }
            };
        }
        return alert;
    }));
  }, []);

  const handleClearSession = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all session data? This will clear all archived items.")) {
        setArchivedAlerts([]);
        window.location.reload();
    }
  }, []);

  const displayedAlerts = useMemo(() => {
    return alerts.filter(alert => {
        const sat = alert.satellite;
        
        // Country Filter
        if (countryFilter !== 'all' && sat.OWNER !== countryFilter) return false;
        
        // Type Filter
        if (typeFilter !== 'all' && sat.OBJECT_TYPE !== typeFilter) return false;

        // Search Query Filter
        const searchLower = searchQuery.toLowerCase();
        if (!searchQuery) return true;
        
        const nameMatch = sat.OBJECT_NAME.toLowerCase().includes(searchLower);
        const idMatch = sat.NORAD_CAT_ID.toString().includes(searchLower);
        const countryMatch = sat.OWNER.toLowerCase().includes(searchLower);
        const riskMatch = alert.details?.riskLevel.toLowerCase().includes(searchLower);
        const stateMatch = alert.analysisState?.toLowerCase().includes(searchLower);
        
        return nameMatch || idMatch || countryMatch || riskMatch || stateMatch;
    });
  }, [alerts, searchQuery, countryFilter, typeFilter]);
  
  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const types = new Set<string>();
    satelliteCatalog.forEach(sat => {
        countries.add(sat.OWNER);
        types.add(sat.OBJECT_TYPE);
    });
    return {
        countries: Array.from(countries).sort(),
        types: Array.from(types).sort()
    };
  }, [satelliteCatalog]);

  const isSystemReady = satelliteCatalog.length > 0;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      <Header onClearSession={handleClearSession} isDemoMode={USE_MOCK_DATA} />
      <GlobalStatsBar alerts={alerts} satelliteCount={satelliteCatalog.length} />
      <main className="relative flex-1 overflow-hidden">
        <div className="flex w-full h-full">
            <div className="flex-1 h-full">
                <MapDisplay 
                    satelliteCatalog={satelliteCatalog}
                    alerts={displayedAlerts}
                    selectedSatelliteId={selectedSatelliteId}
                    onSelectSatellite={handleSelectSatellite}
                 />
            </div>
            <DashboardPanel 
                alerts={displayedAlerts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedSatelliteId={selectedSatelliteId}
                onSelectSatellite={handleSelectSatellite}
                onArchiveAlert={handleArchiveAlert}
                onOpenArchive={() => setIsArchiveOpen(true)}
                onSaveNotes={handleSaveNotes}
                onAnalysisToggle={handleAnalysisToggle}
                isAnalysisActive={isAnalysisActive}
                analysisInterval={analysisInterval}
                setAnalysisInterval={setAnalysisInterval}
                filterOptions={filterOptions}
                countryFilter={countryFilter}
                setCountryFilter={setCountryFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                isSystemReady={isSystemReady}
            />
        </div>
        {(isLoading || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-30">
                <div className="text-center">
                    {isLoading && (
                         <div className="m-4 bg-cyan-900/50 border border-cyan-600 text-cyan-300 p-4 rounded-md text-sm max-w-sm flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p>Connecting to live ISS & ESA data feeds...</p>
                        </div>
                    )}
                    {error && (
                         <div className="m-4 bg-rose-900/50 border border-rose-600 text-rose-300 p-3 rounded-md text-sm max-w-sm">
                            <strong>System Alert:</strong> {error}
                        </div>
                    )}
                </div>
            </div>
        )}
        <ArchiveModal
            isOpen={isArchiveOpen}
            onClose={() => setIsArchiveOpen(false)}
            archivedAlerts={archivedAlerts}
            onLoadArchives={handleLoadArchives}
            onClearArchives={() => setArchivedAlerts([])}
        />
      </main>
    </div>
  );
};

export default App;