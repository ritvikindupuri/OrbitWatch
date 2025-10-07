import React, { useMemo } from 'react';
import { AnomalyAlert } from '../types';
import { getRiskColor, getRiskHoverColor } from '../constants';
import { RiskDistributionChart } from './RiskDistributionChart';
import { AnomalyDetailView } from './AnomalyDetailView';
import { DeploymentContextWidget } from './DeploymentContextWidget';

interface DashboardPanelProps {
  alerts: AnomalyAlert[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSatelliteId: number | null;
  onSelectSatellite: (satelliteId: number | null) => void;
  onArchiveAlert: (satelliteId: number) => void;
  onOpenArchive: () => void;
  onSaveNotes: (noradId: number, notes: string) => void;
  // Analysis props
  onAnalysisToggle: () => void;
  isAnalysisActive: boolean;
  analysisInterval: number;
  setAnalysisInterval: (interval: number) => void;
  // Filter props
  filterOptions: { countries: string[], types: string[] };
  countryFilter: string;
  setCountryFilter: (country: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  isSystemReady: boolean;
}

const AnomalyItem: React.FC<{
    alert: AnomalyAlert;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ alert, isSelected, onSelect }) => {
    const riskColor = getRiskColor(alert.details?.riskLevel);
    const hoverColor = getRiskHoverColor(alert.details?.riskLevel);
    
    return (
        <div 
            onClick={onSelect}
            className={`p-3 rounded-md border-l-4 transition-all cursor-pointer ${riskColor}
                ${isSelected 
                    ? `bg-cyan-900/50 ring-2 ring-cyan-500`
                    : `bg-gray-800/60 ${hoverColor}`}`}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-100 truncate" title={alert.satellite.OBJECT_NAME}>
                        {alert.satellite.OBJECT_NAME}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate" title={alert.details?.description}>
                       {alert.analysisState === 'pending' ? 'Analyzing...' : (alert.details?.description || 'No details available.')}
                    </p>
                </div>
                {alert.details && (
                    <div className={`ml-2 text-right text-xs font-bold ${riskColor.replace('border', 'text')}`}>{alert.details.riskLevel}</div>
                )}
                 {alert.analysisState === 'pending' && (
                    <svg className="animate-spin ml-2 h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 )}
            </div>
        </div>
    )
}

const FilterControl: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    disabled: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
    <div className="flex-1">
        <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full p-1.5 text-sm bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
            <option value="all">All</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const LiveAnalysisControl: React.FC<{
    onAnalysisToggle: () => void;
    isActive: boolean;
    disabled: boolean;
    interval: number;
    setInterval: (interval: number) => void;
}> = ({ onAnalysisToggle, isActive, disabled, interval, setInterval }) => (
  <div className={`p-3 bg-gray-800/50 rounded-lg space-y-3 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex justify-between items-start">
        <div>
            <p className="text-sm font-bold text-gray-200">Live Threat Analysis</p>
            <p className="text-xs text-gray-400 font-mono">
              Status: <span className={isActive ? 'text-green-400' : 'text-gray-500'}>{isActive ? 'Active' : 'Idle'}</span>
            </p>
        </div>
        <button
          onClick={onAnalysisToggle}
          disabled={disabled}
          className={`px-3 py-1.5 text-xs font-bold text-white rounded-md transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed ${
            isActive 
              ? 'bg-orange-600 hover:bg-orange-500' 
              : 'bg-cyan-700 hover:bg-cyan-600'
          }`}
        >
          {isActive ? 'Disable Analysis' : 'Enable Analysis'}
        </button>
    </div>
    <div className="pt-1">
        <label htmlFor="interval-slider" className="block text-xs font-semibold text-gray-400 mb-1">
            Alert Generation Rate: <span className="font-bold text-cyan-300">{(interval / 1000).toFixed(1)}s</span>
        </label>
        <input
            id="interval-slider"
            type="range"
            min="3000"
            max="15000"
            step="1000"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            disabled={disabled || isActive}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:bg-cyan-400 [&::-moz-range-thumb]:bg-cyan-400"
        />
    </div>
    <p className="text-center text-[10px] text-gray-600 pt-1">
      AI actively analyzing telemetry from ISS & ESA assets.
    </p>
  </div>
);


export const DashboardPanel: React.FC<DashboardPanelProps> = ({ 
    alerts,
    searchQuery,
    setSearchQuery,
    selectedSatelliteId,
    onSelectSatellite,
    onArchiveAlert,
    onOpenArchive,
    onSaveNotes,
    onAnalysisToggle,
    isAnalysisActive,
    analysisInterval,
    setAnalysisInterval,
    filterOptions,
    countryFilter,
    setCountryFilter,
    typeFilter,
    setTypeFilter,
    isSystemReady,
}) => {
    
    const selectedAlert = useMemo(() => {
        return alerts.find(s => s.satellite.NORAD_CAT_ID === selectedSatelliteId) || null;
    }, [selectedSatelliteId, alerts]);
    
    if (selectedAlert) {
        return (
             <div className="w-[600px] bg-gray-900/90 backdrop-blur-sm flex flex-col border-l border-gray-700/50 shadow-2xl">
                <AnomalyDetailView 
                    alert={selectedAlert}
                    onBack={() => onSelectSatellite(null)}
                    onArchive={() => onArchiveAlert(selectedAlert.satellite.NORAD_CAT_ID)}
                    onSaveNotes={onSaveNotes}
                />
             </div>
        )
    }

    return (
        <div className="w-[600px] bg-gray-900/90 backdrop-blur-sm flex flex-col border-l border-gray-700/50 shadow-2xl">
            <div className="p-4 bg-gray-950/50 border-b border-gray-700/50">
                <div className="flex justify-between items-center">
                     <h2 className="text-xl font-bold tracking-wider text-gray-100">Anomaly Feed</h2>
                     <div className="flex items-center space-x-2">
                         <button 
                            onClick={onOpenArchive}
                            title="View Archived Analyses"
                            className="p-2 text-gray-400 hover:text-cyan-400 transition-colors rounded-md hover:bg-gray-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </button>
                     </div>
                </div>
            </div>

            <div className="p-4 border-b border-gray-700/50 space-y-4">
                 <RiskDistributionChart alerts={alerts} />
                 <LiveAnalysisControl
                    onAnalysisToggle={onAnalysisToggle}
                    isActive={isAnalysisActive}
                    disabled={!isSystemReady}
                    interval={analysisInterval}
                    setInterval={setAnalysisInterval}
                 />
                 <DeploymentContextWidget />
                 <div className="flex space-x-2">
                     <FilterControl label="Country of Origin" value={countryFilter} onChange={setCountryFilter} options={filterOptions.countries} disabled={!isSystemReady} />
                     <FilterControl label="Object Type" value={typeFilter} onChange={setTypeFilter} options={filterOptions.types} disabled={!isSystemReady} />
                 </div>
                 <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isSystemReady ? "Search name, NORAD ID, risk..." : "System initializing..."}
                    disabled={!isSystemReady}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-800/50 disabled:placeholder:text-gray-600"
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {!isSystemReady && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <p className="mt-2 font-semibold">Waiting for Live Data</p>
                        <p className="text-sm">System is initializing satellite catalog...</p>
                    </div>
                )}
                {isSystemReady && alerts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <p className="mt-2 font-semibold">No active anomalies.</p>
                        <p className="text-sm">Enable live analysis to begin threat detection.</p>
                    </div>
                )}
                {searchQuery && alerts.length === 0 && isSystemReady && (
                     <div className="flex items-center justify-center h-full text-gray-500 text-center">
                        <p>No matching alerts found for your search.</p>
                    </div>
                )}
                {alerts.map((alert) => (
                    <AnomalyItem 
                        key={`${alert.satellite.NORAD_CAT_ID}-${alert.timestamp}`}
                        alert={alert}
                        isSelected={alert.satellite.NORAD_CAT_ID === selectedSatelliteId}
                        onSelect={() => onSelectSatellite(alert.satellite.NORAD_CAT_ID)}
                    />
                ))}
            </div>
             <div className="p-2 text-center text-xs text-gray-600 font-mono border-t border-gray-700/50">
                Session data is not persisted.
            </div>
        </div>
    );
};