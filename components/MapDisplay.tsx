import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import * as satellite from 'satellite.js';
import { AnomalyAlert, RealSatellite } from '../types';

interface MapDisplayProps {
  satelliteCatalog: RealSatellite[];
  alerts: AnomalyAlert[];
  selectedSatelliteId: number | null;
  onSelectSatellite: (satelliteId: number | null) => void;
}

interface SatellitePosition {
  id: number;
  name: string;
  position: LatLngExpression;
  isAlert: boolean;
  // FIX: Changed risk to be a required property that can be undefined.
  // This fixes a type predicate error where an optional property `risk?` is not assignable
  // to an object where the property always exists, even with an `undefined` value.
  risk: 'Informational' | 'Low' | 'Moderate' | 'High' | 'Critical' | undefined;
}

interface TrajectoryData {
    paths: LatLngExpression[][];
    timePoints: { time: string; position: LatLngExpression }[];
}

const getRiskMarkerColor = (risk: SatellitePosition['risk']) => {
    switch (risk) {
        case 'Critical': return '#ef4444'; // red-500
        case 'High': return '#f97316'; // orange-500
        case 'Moderate': return '#facc15'; // yellow-400
        case 'Low': return '#38bdf8'; // sky-400
        default: return '#6b7280'; // gray-500 for Informational or pending
    }
};

const createSatelliteIcon = (color: string, size: number, isSelected: boolean) => {
    const pulseClass = isSelected ? 'animate-pulse' : '';
    const zIndex = isSelected ? 1000 : 'auto';

    return L.divIcon({
        html: `<div class="rounded-full ${pulseClass}" style="width: ${size}px; height: ${size}px; background-color: ${color}; border: 2px solid rgba(255,255,255,0.7); box-shadow: 0 0 8px ${color}; z-index: ${zIndex};"></div>`,
        className: 'bg-transparent border-0',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
};

const timePointIcon = L.divIcon({
    html: `<div class="rounded-full" style="width: 8px; height: 8px; background-color: #f59e0b; opacity: 0.7;"></div>`,
    className: 'bg-transparent border-0',
    iconSize: [8, 8],
    iconAnchor: [4, 4]
});


const MapController: React.FC<{ 
    selectedSatelliteId: number | null;
    positions: SatellitePosition[];
    onDeselect: () => void;
}> = ({ selectedSatelliteId, positions, onDeselect }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedSatelliteId) {
            const satPos = positions.find(p => p.id === selectedSatelliteId);
            if (satPos) {
                 map.flyTo(satPos.position, map.getZoom(), { // Keep current zoom
                    animate: true,
                    duration: 1,
                });
            }
        }
    }, [selectedSatelliteId, positions, map]);

    useEffect(() => {
        map.on('click', onDeselect);
        return () => {
            map.off('click', onDeselect);
        };
    }, [map, onDeselect]);

    return null;
};


const getTrajectoryPath = (tle1: string, tle2: string): TrajectoryData | null => {
    try {
        const satrec = satellite.twoline2satrec(tle1, tle2);
        if (satrec.error !== 0) {
            console.error(`Invalid TLE data, cannot compute trajectory. Error code: ${satrec.error}`);
            return null;
        }
        
        const paths: LatLngExpression[][] = [];
        let currentPathSegment: LatLngExpression[] = [];
        let lastLon: number | null = null;
        
        const timePoints: TrajectoryData['timePoints'] = [];
        const now = new Date();
        const keyMinutes = [6 * 60, 12 * 60, 18 * 60]; // Key points at T+6, T+12, T+18 hours

        for (let i = 0; i < 1440; i++) { // 1440 minutes = 24 hours
            const time = new Date(now.getTime() + i * 60000);
            const positionAndVelocity = satellite.propagate(satrec, time);
            
            if ('position' in positionAndVelocity) {
                const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
                 if (isNaN(positionEci.x) || isNaN(positionEci.y) || isNaN(positionEci.z)) continue;
                
                const gmst = satellite.gstime(time);
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);
                const lat = satellite.degreesLat(positionGd.latitude);
                const lon = satellite.degreesLong(positionGd.longitude);

                if (!isNaN(lat) && !isNaN(lon)) {
                    // Antimeridian crossing logic
                    if (lastLon !== null && Math.abs(lon - lastLon) > 180) {
                        paths.push(currentPathSegment);
                        currentPathSegment = [];
                    }
                    
                    currentPathSegment.push([lat, lon]);
                    lastLon = lon;

                    if (keyMinutes.includes(i)) {
                         timePoints.push({ time: `T+${i/60}:00 hrs`, position: [lat, lon] });
                    }
                }
            }
        }
        if (currentPathSegment.length > 0) {
            paths.push(currentPathSegment);
        }
        
        if (paths.length === 0) return null;
        return { paths, timePoints };
    } catch (e) {
        console.error("Error calculating trajectory:", e);
        return null;
    }
};


const MapDisplay: React.FC<MapDisplayProps> = ({ satelliteCatalog, alerts, selectedSatelliteId, onSelectSatellite }) => {
    const [positions, setPositions] = useState<SatellitePosition[]>([]);
    
    const satrecs = useMemo(() => {
        const alertMap = new Map<number, AnomalyAlert>(alerts.map(a => [a.satellite.NORAD_CAT_ID, a]));
        
        return satelliteCatalog.map(sat => {
            const alert = alertMap.get(sat.NORAD_CAT_ID);
            const rec = satellite.twoline2satrec(sat.TLE_LINE1, sat.TLE_LINE2);
            if (rec.error !== 0) {
                console.warn(`Error parsing TLE for satellite ${sat.NORAD_CAT_ID}. Excluding from map.`);
                return null;
            }
            return {
                id: sat.NORAD_CAT_ID,
                name: sat.OBJECT_NAME,
                isAlert: !!alert,
                risk: alert?.details?.riskLevel,
                rec: rec
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [satelliteCatalog, alerts]);

    useEffect(() => {
        const updatePositions = () => {
            const now = new Date();
            // FIX: Corrected typo from `satrecks` to `satrecs`.
            const newPositions = satrecs.map(item => {
                try {
                    const positionAndVelocity = satellite.propagate(item!.rec, now);
                    if (!('position' in positionAndVelocity)) return null;

                    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
                    if (isNaN(positionEci.x) || isNaN(positionEci.y) || isNaN(positionEci.z)) return null;

                    const gmst = satellite.gstime(now);
                    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
                    const lat = satellite.degreesLat(positionGd.latitude);
                    const lon = satellite.degreesLong(positionGd.longitude);

                    if (isNaN(lat) || isNaN(lon)) return null;
                    
                    return { id: item!.id, name: item!.name, position: [lat, lon] as LatLngExpression, isAlert: item!.isAlert, risk: item!.risk };
                } catch (e) {
                     console.warn(`Could not propagate satellite ${item!.id}.`);
                     return null;
                }
            }).filter((p): p is SatellitePosition => p !== null);
            setPositions(newPositions);
        };
        
        updatePositions();
        const interval = setInterval(updatePositions, 1500);
        return () => clearInterval(interval);
    }, [satrecs]);

    const trajectoryData = useMemo(() => {
        if (!selectedSatelliteId) return null;
        const sat = satelliteCatalog.find(s => s.NORAD_CAT_ID === selectedSatelliteId);
        if (!sat) return null;
        return getTrajectoryPath(sat.TLE_LINE1, sat.TLE_LINE2);
    }, [selectedSatelliteId, satelliteCatalog]);

    const isAnySatelliteSelected = selectedSatelliteId !== null;
    const selectedSatelliteName = useMemo(() => {
        if (!selectedSatelliteId) return '';
        return satelliteCatalog.find(s => s.NORAD_CAT_ID === selectedSatelliteId)?.OBJECT_NAME || '';
    }, [selectedSatelliteId, satelliteCatalog]);

    return (
         <div className="relative w-full h-full">
            <MapContainer center={[20, 0]} zoom={2.5} scrollWheelZoom={true} className="w-full h-full bg-gray-900">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                
                {positions.map(pos => {
                    const isSelected = pos.id === selectedSatelliteId;
                    const markerColor = pos.isAlert ? getRiskMarkerColor(pos.risk) : '#475569'; // slate-600 for normal
                    const markerSize = pos.isAlert ? (isSelected ? 16 : 12) : 8;
                    const opacity = isAnySatelliteSelected && !isSelected ? 0.35 : 1;
                    const zIndex = isSelected ? 1000 : (pos.isAlert ? 500 : 100);

                    return (
                        <Marker
                            key={pos.id}
                            position={pos.position}
                            icon={createSatelliteIcon(markerColor, markerSize, isSelected)}
                            opacity={opacity}
                            zIndexOffset={zIndex}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    onSelectSatellite(pos.id);
                                },
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                                <span className="font-sans text-xs font-bold">{pos.name}</span>
                            </Tooltip>
                        </Marker>
                    )
                })}

                {trajectoryData && (
                    <>
                        {trajectoryData.paths.map((pathSegment, index) => (
                             <Polyline key={index} positions={pathSegment} color="#f59e0b" weight={2} opacity={0.6} dashArray="5, 10" />
                        ))}
                       
                        {trajectoryData.timePoints.map((point, index) => (
                            <Marker key={index} position={point.position} icon={timePointIcon}>
                                <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                                    <span className="font-sans text-xs font-bold">{point.time}</span>
                                </Tooltip>
                            </Marker>
                        ))}
                    </>
                )}
                
                <MapController 
                    selectedSatelliteId={selectedSatelliteId} 
                    positions={positions} 
                    onDeselect={() => onSelectSatellite(null)} 
                />
            </MapContainer>
             {trajectoryData && selectedSatelliteName && (
                <div className="absolute bottom-4 left-4 z-[1000] p-2 bg-gray-900/80 backdrop-blur-sm rounded-md text-xs text-gray-300 font-mono border border-gray-600 shadow-lg">
                    <p>Showing 24-hour orbital path for:</p>
                    <p className="font-bold text-amber-300">{selectedSatelliteName}</p>
                </div>
            )}
        </div>
    );
};

export default MapDisplay;