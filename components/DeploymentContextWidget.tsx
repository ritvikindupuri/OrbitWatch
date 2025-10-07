import React from 'react';

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const DeploymentContextWidget: React.FC = () => {
    return (
        <div className="p-3 bg-gray-800/50 rounded-lg space-y-3">
            <div>
                <p className="text-sm font-bold text-gray-200">AI Core Configuration</p>
                <p className="text-xs text-gray-500 font-mono">Model: gemini-2.5-flash</p>
            </div>
            <div className="text-xs font-mono space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Endpoint:</span>
                    <span className="font-semibold text-gray-200">Public Cloud API</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className="flex items-center font-semibold text-green-400">
                        <span className="h-2 w-2 bg-green-400 rounded-full mr-1.5"></span>
                        Connected
                    </span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400">Security:</span>
                    <span className="font-semibold text-gray-200">Standard TLS</span>
                </div>
            </div>
            <div className="pt-2 text-center">
                <button
                    disabled={true}
                    title="This feature requires administrative privileges and a GovCloud environment."
                    className="w-full px-3 py-1.5 text-xs font-bold text-gray-400 bg-gray-700/60 rounded-md border border-gray-600/80 transition-colors disabled:cursor-not-allowed"
                >
                    Switch to GovCloud Endpoint
                    <InfoIcon />
                </button>
                 <p className="text-[10px] text-gray-600 pt-2">
                    Private endpoints available for sensitive & classified workloads.
                </p>
            </div>
        </div>
    );
};