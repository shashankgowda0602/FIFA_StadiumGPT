/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Stadium, 
  Facility, 
  FacilityCategory, 
  FacilityStatus, 
  QueueLength, 
  UserRole,
  CrowdDensity
} from "../types.js";
import { 
  Compass, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Layers, 
  Navigation,
  Sparkles,
  RefreshCw,
  Eye,
  ChevronRight
} from "lucide-react";

interface InteractiveMapProps {
  stadium: Stadium;
  onUpdateFacility?: (facilityId: string, updates: Partial<Facility>) => void;
  currentUserRole: UserRole;
}

export default function InteractiveMap({ stadium, onUpdateFacility, currentUserRole }: InteractiveMapProps) {
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [navigationStart, setNavigationStart] = React.useState<string>("");
  const [navigationEnd, setNavigationEnd] = React.useState<string>("");
  const [showNavigationResult, setShowNavigationResult] = React.useState(false);
  const [routeLine, setRouteLine] = React.useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [mapOffset, setMapOffset] = React.useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = React.useState(false);

  // Edit fields for Staff/Organizers
  const [editStatus, setEditStatus] = React.useState<FacilityStatus>(FacilityStatus.OPERATIONAL);
  const [editQueue, setEditQueue] = React.useState<QueueLength>(QueueLength.NONE);
  const [editWaitTime, setEditWaitTime] = React.useState(0);

  // Initialize selected facility edit values
  React.useEffect(() => {
    if (selectedFacility) {
      setEditStatus(selectedFacility.status);
      setEditQueue(selectedFacility.queueLength);
      setEditWaitTime(selectedFacility.waitTimeMinutes);
      setIsEditing(false);
    }
  }, [selectedFacility]);

  // Clean navigation if stadium changes
  React.useEffect(() => {
    setSelectedFacility(null);
    setNavigationStart("");
    setNavigationEnd("");
    setShowNavigationResult(false);
    setRouteLine([]);
  }, [stadium]);

  // Render Category colors
  const getCategoryColor = (category: FacilityCategory) => {
    switch (category) {
      case FacilityCategory.ENTRY_GATE:
      case FacilityCategory.EXIT_GATE:
        return "bg-indigo-500 text-white";
      case FacilityCategory.RESTROOM:
        return "bg-blue-500 text-white";
      case FacilityCategory.FOOD_COURT:
      case FacilityCategory.RESTAURANT:
        return "bg-amber-500 text-white";
      case FacilityCategory.MEDICAL_CENTER:
        return "bg-rose-500 text-white";
      case FacilityCategory.EMERGENCY_EXIT:
        return "bg-red-600 text-white";
      case FacilityCategory.VIP_LOUNGE:
        return "bg-purple-600 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const getStatusColor = (status: FacilityStatus) => {
    switch (status) {
      case FacilityStatus.OPERATIONAL:
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case FacilityStatus.CONGESTED:
        return "text-amber-400 border-amber-500/30 bg-amber-500/10";
      case FacilityStatus.LIMITED_SERVICE:
        return "text-sky-400 border-sky-500/30 bg-sky-500/10";
      case FacilityStatus.CLOSED:
        return "text-slate-400 border-slate-500/30 bg-slate-500/10";
      case FacilityStatus.EMERGENCY:
        return "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse";
    }
  };

  const getQueueLabel = (queue: QueueLength) => {
    switch (queue) {
      case QueueLength.NONE: return "No Queue";
      case QueueLength.SHORT: return "Short Wait (2-5m)";
      case QueueLength.MEDIUM: return "Medium Wait (5-15m)";
      case QueueLength.LONG: return "Long Wait (15-30m)";
      case QueueLength.CRITICAL: return "Critical Congestion (30m+)";
    }
  };

  // Filter facilities
  const filteredFacilities = stadium.facilities.filter(f => {
    const matchesCategory = filterCategory === "ALL" || f.category === filterCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate simulated pathing on map
  const handleCalculateNavigation = () => {
    if (!navigationStart || !navigationEnd) return;
    const startFac = stadium.facilities.find(f => f.id === navigationStart);
    const endFac = stadium.facilities.find(f => f.id === navigationEnd);

    if (startFac && endFac) {
      // Create a nice multi-segment route between coordinates
      // Segment 1: start -> concourse ring (x=50, y=50) -> target
      const xMid = 50;
      const yMid = 50;

      const lines = [
        { x1: startFac.longitude, y1: startFac.latitude, x2: xMid, y2: yMid },
        { x1: xMid, y1: yMid, x2: endFac.longitude, y2: endFac.latitude }
      ];

      setRouteLine(lines);
      setShowNavigationResult(true);
    }
  };

  const handleSaveFacilityEdits = () => {
    if (selectedFacility && onUpdateFacility) {
      onUpdateFacility(selectedFacility.id, {
        status: editStatus,
        queueLength: editQueue,
        waitTimeMinutes: editWaitTime
      });
      // Refetch locally updated fac
      const updated = {
        ...selectedFacility,
        status: editStatus,
        queueLength: editQueue,
        waitTimeMinutes: editWaitTime
      };
      setSelectedFacility(updated);
      setIsEditing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="map-module-layout">
      {/* Search & Left Control Column */}
      <div className="space-y-6 lg:col-span-1" id="map-controls-panel">
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#C5A059]" />
              GIS Stadium Directory
            </h3>
            <span className="text-[10px] bg-white/5 border border-white/10 text-[#C5A059] px-2 py-0.5 rounded font-semibold font-mono">
              {stadium.facilities.length} ASSETS
            </span>
          </div>
 
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search gates, restrooms, food courts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>
 
          {/* Category Quick Filters */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" id="category-filter-scroll">
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterCategory === "ALL" 
                  ? "bg-[#C5A059] border-[#C5A059] text-black" 
                  : "bg-white/5 text-white/70 border-white/5 hover:bg-white/10"
              }`}
            >
              All Assets
            </button>
            <button
              onClick={() => setFilterCategory(FacilityCategory.ENTRY_GATE)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterCategory === FacilityCategory.ENTRY_GATE 
                  ? "bg-indigo-500 border-indigo-500 text-white" 
                  : "bg-white/5 text-white/70 border-white/5 hover:bg-white/10"
              }`}
            >
              Gates
            </button>
            <button
              onClick={() => setFilterCategory(FacilityCategory.FOOD_COURT)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterCategory === FacilityCategory.FOOD_COURT 
                  ? "bg-amber-600 border-amber-600 text-white" 
                  : "bg-white/5 text-white/70 border-white/5 hover:bg-white/10"
              }`}
            >
              Food Courts
            </button>
            <button
              onClick={() => setFilterCategory(FacilityCategory.RESTROOM)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterCategory === FacilityCategory.RESTROOM 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "bg-white/5 text-white/70 border-white/5 hover:bg-white/10"
              }`}
            >
              Restrooms
            </button>
            <button
              onClick={() => setFilterCategory(FacilityCategory.MEDICAL_CENTER)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                filterCategory === FacilityCategory.MEDICAL_CENTER 
                  ? "bg-rose-600 border-rose-600 text-white" 
                  : "bg-white/5 text-white/70 border-white/5 hover:bg-white/10"
              }`}
            >
              Medical Centers
            </button>
          </div>
 
          {/* Directory Listings */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="map-assets-scroll">
            {filteredFacilities.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs">
                No facilities match your active query.
              </div>
            ) : (
              filteredFacilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                return (
                  <button
                    key={fac.id}
                    id={`asset-card-${fac.id}`}
                    onClick={() => setSelectedFacility(fac)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-300 gold-border-hover"
                    style={{
                      borderColor: isSelected ? "rgba(197, 160, 89, 0.6)" : "rgba(255, 255, 255, 0.08)",
                      backgroundColor: isSelected ? "rgba(197, 160, 89, 0.08)" : "rgba(0, 0, 0, 0.4)"
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex items-center justify-center w-8 h-8 rounded ${getCategoryColor(fac.category)} text-xs font-semibold`}>
                        {fac.category.substring(0, 3)}
                      </span>
                      <div className="min-w-0">
                        <span className="block font-semibold text-xs text-white truncate">{fac.name}</span>
                        <span className="block text-[10px] text-white/50 truncate">{fac.description}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {fac.waitTimeMinutes > 0 ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          fac.status === FacilityStatus.CONGESTED ? "bg-amber-500/10 text-amber-400" : "bg-[#C5A059]/10 text-[#C5A059]"
                        }`}>
                          <Clock className="w-3 h-3" />
                          {fac.waitTimeMinutes}m
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] text-[#C5A059] font-mono">OK</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
 
        {/* Live Navigation Assistant Drawer */}
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-xl">
          <h4 className="font-semibold text-white flex items-center gap-2 mb-3 text-sm">
            <Navigation className="w-4 h-4 text-[#C5A059]" />
            Simulate Route & Transit Time
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Starting Point</label>
              <select
                value={navigationStart}
                onChange={(e) => setNavigationStart(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
              >
                <option value="">-- Choose Gate / Entry --</option>
                {stadium.facilities
                  .filter(f => f.category === FacilityCategory.ENTRY_GATE)
                  .map(f => (
                    <option key={f.id} value={f.id}>{f.name} (Wait: {f.waitTimeMinutes}m)</option>
                  ))
                }
              </select>
            </div>
 
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Destination Facility</label>
              <select
                value={navigationEnd}
                onChange={(e) => setNavigationEnd(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
              >
                <option value="">-- Choose Concession, Seat or Restroom --</option>
                {stadium.facilities
                  .filter(f => f.category !== FacilityCategory.ENTRY_GATE)
                  .map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.category})</option>
                  ))
                }
              </select>
            </div>
 
            <button
              onClick={handleCalculateNavigation}
              disabled={!navigationStart || !navigationEnd}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#C5A059] hover:bg-[#D8B775] disabled:bg-white/5 disabled:text-white/20 text-black rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-[#C5A059]/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Calculate Smart Route
            </button>
 
            {showNavigationResult && (
              <div className="mt-4 p-3.5 bg-black border border-white/10 rounded-lg space-y-2.5 animate-in fade-in" id="nav-calc-output">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase">Estimated Transit</span>
                  <div className="flex gap-2">
                    <span className="text-xs font-mono font-bold text-[#C5A059]">180 meters</span>
                    <span className="text-xs font-mono font-bold text-[#C5A059]">~ 3.5 mins walk</span>
                  </div>
                </div>
                <div className="space-y-2 text-[11px] text-white/80">
                  <div className="flex gap-2 items-start">
                    <span className="text-[#C5A059] font-bold font-mono">1.</span>
                    <span>Proceed past ticket scanner and clear bags check at starting gate.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-[#C5A059] font-bold font-mono">2.</span>
                    <span>Follow gold overhead signage down **Outer Concourse Corridor A** for 90 meters.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-[#C5A059] font-bold font-mono">3.</span>
                    <span>Turn left next to the central spectator directory and locate your destination directly ahead.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Visualization Column */}
      <div className="lg:col-span-2 space-y-6" id="map-view-canvas">
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-xl flex flex-col min-h-[450px]">
          {/* Map Header */}
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C5A059]" />
                {stadium.name} Layout Plan
              </h3>
              <p className="text-xs text-white/50">GIS 2D floorplan visualization & live crowds overlay</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setZoomLevel(1); setMapOffset({ x: 0, y: 0 }); }}
                className="p-1.5 bg-white/5 border border-white/5 text-white/40 rounded-lg hover:text-white transition-colors"
                title="Reset View"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black border border-white/10 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                <span className="text-[10px] font-mono text-white/40">LIVE FEED</span>
              </div>
            </div>
          </div>
 
          {/* Interactive GIS SVG Canvas */}
          <div className="relative flex-1 bg-black border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-4 min-h-[350px]" id="stadium-gis-canvas">
            {/* Background vector stadium layout */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full max-w-[450px] transition-transform duration-300 origin-center"
              style={{ transform: `scale(${zoomLevel}) translate(${mapOffset.x}px, ${mapOffset.y}px)` }}
            >
              {/* Outer boundary ring */}
              <ellipse cx="50" cy="50" rx="46" ry="46" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2" strokeDasharray="3,3" />
              {/* Outer facade structure ring */}
              <ellipse cx="50" cy="50" rx="42" ry="42" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              {/* Grand Concourse Level ring */}
              <ellipse cx="50" cy="50" rx="34" ry="34" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
              {/* Seating bowl rim ring */}
              <ellipse cx="50" cy="50" rx="25" ry="25" fill="#050608" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
 
              {/* Pitch grid layout (World Cup grass template) */}
              <rect x="36" y="36" width="28" height="28" rx="2" fill="#041F12" stroke="#059669" strokeWidth="0.5" />
              {/* Pitch lines */}
              <line x1="50" y1="36" x2="50" y2="64" stroke="#059669" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="5" fill="none" stroke="#059669" strokeWidth="0.5" />
              <rect x="36" y="44" width="4" height="12" fill="none" stroke="#059669" strokeWidth="0.5" />
              <rect x="60" y="44" width="4" height="12" fill="none" stroke="#059669" strokeWidth="0.5" />
 
              {/* Congestion overlay zones */}
              {stadium.crowdDensity === CrowdDensity.EXTREME && (
                <ellipse cx="50" cy="50" rx="35" ry="35" fill="rgba(239, 68, 68, 0.04)" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="1" />
              )}
              {stadium.crowdDensity === CrowdDensity.HIGH && (
                <ellipse cx="50" cy="50" rx="35" ry="35" fill="rgba(197, 160, 89, 0.03)" stroke="rgba(197, 160, 89, 0.2)" strokeWidth="1" />
              )}
 
              {/* Dynamic route pathing highlight lines */}
              {routeLine.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#C5A059"
                  strokeWidth="1.5"
                  strokeDasharray="4,2"
                  className="animate-route-flow"
                />
              ))}
 
              {/* Plot Facilities */}
              {stadium.facilities.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                let statusFill = "#C5A059"; // Operational Gold
                if (fac.status === FacilityStatus.CONGESTED) statusFill = "#f59e0b"; // Congested Yellow
                else if (fac.status === FacilityStatus.LIMITED_SERVICE) statusFill = "#0ea5e9"; // Sky Blue
                else if (fac.status === FacilityStatus.CLOSED) statusFill = "#64748b"; // Gray
                else if (fac.status === FacilityStatus.EMERGENCY) statusFill = "#ef4444"; // Emergency Red
 
                return (
                  <g 
                     key={fac.id}
                     onClick={() => setSelectedFacility(fac)}
                     className="cursor-pointer group"
                     id={`svg-asset-${fac.id}`}
                  >
                    {/* Ring aura if selected */}
                    {isSelected && (
                      <circle cx={fac.longitude} cy={fac.latitude} r="4.5" fill="none" stroke="#C5A059" strokeWidth="0.5" className="animate-ping" />
                    )}
                    {/* Background interactive node circle */}
                    <circle 
                      cx={fac.longitude} 
                      cy={fac.latitude} 
                      r={isSelected ? "3" : "2"} 
                      fill={statusFill} 
                      stroke="#08090C" 
                      strokeWidth="0.5"
                      className="transition-all group-hover:scale-125 duration-300" 
                    />
                    {/* Tiny initial label for gates */}
                    {fac.category === FacilityCategory.ENTRY_GATE && (
                      <text 
                        x={fac.longitude} 
                        y={fac.latitude - 3} 
                        fill="#94a3b8" 
                        fontSize="2.2" 
                        textAnchor="middle" 
                        fontWeight="bold"
                        className="font-mono select-none"
                      >
                        {fac.name.split(" Gate ")[1] || fac.name.charAt(fac.name.length - 1)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
 
            {/* Quick legend overlay */}
            <div className="absolute bottom-3 left-3 bg-[#111216]/95 border border-white/10 rounded-lg p-2 flex flex-col gap-1 text-[9px] text-white/50 font-semibold shadow-lg" id="map-legend">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" /> Operational
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Congested
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Ltd Service
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Closed/Emergency
              </div>
            </div>
 
            {/* Map zoom floating buttons */}
            <div className="absolute right-3 top-3 flex flex-col gap-1">
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                className="w-7 h-7 bg-[#14161E] border border-white/10 hover:bg-[#1E212B] text-white/80 rounded font-bold text-sm cursor-pointer transition-all"
              >
                +
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 1))}
                className="w-7 h-7 bg-[#14161E] border border-white/10 hover:bg-[#1E212B] text-white/80 rounded font-bold text-sm cursor-pointer transition-all"
              >
                -
              </button>
            </div>
          </div>
 
          {/* Active Facility Information Overlay */}
          {selectedFacility ? (
            <div className="mt-4 p-4 bg-black border border-white/10 rounded-lg animate-in fade-in slide-in-from-bottom-2" id="selected-facility-details">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(selectedFacility.category)}`}>
                      {selectedFacility.category.replace("_", " ")}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(selectedFacility.status)}`}>
                      {selectedFacility.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#C5A059]" />
                    {selectedFacility.name}
                  </h4>
                  <p className="text-xs text-white/60">{selectedFacility.description}</p>
                  <p className="text-[10px] text-white/40 font-mono">
                    Hours: {selectedFacility.openingHours} | Capacity Buffer: {selectedFacility.capacity.toLocaleString()} spectators
                  </p>
                  
                  {/* Food details */}
                  {selectedFacility.foodDetails && (
                    <div className="mt-2.5 p-2 bg-[#14161E]/60 border border-white/10 rounded-lg flex flex-col gap-1 text-[11px] text-white/80">
                      <div className="flex gap-4">
                        <span>Vegetarian: <strong>{selectedFacility.foodDetails.hasVegetarian ? "✅ YES" : "❌ NO"}</strong></span>
                        <span>Halal Diet: <strong>{selectedFacility.foodDetails.hasHalal ? "✅ YES" : "❌ NO"}</strong></span>
                      </div>
                      <span>Popular concession items: <strong className="text-[#C5A059]">{selectedFacility.foodDetails.popularItems.join(", ")}</strong></span>
                    </div>
                  )}
                </div>
 
                {/* Queue details & actions */}
                <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0 w-full sm:w-auto">
                  <div className="bg-[#14161E]/80 border border-white/10 rounded-xl p-3 text-right">
                    <span className="block text-[10px] text-white/40 uppercase font-bold tracking-wider">Estimated Wait</span>
                    <span className="block font-mono text-xl font-black text-[#C5A059] mt-0.5">{selectedFacility.waitTimeMinutes} mins</span>
                    <span className="block text-[10px] text-white/50 font-medium mt-0.5">{getQueueLabel(selectedFacility.queueLength)}</span>
                  </div>
 
                  {/* Operational Management controls for Staff and Organizers */}
                  {(currentUserRole === UserRole.STADIUM_ORGANIZER || 
                    currentUserRole === UserRole.STADIUM_STAFF || 
                    currentUserRole === UserRole.SUPER_ADMIN) && (
                    <div className="w-full flex justify-end">
                      {isEditing ? (
                        <div className="bg-[#14161E] border border-white/10 p-3 rounded-lg flex flex-col gap-3 w-full" id="staff-edit-box">
                          <span className="block text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Update Facility Parameters</span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-white/40 mb-0.5">Status</label>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as FacilityStatus)}
                                className="w-full px-2 py-1 bg-black border border-white/10 rounded text-[11px] text-white/80 focus:outline-none focus:border-[#C5A059]"
                              >
                                <option value={FacilityStatus.OPERATIONAL}>OPERATIONAL</option>
                                <option value={FacilityStatus.CONGESTED}>CONGESTED</option>
                                <option value={FacilityStatus.LIMITED_SERVICE}>LIMITED_SERVICE</option>
                                <option value={FacilityStatus.CLOSED}>CLOSED</option>
                                <option value={FacilityStatus.EMERGENCY}>EMERGENCY</option>
                              </select>
                            </div>
 
                            <div>
                              <label className="block text-[9px] text-white/40 mb-0.5">Queue Size</label>
                              <select
                                value={editQueue}
                                onChange={(e) => setEditQueue(e.target.value as QueueLength)}
                                className="w-full px-2 py-1 bg-black border border-white/10 rounded text-[11px] text-white/80 focus:outline-none focus:border-[#C5A059]"
                              >
                                <option value={QueueLength.NONE}>None</option>
                                <option value={QueueLength.SHORT}>Short</option>
                                <option value={QueueLength.MEDIUM}>Medium</option>
                                <option value={QueueLength.LONG}>Long</option>
                                <option value={QueueLength.CRITICAL}>Critical</option>
                              </select>
                            </div>
                          </div>
 
                          <div>
                            <label className="block text-[9px] text-white/40 mb-0.5">Wait Time (Minutes)</label>
                            <input
                              type="number"
                              min="0"
                              max="120"
                              value={editWaitTime}
                              onChange={(e) => setEditWaitTime(Number(e.target.value))}
                              className="w-full px-2 py-1 bg-black border border-white/10 rounded text-[11px] text-white/80 focus:outline-none focus:border-[#C5A059]"
                            />
                          </div>
 
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/40 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveFacilityEdits}
                              className="px-2.5 py-1 bg-[#C5A059] hover:bg-[#D8B775] text-black rounded text-[10px] font-bold cursor-pointer"
                            >
                              Save Live
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                          Modify Live Status
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-5 bg-black/40 border border-white/10 border-dashed rounded-lg text-center text-xs text-white/40">
              💡 Select a facility icon on the layout map or directory list above to view estimated wait times, dietary options, and navigational routing details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
