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
  ChevronRight,
  AlertOctagon,
  ArrowRight,
  Footprints,
  PlayCircle,
  ShieldAlert,
  Check
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
  const [routePoints, setRoutePoints] = React.useState<{ x: number, y: number }[]>([]);
  
  // Simulated walk state
  const [simulatedProgress, setSimulatedProgress] = React.useState<number | null>(null);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const simulationTimerRef = React.useRef<any>(null);

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
    setRoutePoints([]);
    setSimulatedProgress(null);
    setIsSimulating(false);
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
    }
  }, [stadium]);

  // Clear simulation timer on unmount
  React.useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, []);

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

  // Calculate simulated pathing on map avoiding the pitch (wrapping around pitch at R = 37)
  const handleCalculateNavigation = () => {
    if (!navigationStart || !navigationEnd) return;
    const startFac = stadium.facilities.find(f => f.id === navigationStart);
    const endFac = stadium.facilities.find(f => f.id === navigationEnd);

    if (startFac && endFac) {
      // Clear current simulation
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
      setSimulatedProgress(null);
      setIsSimulating(false);

      const cx = 50;
      const cy = 50;
      const R = 37;

      const x1 = startFac.longitude;
      const y1 = startFac.latitude;
      const x2 = endFac.longitude;
      const y2 = endFac.latitude;

      const a1 = Math.atan2(y1 - cy, x1 - cx);
      const a2 = Math.atan2(y2 - cy, x2 - cx);

      // Find the shortest path angle around the soccer field
      const diff = Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));

      // Build intermediate nodes along the concourse ring to form a beautiful curve
      const points: { x: number; y: number }[] = [];
      
      // Point 0: Start location
      points.push({ x: x1, y: y1 });

      // Point 1: Concourse entry anchor
      points.push({ x: cx + R * Math.cos(a1), y: cy + R * Math.sin(a1) });

      // Points 2, 3, 4: Smooth arc interpolation around soccer field
      const segmentsCount = 5;
      for (let i = 1; i < segmentsCount; i++) {
        const ratio = i / segmentsCount;
        const currentAngle = a1 + diff * ratio;
        points.push({ x: cx + R * Math.cos(currentAngle), y: cy + R * Math.sin(currentAngle) });
      }

      // Point 5: Concourse exit anchor
      points.push({ x: cx + R * Math.cos(a2), y: cy + R * Math.sin(a2) });

      // Point 6: Target destination location
      points.push({ x: x2, y: y2 });

      setRoutePoints(points);

      // Construct line segment objects for the path renderer
      const lines = [];
      for (let i = 0; i < points.length - 1; i++) {
        lines.push({
          x1: points[i].x,
          y1: points[i].y,
          x2: points[i + 1].x,
          y2: points[i + 1].y
        });
      }

      setRouteLine(lines);
      setShowNavigationResult(true);
    }
  };

  // Run auto routing calculation whenever endpoints change
  React.useEffect(() => {
    if (navigationStart && navigationEnd) {
      handleCalculateNavigation();
    } else {
      setRouteLine([]);
      setRoutePoints([]);
      setShowNavigationResult(false);
      setSimulatedProgress(null);
    }
  }, [navigationStart, navigationEnd]);

  // Triggers walking simulation loop
  const handleSimulateWalk = () => {
    if (routePoints.length === 0) return;
    setIsSimulating(true);
    setSimulatedProgress(0);

    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
    }

    let progress = 0;
    simulationTimerRef.current = setInterval(() => {
      progress += 2.5; // step increment
      if (progress >= 100) {
        progress = 100;
        clearInterval(simulationTimerRef.current);
        setIsSimulating(false);
      }
      setSimulatedProgress(progress);
    }, 70); // smooth animation interval
  };

  // Calculated route statistics (meters & estimated minutes)
  const routeStats = React.useMemo(() => {
    if (!navigationStart || !navigationEnd || routePoints.length === 0) return null;
    const startFac = stadium.facilities.find(f => f.id === navigationStart);
    const endFac = stadium.facilities.find(f => f.id === navigationEnd);
    if (!startFac || !endFac) return null;

    const cx = 50;
    const cy = 50;
    const R = 37;

    const x1 = startFac.longitude;
    const y1 = startFac.latitude;
    const x2 = endFac.longitude;
    const y2 = endFac.latitude;

    const r1 = Math.sqrt((x1 - cx) ** 2 + (y1 - cy) ** 2);
    const r2 = Math.sqrt((x2 - cx) ** 2 + (y2 - cy) ** 2);

    const a1 = Math.atan2(y1 - cy, x1 - cx);
    const a2 = Math.atan2(y2 - cy, x2 - cx);
    const diff = Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));

    // Calculate segments components
    const dStart = Math.abs(r1 - R);
    const dArc = R * Math.abs(diff);
    const dEnd = Math.abs(r2 - R);

    const totalUnits = dStart + dArc + dEnd;
    const totalMeters = Math.round(totalUnits * 2.8); // 1 coordinate unit matches ~2.8 meters

    // Slowdowns due to crowds and live stadium congestion
    let speedMultiplier = 1.0;
    if (stadium.crowdDensity === CrowdDensity.MODERATE) speedMultiplier = 0.8;
    else if (stadium.crowdDensity === CrowdDensity.HIGH) speedMultiplier = 0.55;
    else if (stadium.crowdDensity === CrowdDensity.EXTREME) speedMultiplier = 0.35;

    const baseWalkSpeedMetersPerMin = 80;
    const finalSpeed = baseWalkSpeedMetersPerMin * speedMultiplier;
    const totalMinutes = totalMeters / finalSpeed;

    return {
      meters: totalMeters,
      minutes: parseFloat(totalMinutes.toFixed(1)),
      speedMultiplier,
      directionClockwise: diff > 0,
      arcDistanceMeters: Math.round(dArc * 2.8)
    };
  }, [navigationStart, navigationEnd, routePoints, stadium.crowdDensity]);

  // Dynamic landmark selection (list adjacent facilities along route)
  const landmarksAlongRoute = React.useMemo(() => {
    if (!navigationStart || !navigationEnd || routePoints.length === 0) return [];
    const startFac = stadium.facilities.find(f => f.id === navigationStart);
    const endFac = stadium.facilities.find(f => f.id === navigationEnd);
    if (!startFac || !endFac) return [];

    const cx = 50;
    const cy = 50;
    const a1 = Math.atan2(startFac.latitude - cy, startFac.longitude - cx);
    const a2 = Math.atan2(endFac.latitude - cy, endFac.longitude - cx);
    
    const minA = Math.min(a1, a2);
    const maxA = Math.max(a1, a2);
    const angleDiff = maxA - minA;

    return stadium.facilities.filter(f => {
      if (f.id === navigationStart || f.id === navigationEnd) return false;
      const fa = Math.atan2(f.latitude - cy, f.longitude - cx);
      
      // Determine if within range
      if (angleDiff < Math.PI) {
        return fa >= minA && fa <= maxA;
      } else {
        return fa <= minA || fa >= maxA;
      }
    }).slice(0, 2); // Show up to 2 landmarks
  }, [navigationStart, navigationEnd, routePoints, stadium.facilities]);

  // Checks for security warnings, closures or extreme crowd alerts
  const routeWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    const startFac = stadium.facilities.find(f => f.id === navigationStart);
    const endFac = stadium.facilities.find(f => f.id === navigationEnd);

    if (startFac) {
      if (startFac.status === FacilityStatus.CLOSED || startFac.status === FacilityStatus.EMERGENCY) {
        warnings.push(`Warning: Starting location "${startFac.name}" is currently ${startFac.status}. Seek immediate staff help.`);
      } else if (startFac.status === FacilityStatus.CONGESTED) {
        warnings.push(`Congestion: Starting point "${startFac.name}" is heavily congested. Expected delays.`);
      }
    }

    if (endFac) {
      if (endFac.status === FacilityStatus.CLOSED || endFac.status === FacilityStatus.EMERGENCY) {
        warnings.push(`Caution: Selected destination "${endFac.name}" is currently ${endFac.status}. Choose alternative facility.`);
      } else if (endFac.status === FacilityStatus.CONGESTED) {
        warnings.push(`Advisory: Destination "${endFac.name}" has critical queues (~${endFac.waitTimeMinutes}m wait).`);
      }
    }

    // Check landmarks
    landmarksAlongRoute.forEach(lm => {
      if (lm.status === FacilityStatus.EMERGENCY || lm.status === FacilityStatus.CLOSED) {
        warnings.push(`Reroute Advice: Landmark "${lm.name}" along route is ${lm.status}. Avoid concourse sector near this asset.`);
      }
    });

    if (stadium.crowdDensity === CrowdDensity.EXTREME) {
      warnings.push(`Alert: Stadium-wide crowd density is EXTREME. Slow, paced shuffles enforced on all concourses.`);
    }

    return warnings;
  }, [navigationStart, navigationEnd, landmarksAlongRoute, stadium.crowdDensity]);

  // Render spectator position during simulated progress
  const simulatedCoordinates = React.useMemo(() => {
    if (simulatedProgress === null || routePoints.length === 0) return null;
    
    // Total steps/segments is 6
    const numSegments = routePoints.length - 1;
    const globalFraction = simulatedProgress / 100;
    const scaledProgress = globalFraction * numSegments;
    const segmentIndex = Math.min(Math.floor(scaledProgress), numSegments - 1);
    const segmentFraction = scaledProgress - segmentIndex;

    const startPt = routePoints[segmentIndex];
    const endPt = routePoints[segmentIndex + 1];

    return {
      x: startPt.x + (endPt.x - startPt.x) * segmentFraction,
      y: startPt.y + (endPt.y - startPt.y) * segmentFraction
    };
  }, [simulatedProgress, routePoints]);

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

  // Group facilities elegantly for selecting starting/destination points
  const groupedFacilities = React.useMemo(() => {
    const groups: { [key in FacilityCategory]?: Facility[] } = {};
    stadium.facilities.forEach(f => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category]!.push(f);
    });
    return groups;
  }, [stadium.facilities]);

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
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-xl animate-pulse-gold">
          <h4 className="font-semibold text-white flex items-center gap-2 mb-1.5 text-sm">
            <Navigation className="w-4 h-4 text-[#C5A059]" />
            Live Navigation & Crowd Router
          </h4>
          <p className="text-[10.5px] text-white/50 mb-4 leading-relaxed font-normal">
            Select a custom starting and ending location to compute real-time concourse routes avoiding crowd overflows.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Starting Point</label>
              <select
                value={navigationStart}
                onChange={(e) => setNavigationStart(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
              >
                <option value="">-- Choose Any Location --</option>
                {Object.entries(groupedFacilities).map(([category, list]) => (
                  <optgroup key={category} label={category.replace(/_/g, " ")} className="bg-[#14161E] text-[#C5A059]">
                    {(list as Facility[]).map(f => (
                      <option key={f.id} value={f.id} className="text-white">
                        {f.name} {f.waitTimeMinutes > 0 ? `(Wait: ${f.waitTimeMinutes}m)` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
 
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Destination Facility</label>
              <select
                value={navigationEnd}
                onChange={(e) => setNavigationEnd(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
              >
                <option value="">-- Choose Any Location --</option>
                {Object.entries(groupedFacilities).map(([category, list]) => (
                  <optgroup key={category} label={category.replace(/_/g, " ")} className="bg-[#14161E] text-[#C5A059]">
                    {(list as Facility[]).map(f => (
                      <option key={f.id} value={f.id} className="text-white">
                        {f.name} {f.waitTimeMinutes > 0 ? `(Wait: ${f.waitTimeMinutes}m)` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
 
            <button
              onClick={handleCalculateNavigation}
              disabled={!navigationStart || !navigationEnd}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#C5A059] hover:bg-[#D8B775] disabled:bg-white/5 disabled:text-white/20 text-black rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-lg shadow-[#C5A059]/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Force Recalculate Route
            </button>
 
            {showNavigationResult && routeStats && (
              <div className="mt-4 p-4 bg-black border border-white/10 rounded-lg space-y-3.5 animate-in fade-in animate-pulse-gold" id="nav-calc-output">
                
                {/* Metrics Header */}
                <div className="flex flex-col gap-1.5 border-b border-white/5 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Estimated Transit</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase font-mono">
                      {stadium.crowdDensity} CROWDS
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1">
                    <div className="flex gap-1 items-baseline">
                      <span className="text-xl font-black font-mono text-[#C5A059]">{routeStats.meters}</span>
                      <span className="text-[10px] font-bold text-white/50">meters</span>
                    </div>
                    <div className="flex gap-1 items-baseline">
                      <span className="text-xl font-black font-mono text-[#C5A059]">~{routeStats.minutes}</span>
                      <span className="text-[10px] font-bold text-white/50 font-sans">mins walk</span>
                    </div>
                  </div>
                </div>

                {/* Simulation button */}
                <button
                  onClick={handleSimulateWalk}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent rounded-lg font-bold text-xs transition-all cursor-pointer"
                >
                  <Footprints className="w-4 h-4 animate-bounce" />
                  {isSimulating ? `Walking... (${Math.round(simulatedProgress!)}%)` : "Simulate Walk on Map"}
                </button>

                {/* Safety warnings list */}
                {routeWarnings.length > 0 && (
                  <div className="space-y-1.5 bg-red-500/5 border border-red-500/15 p-2.5 rounded-lg">
                    {routeWarnings.map((warn, widx) => (
                      <div key={widx} className="flex gap-2 items-start text-[10px] text-red-400 font-medium">
                        <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step-by-step custom routing */}
                <div className="space-y-3 text-[11px] text-white/80 pt-1 leading-relaxed">
                  <div className="flex gap-2 items-start">
                    <span className="text-[#C5A059] font-bold font-mono">1.</span>
                    <span>
                      Depart from <strong>{stadium.facilities.find(f => f.id === navigationStart)?.name}</strong>.
                      {stadium.facilities.find(f => f.id === navigationStart)?.category === FacilityCategory.ENTRY_GATE && (
                        ` Complete initial security screening & tickets check.`
                      )}
                    </span>
                  </div>

                  <div className="flex gap-2 items-start">
                    <span className="text-[#C5A059] font-bold font-mono">2.</span>
                    <span>
                      Merge onto outer concourse ring. Walk <strong>{routeStats.arcDistanceMeters} meters</strong>{" "}
                      <strong>{routeStats.directionClockwise ? "clockwise" : "counter-clockwise"}</strong>.
                    </span>
                  </div>

                  {landmarksAlongRoute.length > 0 && (
                    <div className="flex gap-2 items-start pl-4 border-l border-white/5">
                      <span className="text-white/40 font-mono">↳</span>
                      <span className="text-white/50 text-[10px]">
                        Pass by landmarks:{" "}
                        {landmarksAlongRoute.map((lm, idx) => (
                          <span key={lm.id} className="text-white/70">
                            {idx > 0 ? ", " : ""}<strong>{lm.name}</strong> ({lm.waitTimeMinutes}m wait)
                          </span>
                        ))}
                      </span>
                    </div>
                  )}

                  {stadium.crowdDensity !== CrowdDensity.LOW && (
                    <div className="flex gap-2 items-start pl-4 border-l border-white/5">
                      <span className="text-amber-400 font-mono font-bold">⚠️</span>
                      <span className="text-amber-400/80 text-[10.5px]">
                        Crowd density speed cap: Slowed by{" "}
                        <strong>{Math.round((1 - routeStats.speedMultiplier) * 100)}%</strong>.
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 items-start">
                    <span className="text-[#C5A059] font-bold font-mono">3.</span>
                    <span>
                      Arrive at destination <strong>{stadium.facilities.find(f => f.id === navigationEnd)?.name}</strong>.
                      {stadium.facilities.find(f => f.id === navigationEnd)?.waitTimeMinutes ? (
                        ` Current wait is approx ${stadium.facilities.find(f => f.id === navigationEnd)?.waitTimeMinutes} minutes.`
                      ) : (
                        " Clear path ahead!"
                      )}
                    </span>
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
                className="p-1.5 bg-white/5 border border-white/5 text-white/40 rounded-lg hover:text-white transition-colors cursor-pointer"
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
                  strokeWidth="1.3"
                  strokeDasharray="4,2"
                  className="animate-route-flow"
                />
              ))}

              {/* Simulated Walking Spectator Marker */}
              {simulatedCoordinates && (
                <g>
                  <circle 
                    cx={simulatedCoordinates.x} 
                    cy={simulatedCoordinates.y} 
                    r="4" 
                    fill="none" 
                    stroke="#D8B775" 
                    strokeWidth="0.7" 
                    className="animate-ping" 
                  />
                  <circle 
                    cx={simulatedCoordinates.x} 
                    cy={simulatedCoordinates.y} 
                    r="2.2" 
                    fill="#D8B775" 
                    stroke="#ffffff" 
                    strokeWidth="0.6" 
                  />
                </g>
              )}
  
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
                     onKeyDown={(e) => {
                       if (e.key === "Enter" || e.key === " ") {
                         e.preventDefault();
                         setSelectedFacility(fac);
                       }
                     }}
                     className="cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
                     id={`svg-asset-${fac.id}`}
                     tabIndex={0}
                     role="button"
                     aria-label={`${fac.name} - Status: ${fac.status}, Wait time: ${fac.waitTimeMinutes} minutes`}
                  >
                    {/* Ring aura if selected */}
                    {isSelected && (
                      <circle cx={fac.longitude} cy={fac.latitude} r="4.5" fill="none" stroke="#C5A059" strokeWidth="0.5" className="animate-ping" />
                    )}
                    {/* Background interactive node circle */}
                    <circle 
                      cx={fac.longitude} 
                      cy={fac.latitude} 
                      r={isSelected ? "3.2" : "2.2"} 
                      fill={statusFill} 
                      stroke="#08090C" 
                      strokeWidth="0.5"
                      className="transition-all group-hover:scale-125 duration-300" 
                    />
                    {/* Tiny initial label for gates */}
                    {fac.category === FacilityCategory.ENTRY_GATE && (
                      <text 
                        x={fac.longitude} 
                        y={fac.latitude - 3.2} 
                        fill="#94a3b8" 
                        fontSize="2.4" 
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
                className="w-7 h-7 bg-[#14161E] border border-white/10 hover:bg-[#1E212B] text-white/80 rounded font-bold text-sm cursor-pointer transition-all flex items-center justify-center"
              >
                +
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 1))}
                className="w-7 h-7 bg-[#14161E] border border-white/10 hover:bg-[#1E212B] text-white/80 rounded font-bold text-sm cursor-pointer transition-all flex items-center justify-center"
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

                  {/* Quick starting/destination selection hooks */}
                  <div className="flex flex-wrap gap-2 pt-2.5">
                    <button
                      onClick={() => {
                        setNavigationStart(selectedFacility.id);
                        if (navigationEnd === selectedFacility.id) {
                          setNavigationEnd("");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        navigationStart === selectedFacility.id
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {navigationStart === selectedFacility.id ? "✓ Active Starting Point" : "Set as Start"}
                    </button>
                    <button
                      onClick={() => {
                        setNavigationEnd(selectedFacility.id);
                        if (navigationStart === selectedFacility.id) {
                          setNavigationStart("");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        navigationEnd === selectedFacility.id
                          ? "bg-[#C5A059]/15 border-[#C5A059]/30 text-[#C5A059]"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {navigationEnd === selectedFacility.id ? "✓ Active Destination" : "Set as Destination"}
                    </button>
                  </div>
                  
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
