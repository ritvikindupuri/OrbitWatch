import React, { useState, useEffect } from 'react';
import { AnomalyAlert, RealSatellite } from '../types';
import { getRiskColor } from '../constants';

interface AnomalyDetailViewProps {
    alert: AnomalyAlert;
    onBack: () => void;
    onArchive: () => void;
    onSaveNotes: (noradId: number, notes: string) => void;
}

const SatInfo: React.FC<{sat: RealSatellite}> = ({sat}) => (
     <div className="p-3 rounded-lg bg-gray-800/70">
        <p className="text-xs text-cyan-200/80 font-semibold uppercase">Asset Details</p>
        <p className="text-base font-bold text-gray-100 truncate">{sat.OBJECT_NAME}</p>
        <p className="text-xs text-gray-400 font-mono">NORAD: {sat.NORAD_CAT_ID} | Type: {sat.OBJECT_TYPE}</p>
        <p className="text-xs text-gray-400 font-mono">Country: {sat.OWNER} | Launched: {sat.LAUNCH_DATE}</p>
    </div>
);

const TLEInfo: React.FC<{sat: RealSatellite}> = ({sat}) => (
     <div className="p-3 rounded-lg bg-black/50 font-mono text-xs text-gray-400">
         <p className="text-cyan-200/80 font-sans text-xs font-semibold uppercase mb-1">Raw TLE Data</p>
         <p>{sat.TLE_LINE1}</p>
         <p>{sat.TLE_LINE2}</p>
    </div>
);

const AnalysisSection: React.FC<{title: string, content: string | undefined}> = ({title, content}) => (
     <div>
        <p className="text-xs text-cyan-200/80 font-semibold uppercase">{title}</p>
        <p className="text-sm text-gray-200 whitespace-pre-wrap">{content || "Not available."}</p>
    </div>
);

const ThreatClassification: React.FC<{details: AnomalyAlert['details']}> = ({ details }) => {
    if (!details) return null;
    const riskColorClass = getRiskColor(details.riskLevel).replace('border-l-4 border', 'text');
    return (
        <div className="p-4 rounded-lg bg-gray-800 space-y-3">
             <p className="text-base text-cyan-200/80 font-bold uppercase">Threat Classification</p>
             <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-gray-400 font-semibold">ML RISK SCORE</p>
                    <p className={`font-mono text-2xl font-bold ${riskColorClass}`}>{details.riskScore.toFixed(0)}</p>
                </div>
                 <div>
                    <p className="text-xs text-gray-400 font-semibold">RISK LEVEL</p>
                    <p className={`font-mono text-lg font-bold ${riskColorClass}`}>{details.riskLevel}</p>
                </div>
             </div>
             <div>
                <p className="text-xs text-gray-400 font-semibold">MITRE ATT&CK® TTP</p>
                <p className="font-mono text-gray-200">{details.mitreTechnique}</p>
            </div>
            <div>
                <p className="text-xs text-gray-400 font-semibold">SPARTA CLASSIFICATION</p>
                <p className="font-mono text-gray-200">{details.spartaClassification}</p>
            </div>
        </div>
    );
};

export const AnomalyDetailView: React.FC<AnomalyDetailViewProps> = ({ alert, onBack, onArchive, onSaveNotes }) => {
    const [notes, setNotes] = useState(alert.details?.operatorNotes || '');
    const [isSaved, setIsSaved] = useState(true);

    useEffect(() => {
        setNotes(alert.details?.operatorNotes || '');
        setIsSaved(true);
    }, [alert]);

    const handleSave = () => {
        onSaveNotes(alert.satellite.NORAD_CAT_ID, notes);
        setIsSaved(true);
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        setIsSaved(false);
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 bg-gray-950/50 border-b border-gray-700/50">
                <button onClick={onBack} className="flex items-center text-sm text-cyan-400 hover:text-cyan-200 transition-colors mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to Anomaly Feed
                </button>
                <h2 className="text-lg font-bold tracking-wider text-gray-100 truncate">Threat Assessment</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <SatInfo sat={alert.satellite} />
                <TLEInfo sat={alert.satellite} />

                {alert.analysisState === 'complete' && alert.details && (
                     <ThreatClassification details={alert.details} />
                )}
               
                <div className="p-4 rounded-lg bg-gray-800 space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-base text-cyan-200/80 font-bold uppercase">Gemini AI Threat Analysis</p>
                    </div>
                     {alert.analysisState === 'complete' && alert.details ? (
                        <>
                            <AnalysisSection title="Anomaly Description" content={alert.details.description} />
                            <AnalysisSection title="Threat Assessment" content={alert.details.assessment} />
                        </>
                     ) : alert.analysisState === 'pending' ? (
                        <p className="text-sm text-gray-400">AI analysis in progress...</p>
                     ) : (
                         <p className="text-sm text-rose-400">AI analysis failed or was not performed.</p>
                     )}
                </div>

                <div className="p-4 rounded-lg bg-gray-800 space-y-2">
                    <p className="text-base text-cyan-200/80 font-bold uppercase">Operator Annotation</p>
                    <textarea 
                        value={notes}
                        onChange={handleNotesChange}
                        placeholder="Add your observations and notes here..."
                        className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                    />
                    <div className="text-right">
                        <button 
                            onClick={handleSave}
                            disabled={isSaved}
                            className="text-xs px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSaved ? 'Saved' : 'Save Notes'}
                        </button>
                    </div>
                </div>

                 <div className="text-center pt-2">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onArchive(); }}
                        disabled={alert.analysisState !== 'complete'}
                        className="text-sm px-4 py-2 bg-gray-700 hover:bg-cyan-800 rounded-md text-gray-300 hover:text-white transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        Archive Assessment
                    </button>
                </div>
            </div>
        </div>
    )
}