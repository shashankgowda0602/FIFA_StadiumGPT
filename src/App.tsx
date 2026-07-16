/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Stadium, 
  UserRole, 
  Facility, 
  Incident, 
  StaffTask, 
  CrowdDensity, 
  AIRecommendation, 
  FacilityStatus, 
  QueueLength, 
  IncidentStatus 
} from "./types.js";
import RoleSelector from "./components/RoleSelector.js";
import InteractiveMap from "./components/InteractiveMap.js";
import Chatbot from "./components/Chatbot.js";
import DecisionSupport from "./components/DecisionSupport.js";
import AnalyticsDashboard from "./components/AnalyticsDashboard.js";
import IncidentTaskCenter from "./components/IncidentTaskCenter.js";
import StadiumConfigurator from "./components/StadiumConfigurator.js";
import DiagnosticsSuite from "./components/DiagnosticsSuite.js";
import { useTranslation, SUPPORTED_LANGUAGES, FIFALanguage } from "./TranslationContext";

import { 
  Bell, 
  Compass, 
  Bot, 
  TrendingUp, 
  ShieldAlert, 
  Settings, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  MapPin,
  Calendar,
  CloudSun,
  Flame,
  Globe
} from "lucide-react";

export default function App() {
  const { language, setLanguage, t } = useTranslation();
  const [stadiums, setStadiums] = React.useState<Stadium[]>([]);
  const [selectedStadiumId, setSelectedStadiumId] = React.useState<string>("");
  const [currentRole, setCurrentRole] = React.useState<UserRole>(UserRole.FOOTBALL_FAN);
  const [activeTab, setActiveTab] = React.useState<"MAP" | "ANALYTICS" | "DECISION" | "SAFETY" | "TESTING">("MAP");
  const [loading, setLoading] = React.useState(true);

  // Platform Notification Feed State
  const [notifications, setNotifications] = React.useState<{ id: string; text: string; type: "info" | "warning" | "success" }[]>([]);

  const fetchStadiums = async () => {
    try {
      const response = await fetch("/api/stadiums");
      if (response.ok) {
        const data: Stadium[] = await response.json();
        setStadiums(data);
        if (data.length > 0 && !selectedStadiumId) {
          setSelectedStadiumId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load stadiums:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStadiums();
  }, []);

  // Add notification helper
  const addNotification = (text: string, type: "info" | "warning" | "success" = "info") => {
    const newNotif = { id: `notif-${Date.now()}`, text, type };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
  };

  // Active Selected Stadium Context
  const activeStadium = stadiums.find(s => s.id === selectedStadiumId) || stadiums[0];

  // Global operations handler: update state in-memory and API
  const handleUpdateStadiumOps = async (updates: Partial<Stadium>) => {
    if (!activeStadium) return;
    try {
      const response = await fetch(`/api/stadiums/${activeStadium.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updated = await response.json();
        setStadiums(prev => prev.map(s => s.id === updated.id ? updated : s));
        addNotification(`Updated operations parameters for ${activeStadium.name}.`, "success");
      }
    } catch (err) {
      console.error("Failed to update stadium parameters:", err);
    }
  };

  // Facility update handler
  const handleUpdateFacility = async (facilityId: string, updates: Partial<Facility>) => {
    if (!activeStadium) return;
    try {
      const response = await fetch(`/api/stadiums/${activeStadium.id}/facilities/${facilityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedFac = await response.json();
        setStadiums(prev => prev.map(s => {
          if (s.id === activeStadium.id) {
            return {
              ...s,
              facilities: s.facilities.map(f => f.id === facilityId ? { ...f, ...updatedFac } : f)
            };
          }
          return s;
        }));
        addNotification(`Facility status updated: ${updatedFac.name} is now ${updatedFac.status}.`, "info");
      }
    } catch (err) {
      console.error("Failed to update facility state:", err);
    }
  };

  // Incident report handler
  const handleAddIncident = async (incidentData: any) => {
    if (!activeStadium) return;
    try {
      const response = await fetch(`/api/stadiums/${activeStadium.id}/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData)
      });

      if (response.ok) {
        const result = await response.json(); // returns { incident, task }
        setStadiums(prev => prev.map(s => {
          if (s.id === activeStadium.id) {
            return {
              ...s,
              incidents: [result.incident, ...s.incidents],
              tasks: [result.task, ...s.tasks]
            };
          }
          return s;
        }));
        addNotification(`🚨 Incident dispatched: ${result.incident.title}. Task assigned to crew.`, "warning");
      }
    } catch (err) {
      console.error("Failed to post incident:", err);
    }
  };

  // Incident update handler (resolve/responding)
  const handleUpdateIncident = async (incidentId: string, updates: Partial<Incident>) => {
    if (!activeStadium) return;
    try {
      const response = await fetch(`/api/stadiums/${activeStadium.id}/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedInc = await response.json();
        setStadiums(prev => prev.map(s => {
          if (s.id === activeStadium.id) {
            // Also sync related tasks
            const resolvedTasks = s.tasks.map(t => {
              if (t.title.includes(updatedInc.title)) {
                return { ...t, status: updatedInc.status === IncidentStatus.RESOLVED ? "COMPLETED" as const : "IN_PROGRESS" as const };
              }
              return t;
            });

            return {
              ...s,
              incidents: s.incidents.map(i => i.id === incidentId ? { ...i, ...updatedInc } : i),
              tasks: resolvedTasks
            };
          }
          return s;
        }));
        addNotification(`Incident updated: ${updatedInc.title} set to ${updatedInc.status}.`, "success");
      }
    } catch (err) {
      console.error("Failed to update incident:", err);
    }
  };

  // Task creation handler
  const handleAddTask = async (taskData: any) => {
    if (!activeStadium) return;
    try {
      const response = await fetch(`/api/stadiums/${activeStadium.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const newTask = await response.json();
        setStadiums(prev => prev.map(s => {
          if (s.id === activeStadium.id) {
            return { ...s, tasks: [newTask, ...s.tasks] };
          }
          return s;
        }));
        addNotification(`Assigned custom task: ${newTask.title}.`, "info");
      }
    } catch (err) {
      console.error("Failed to append staff task:", err);
    }
  };

  // Task update handler (complete/in-progress)
  const handleUpdateTask = async (taskId: string, updates: Partial<StaffTask>) => {
    if (!activeStadium) return;
    try {
      const response = await fetch(`/api/stadiums/${activeStadium.id}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setStadiums(prev => prev.map(s => {
          if (s.id === activeStadium.id) {
            return {
              ...s,
              tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updatedTask } : t)
            };
          }
          return s;
        }));
        addNotification(`Task state updated to ${updatedTask.status}.`, "success");
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Stadium creation handler
  const handleAddStadium = async (stadiumData: any) => {
    try {
      const response = await fetch("/api/stadiums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stadiumData)
      });

      if (response.ok) {
        const newStad: Stadium = await response.json();
        setStadiums(prev => [...prev, newStad]);
        setSelectedStadiumId(newStad.id);
        addNotification(`Successfully initialized smart operations for ${newStad.name}.`, "success");
        return newStad;
      }
    } catch (err) {
      console.error("Failed to provision new stadium:", err);
      throw err;
    }
  };

  // Closed-Loop AI Recommendation Execution Action Handler
  const handleExecuteAIRecommendation = async (rec: AIRecommendation) => {
    if (!activeStadium) return;
    addNotification(`Executing recommendation: ${rec.title}...`, "info");

    try {
      // 1. Redirect Crowd Inflows
      if (rec.category === "CROWD" && rec.affectedFacilityId) {
        // Find Verizon Gate B or affected gate and set wait time to a low value
        const targetGate = activeStadium.facilities.find(f => f.id === rec.affectedFacilityId);
        if (targetGate) {
          await handleUpdateFacility(targetGate.id, {
            status: FacilityStatus.OPERATIONAL,
            queueLength: QueueLength.SHORT,
            waitTimeMinutes: 6
          });
          
          // Also speed up Gate A
          const GateA = activeStadium.facilities.find(f => f.id.includes("gate-a") || f.id.includes("gate-1"));
          if (GateA) {
            await handleUpdateFacility(GateA.id, {
              status: FacilityStatus.OPERATIONAL,
              queueLength: QueueLength.SHORT,
              waitTimeMinutes: 4
            });
          }
        }
      }

      // 2. Dispatch Emergency Medics
      if (rec.category === "MEDICAL") {
        const medicalIncident = activeStadium.incidents.find(i => i.category === "Medical" && i.status !== IncidentStatus.RESOLVED);
        if (medicalIncident) {
          await handleUpdateIncident(medicalIncident.id, {
            status: IncidentStatus.RESPONDING,
            assignedStaffId: "EMT-DISPATCH-92"
          });
        }
      }

      // 3. Resolve Restrooms or spill cleaning
      if (rec.category === "FACILITY" && rec.affectedFacilityId) {
        const restroomIncident = activeStadium.incidents.find(i => i.facilityId === rec.affectedFacilityId);
        if (restroomIncident) {
          await handleUpdateIncident(restroomIncident.id, {
            status: IncidentStatus.RESOLVED,
            resolutionNotes: "Completed emergency wet-mop sanitization and posted yellow warning indicators. Checked hand dry units."
          });
        }
      }

      addNotification(`Successfully deployed actions for: ${rec.title}. GIS Map updated.`, "success");
    } catch (err) {
      console.error("Failed to deploy AI action:", err);
    }
  };

  if (loading || stadiums.length === 0) {
    return (
      <div className="min-h-screen bg-[#08090C] flex flex-col items-center justify-center gap-4 text-[#E0E2E6]">
        <div className="w-10 h-10 border-2 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/60 font-mono animate-pulse">Initializing StadiumGPT OS...</span>
      </div>
    );
  }

  const activeLiveMatch = activeStadium.matchSchedule.find(m => m.status === "LIVE");

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E0E2E6] flex flex-col font-sans relative overflow-hidden">
      {/* Visual Ambient glow backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#C5A059]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#C5A059]/5 blur-[120px] pointer-events-none" />

      {/* 1. TOURNAMENT TICKER HEADER */}
      <header className="bg-[#111216]/80 border-b border-white/10 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between" id="stadium-gpt-navbar">
        {/* Logo & Match Ticker */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/robot_gold_logo_1784202911119.jpg"
              alt="StadiumGPT Logo"
              className="w-8 h-8 rounded-lg object-cover border border-[#C5A059]/30 shadow-[0_0_15px_rgba(197,160,89,0.3)]"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h1 className="font-light tracking-[0.2em] uppercase text-white text-base leading-none">
                Stadium<span className="font-bold text-[#C5A059]">GPT</span>
                <span className="text-[9px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-1.5 py-0.5 rounded ml-2 font-mono tracking-widest font-semibold">OS</span>
              </h1>
              <span className="text-[8px] text-white/40 uppercase tracking-widest font-semibold leading-none mt-1 block">FIFA World Cup</span>
            </div>
          </div>

          {/* Active Live Match Ticker */}
          {activeLiveMatch ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full shrink-0" id="live-match-banner">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-400 font-mono tracking-wide">
                LIVE NOW: {activeLiveMatch.teamA} {activeLiveMatch.score} {activeLiveMatch.teamB} ({activeLiveMatch.stage})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#14161E] border border-white/10 rounded-full" id="matchday-banner">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-[10px] font-bold text-white/60 font-mono tracking-wide">
                MATCHDAY 11 • CONCOURSE SCANNERS NOMINAL
              </span>
            </div>
          )}
        </div>

        {/* Action controls: Stadium selector, Configurator & RBAC Role selection */}
        <div className="flex flex-wrap items-center gap-3 justify-end w-full sm:w-auto">
          {/* Language Selection Toggle */}
          <div className="relative flex items-center gap-2 bg-[#14161E] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#C5A059]" id="language-selection-toggle">
            <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as FIFALanguage)}
              className="bg-transparent border-none text-xs font-semibold text-white/80 focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#14161E] text-white">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Stadium Selection Dropdown */}
          <div className="relative" id="stadium-selection-dropdown">
            <select
              value={selectedStadiumId}
              onChange={(e) => setSelectedStadiumId(e.target.value)}
              className="px-3.5 py-2.5 bg-[#14161E] border border-white/10 rounded-xl text-xs font-semibold text-white/80 focus:outline-none focus:border-[#C5A059] hover:bg-[#1E212B] transition-colors"
            >
              {stadiums.map((s) => (
                <option key={s.id} value={s.id}>
                  🏟️ {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          {/* Configuration Module CTA for Organizers/Admins */}
          <StadiumConfigurator onAddStadium={handleAddStadium} currentUserRole={currentRole} />

          {/* RBAC Role Selector Dropdown */}
          <RoleSelector currentRole={currentRole} onChangeRole={setCurrentRole} />
        </div>
      </header>

      {/* 2. DYNAMIC LIVE OPERATIONS CONTROL STRIP */}
      <section className="bg-white/5 border-b border-white/10 px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center" id="stadium-operations-strip">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#C5A059]" />
          <div>
            <h2 className="font-light tracking-wide text-sm text-white flex items-center gap-2">
              {activeStadium.name} {t("Command Center")}
              <span className="text-[10px] bg-white/10 text-[#C5A059] border border-[#C5A059]/20 px-2 py-0.5 rounded font-mono font-semibold">
                {t("Capacity").toUpperCase()}: {activeStadium.capacity.toLocaleString()}
              </span>
            </h2>
            <p className="text-xs text-white/50 font-normal">{t("Located in")} {activeStadium.address}</p>
          </div>
        </div>

        {/* State Controllers for Staff/Organizers vs Read-Only KPI Ticker for Fans */}
        {currentRole === UserRole.STADIUM_ORGANIZER || currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.STADIUM_STAFF ? (
          <div className="flex flex-wrap items-center gap-4 bg-[#14161E] border border-white/10 p-3 rounded-xl w-full md:w-auto" id="live-staff-controllers">
            <div className="text-xs font-semibold text-[#C5A059] uppercase tracking-widest mr-2 text-[10px]">{t("Live Tweaks:")}</div>
            
            {/* Crowd Density Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/50">{t("Crowd")}:</span>
              <select
                value={activeStadium.crowdDensity}
                onChange={(e) => handleUpdateStadiumOps({ crowdDensity: e.target.value as CrowdDensity })}
                className="px-2 py-1 bg-black border border-white/10 rounded text-xs text-white/80 font-medium focus:outline-none focus:border-[#C5A059]"
              >
                <option value={CrowdDensity.LOW}>LOW</option>
                <option value={CrowdDensity.MODERATE}>MODERATE</option>
                <option value={CrowdDensity.HIGH}>HIGH</option>
                <option value={CrowdDensity.EXTREME}>EXTREME</option>
              </select>
            </div>

            {/* Parking Occupancy Input */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/50">{t("Parking %")}:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={activeStadium.parkingOccupancy}
                onChange={(e) => handleUpdateStadiumOps({ parkingOccupancy: Number(e.target.value) })}
                className="w-14 px-2 py-1 bg-black border border-white/10 rounded text-xs text-white/80 font-medium focus:outline-none focus:border-[#C5A059] text-center"
              />
            </div>

            {/* Traffic Status Input */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/50">{t("Traffic")}:</span>
              <select
                value={activeStadium.trafficStatus}
                onChange={(e) => handleUpdateStadiumOps({ trafficStatus: e.target.value })}
                className="px-2 py-1 bg-black border border-white/10 rounded text-xs text-white/80 font-medium focus:outline-none focus:border-[#C5A059]"
              >
                <option value="Smooth Flow">Smooth Flow</option>
                <option value="Moderate Congestion">Moderate Congestion</option>
                <option value="Heavy Delays">Heavy Delays</option>
              </select>
            </div>

            {/* Weather Alert */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/50">{t("Weather")}:</span>
              <input
                type="text"
                value={activeStadium.weatherAlert || ""}
                onChange={(e) => handleUpdateStadiumOps({ weatherAlert: e.target.value })}
                placeholder="e.g. Heavy rain expected"
                className="w-32 px-2 py-1 bg-black border border-white/10 rounded text-xs text-white/80 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        ) : (
          /* Fan Info Tickers */
          <div className="flex flex-wrap items-center gap-4" id="live-fan-tickers">
            <div className="bg-[#14161E] border border-white/10 rounded-xl px-3.5 py-1.5 text-center flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C5A059]" />
              <div className="text-left leading-none">
                <span className="block text-[8px] text-white/40 font-bold uppercase tracking-wider">{t("Crowd")}</span>
                <span className="font-mono text-xs font-black text-white">{activeStadium.crowdDensity}</span>
              </div>
            </div>

            <div className="bg-[#14161E] border border-white/10 rounded-xl px-3.5 py-1.5 text-center flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-[#C5A059]" />
              <div className="text-left leading-none">
                <span className="block text-[8px] text-white/40 font-bold uppercase tracking-wider">{t("Active Bulletins")}</span>
                <span className="text-xs font-black text-white truncate max-w-[120px]">
                  {activeStadium.weatherAlert || "No alerts"}
                </span>
              </div>
            </div>

            <div className="bg-[#14161E] border border-white/10 rounded-xl px-3.5 py-1.5 text-center flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#C5A059]" />
              <div className="text-left leading-none">
                <span className="block text-[8px] text-white/40 font-bold uppercase tracking-wider">{t("Parking Lots")}</span>
                <span className="font-mono text-xs font-black text-white">{activeStadium.parkingOccupancy}% load</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. PLATFORM BROADCAST / NOTIFICATION TOASTER BAR */}
      {notifications.length > 0 && (
        <div className="px-4 sm:px-6 py-2 bg-[#C5A059]/10 border-b border-[#C5A059]/20 flex items-center justify-between text-[11px] text-white/90" id="broadcast-bar">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-[#C5A059] animate-bounce" />
            <span className="font-semibold text-[#C5A059]">OPERATIONAL FEED:</span>
            <span className="font-normal">{notifications[0].text}</span>
          </div>
          <button 
            onClick={() => setNotifications([])}
            className="text-white/40 hover:text-white/80 font-bold"
          >
            Clear Feeds
          </button>
        </div>
      )}

      {/* 4. MAIN BENTO GRID & VIEWS ORCHESTRATOR */}
      <main className="flex-1 p-4 sm:p-6 space-y-6" id="dashboard-main-viewport">
        {/* Dynamic Super Admin cross-stadium KPI Overview */}
        {currentRole === UserRole.SUPER_ADMIN && (
          <div className="bg-[#14161E] border border-white/10 rounded-xl p-5" id="super-admin-global-kpis">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold text-[#C5A059] flex items-center gap-2 uppercase tracking-[0.15em] font-mono">
                <Globe className="w-4 h-4" />
                Cross-Stadium Global Orchestration Console
              </h3>
              <span className="text-[10px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-2 py-0.5 rounded font-mono font-bold">ALL VENUES SYNCED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-black/40 p-3.5 rounded-lg border border-white/5 text-left">
                <span className="block text-[10px] text-white/50 uppercase tracking-wider">Total Venues</span>
                <span className="block text-xl font-black text-white font-mono mt-0.5">{stadiums.length} stadiums</span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-lg border border-white/5 text-left">
                <span className="block text-[10px] text-white/50 uppercase tracking-wider">Total Combined Capacity</span>
                <span className="block text-xl font-black text-white font-mono mt-0.5">
                  {stadiums.reduce((acc, s) => acc + s.capacity, 0).toLocaleString()} seats
                </span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-lg border border-white/5 text-left">
                <span className="block text-[10px] text-white/50 uppercase tracking-wider">Total Active Safety Incidents</span>
                <span className="block text-xl font-black text-red-400 font-mono mt-0.5">
                  {stadiums.reduce((acc, s) => acc + s.incidents.filter(i => i.status !== IncidentStatus.RESOLVED).length, 0)} alerts
                </span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-lg border border-white/5 text-left">
                <span className="block text-[10px] text-white/50 uppercase tracking-wider">Global Server Health</span>
                <span className="block text-xl font-black text-[#C5A059] font-mono mt-0.5">99.8% nominal</span>
              </div>
            </div>
          </div>
        )}

        {/* Core Tabs Navigator */}
        <div className="flex border-b border-white/10" id="main-view-tabs">
          <button
            onClick={() => setActiveTab("MAP")}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-xs uppercase tracking-[0.1em] border-b-2 transition-all cursor-pointer ${
              activeTab === "MAP" 
                ? "border-[#C5A059] text-[#C5A059]" 
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            {t("Interactive Map & AI Helper")}
          </button>
          
          <button
            onClick={() => setActiveTab("ANALYTICS")}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-xs uppercase tracking-[0.1em] border-b-2 transition-all cursor-pointer ${
              activeTab === "ANALYTICS" 
                ? "border-[#C5A059] text-[#C5A059]" 
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {t("Predictive Analytics")}
          </button>

          <button
            onClick={() => setActiveTab("DECISION")}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-xs uppercase tracking-[0.1em] border-b-2 transition-all cursor-pointer ${
              activeTab === "DECISION" 
                ? "border-[#C5A059] text-[#C5A059]" 
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Bot className="w-4 h-4" />
            {t("AI Decision Support")}
          </button>

          <button
            onClick={() => setActiveTab("SAFETY")}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-xs uppercase tracking-[0.1em] border-b-2 transition-all cursor-pointer ${
              activeTab === "SAFETY" 
                ? "border-[#C5A059] text-[#C5A059]" 
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {t("Incidents & Staff Tasks")}
          </button>

          <button
            onClick={() => setActiveTab("TESTING")}
            className={`flex items-center gap-2 px-5 py-2.5 font-medium text-xs uppercase tracking-[0.1em] border-b-2 transition-all cursor-pointer ${
              activeTab === "TESTING" 
                ? "border-[#C5A059] text-[#C5A059]" 
                : "border-transparent text-white/50 hover:text-white"
            }`}
            id="tab-btn-testing"
            aria-controls="bento-testing-viewport"
            aria-selected={activeTab === "TESTING"}
          >
            <CheckCircle className="w-4 h-4" />
            {t("Compliance & Testing")}
          </button>
        </div>

        {/* Tab contents */}
        <div className="space-y-6" id="active-tab-content-renderer">
          {/* 1. MAP TAB: Contains Interactive Map & StadiumGPT chatbot split view */}
          {activeTab === "MAP" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="bento-map-split">
              {/* GIS Map Core */}
              <div className="xl:col-span-2 space-y-6" id="bento-interactive-map-col">
                <InteractiveMap 
                  stadium={activeStadium} 
                  onUpdateFacility={handleUpdateFacility}
                  currentUserRole={currentRole}
                />
              </div>

              {/* Chatbot Core */}
              <div className="xl:col-span-1" id="bento-chatbot-col">
                <Chatbot stadium={activeStadium} />
              </div>
            </div>
          )}

          {/* 2. ANALYTICS TAB: expected queues and crowd models */}
          {activeTab === "ANALYTICS" && (
            <div className="animate-in fade-in" id="bento-analytics-viewport">
              <AnalyticsDashboard stadium={activeStadium} />
            </div>
          )}

          {/* 3. DECISION SUPPORT TAB: Proactive Recommendations */}
          {activeTab === "DECISION" && (
            <div className="animate-in fade-in" id="bento-decision-viewport">
              <DecisionSupport 
                stadium={activeStadium} 
                onExecuteAction={handleExecuteAIRecommendation}
                currentUserRole={currentRole}
              />
            </div>
          )}

          {/* 4. SAFETY, INCIDENTS & STAFF TASKS HUB */}
          {activeTab === "SAFETY" && (
            <div className="animate-in fade-in" id="bento-safety-viewport">
              <IncidentTaskCenter 
                stadium={activeStadium} 
                currentUserRole={currentRole}
                onAddIncident={handleAddIncident}
                onUpdateIncident={handleUpdateIncident}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
              />
            </div>
          )}

          {/* 5. DIAGNOSTICS, COMPLIANCE & SECURITY SUITE */}
          {activeTab === "TESTING" && (
            <div className="animate-in fade-in" id="bento-testing-viewport">
              <DiagnosticsSuite 
                stadium={activeStadium} 
                stadiums={stadiums}
                currentUserRole={currentRole}
              />
            </div>
          )}
        </div>
      </main>

      {/* 5. METADATA FOOTER */}
      <footer className="bg-[#111216] border-t border-white/10 py-6 px-4 text-center text-xs text-white/40 font-mono" id="platform-footer-credits">
        <span>STADIUMGPT OS • FIFA WORLD CUP DIGITAL VENUE PLATFORM</span>
        <div className="mt-1">
          Authorized Operator Console • Secure Session • All rights reserved
        </div>
      </footer>
    </div>
  );
}
