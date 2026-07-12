/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Stadium, 
  Incident, 
  StaffTask, 
  UserRole, 
  IncidentSeverity, 
  IncidentStatus 
} from "../types.js";
import { 
  ShieldAlert, 
  ClipboardList, 
  CheckSquare, 
  Square, 
  Play, 
  HeartHandshake, 
  UserPlus, 
  AlertOctagon,
  FileText,
  Clock,
  Plus
} from "lucide-react";

interface IncidentTaskCenterProps {
  stadium: Stadium;
  currentUserRole: UserRole;
  onAddIncident: (incidentData: any) => void;
  onUpdateIncident: (incidentId: string, updates: Partial<Incident>) => void;
  onAddTask: (taskData: any) => void;
  onUpdateTask: (taskId: string, updates: Partial<StaffTask>) => void;
}

export default function IncidentTaskCenter({
  stadium,
  currentUserRole,
  onAddIncident,
  onUpdateIncident,
  onAddTask,
  onUpdateTask
}: IncidentTaskCenterProps) {
  const [activeTab, setActiveTab] = React.useState<"INCIDENTS" | "TASKS">("INCIDENTS");

  // Incident form states
  const [incTitle, setIncTitle] = React.useState("");
  const [incCategory, setIncCategory] = React.useState("Medical");
  const [incDesc, setIncDesc] = React.useState("");
  const [incSection, setIncSection] = React.useState("");
  const [incSeverity, setIncSeverity] = React.useState<IncidentSeverity>(IncidentSeverity.MINOR);
  const [incFacilityId, setIncFacilityId] = React.useState("");
  const [showIncidentForm, setShowIncidentForm] = React.useState(false);

  // Task form states
  const [taskTitle, setTaskTitle] = React.useState("");
  const [taskDesc, setTaskDesc] = React.useState("");
  const [taskRole, setTaskRole] = React.useState<UserRole.STADIUM_STAFF | UserRole.VOLUNTEER>(UserRole.VOLUNTEER);
  const [taskFacilityId, setTaskFacilityId] = React.useState("");
  const [showTaskForm, setShowTaskForm] = React.useState(false);

  // Selected incident for action (e.g., resolution notes)
  const [actioningIncidentId, setActioningIncidentId] = React.useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = React.useState("");
  const [assignedStaff, setAssignedStaff] = React.useState("");

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle || !incDesc || !incSeverity) return;

    onAddIncident({
      title: incTitle,
      category: incCategory,
      description: incDesc,
      section: incSection,
      severity: incSeverity,
      facilityId: incFacilityId || undefined,
      reporterName: `Console [${currentUserRole}]`
    });

    // Reset Form
    setIncTitle("");
    setIncDesc("");
    setIncSection("");
    setIncSeverity(IncidentSeverity.MINOR);
    setIncFacilityId("");
    setShowIncidentForm(false);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDesc) return;

    onAddTask({
      title: taskTitle,
      description: taskDesc,
      assignedRole: taskRole,
      facilityId: taskFacilityId || undefined
    });

    // Reset Form
    setTaskTitle("");
    setTaskDesc("");
    setTaskRole(UserRole.VOLUNTEER);
    setTaskFacilityId("");
    setShowTaskForm(false);
  };

  const handleResolveIncident = (incId: string) => {
    if (!resolutionNotes.trim()) return;
    onUpdateIncident(incId, {
      status: IncidentStatus.RESOLVED,
      resolutionNotes: resolutionNotes,
      assignedStaffId: assignedStaff || undefined
    });
    setActioningIncidentId(null);
    setResolutionNotes("");
    setAssignedStaff("");
  };

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case IncidentSeverity.INFO: return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case IncidentSeverity.MINOR: return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case IncidentSeverity.MAJOR: return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case IncidentSeverity.CRITICAL: return "bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse";
    }
  };

  const getStatusBadge = (stat: IncidentStatus) => {
    switch (stat) {
      case IncidentStatus.ACTIVE: return "bg-red-500/10 text-red-400 border border-red-500/20";
      case IncidentStatus.RESPONDING: return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case IncidentStatus.RESOLVED: return "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20";
    }
  };

  return (
    <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-xl" id="incidents-tasks-panel">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/5 pb-3 mb-5 justify-between items-center">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("INCIDENTS")}
            className={`flex items-center gap-2 pb-1.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "INCIDENTS" 
                ? "border-[#C5A059] text-[#C5A059]" 
                : "border-transparent text-white/40 hover:text-white/80"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Active Incidents ({stadium.incidents.length})
          </button>
          <button
            onClick={() => setActiveTab("TASKS")}
            className={`flex items-center gap-2 pb-1.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "TASKS" 
                ? "border-[#C5A059] text-[#C5A059]" 
                : "border-transparent text-white/40 hover:text-white/80"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Assigned Task List ({stadium.tasks.length})
          </button>
        </div>

        {/* Header CTA Buttons based on roles */}
        <div>
          {activeTab === "INCIDENTS" ? (
            <button
              onClick={() => setShowIncidentForm(!showIncidentForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Report Incident
            </button>
          ) : (
            (currentUserRole === UserRole.STADIUM_ORGANIZER || currentUserRole === UserRole.SUPER_ADMIN) && (
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059] hover:bg-[#D8B775] text-black font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Assign Custom Task
              </button>
            )
          )}
        </div>
      </div>

      {/* 1. INCIDENTS TAB */}
      {activeTab === "INCIDENTS" && (
        <div className="space-y-4" id="incidents-viewport">
          {/* Incident Report Overlay Form */}
          {showIncidentForm && (
            <form onSubmit={handleIncidentSubmit} className="bg-black p-4 border border-red-500/30 rounded-lg space-y-3 animate-in fade-in" id="incident-report-form">
              <span className="block text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                Report New Incident / Hazard
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Incident Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken hand sanitizer, Medical heat"
                    value={incTitle}
                    onChange={(e) => setIncTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Category</label>
                  <select
                    value={incCategory}
                    onChange={(e) => setIncCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Medical">Medical Emergency</option>
                    <option value="Security">Security Incident</option>
                    <option value="Maintenance">Maintenance Request</option>
                    <option value="Crowd">Crowd Control Issues</option>
                    <option value="Lost Child">Lost Child</option>
                    <option value="Lost Item">Lost Item</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Description / Location Details *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide precise details of what occurred so dispatch teams can act."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Section Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Concourse Sec 112"
                    value={incSection}
                    onChange={(e) => setIncSection(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Severity Rating</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value={IncidentSeverity.INFO}>INFO</option>
                    <option value={IncidentSeverity.MINOR}>MINOR</option>
                    <option value={IncidentSeverity.MAJOR}>MAJOR</option>
                    <option value={IncidentSeverity.CRITICAL}>CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Associate Facility</label>
                  <select
                    value={incFacilityId}
                    onChange={(e) => setIncFacilityId(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="">-- None --</option>
                    {stadium.facilities.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowIncidentForm(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs font-semibold cursor-pointer border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Dispatch Incident
                </button>
              </div>
            </form>
          )}

          {/* List of incidents */}
          {stadium.incidents.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-xs bg-black/40 border border-white/10 border-dashed rounded-lg">
              ✅ No active safety incidents or hazards reported for {stadium.name}.
            </div>
          ) : (
            <div className="space-y-3" id="active-incidents-feed">
              {stadium.incidents.map((inc) => (
                <div
                  key={inc.id}
                  id={`incident-feed-card-${inc.id}`}
                  className="p-4 bg-black border border-white/10 rounded-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusBadge(inc.status)}`}>
                        {inc.status}
                      </span>
                      <h4 className="font-semibold text-xs text-white">{inc.title}</h4>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed font-normal">{inc.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-[10px] text-white/40 font-medium">
                    <span>Category: <strong className="text-white/70">{inc.category}</strong></span>
                    <span>Reporter: <strong className="text-white/70">{inc.reporterName}</strong></span>
                    {inc.section && (
                      <span>Section: <strong className="text-white/70">{inc.section}</strong></span>
                    )}
                    {inc.assignedStaffId && (
                      <span>Assigned Code: <strong className="text-[#C5A059]">{inc.assignedStaffId}</strong></span>
                    )}
                  </div>

                  {inc.resolutionNotes && (
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-[11px] text-white/80">
                      <strong>Resolution Notes:</strong> {inc.resolutionNotes}
                    </div>
                  )}

                  {/* Dispatch and Resolve Action bar for staff / organizer */}
                  {inc.status !== IncidentStatus.RESOLVED && 
                   (currentUserRole === UserRole.STADIUM_STAFF || 
                    currentUserRole === UserRole.STADIUM_ORGANIZER || 
                    currentUserRole === UserRole.SUPER_ADMIN) && (
                    <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                      {actioningIncidentId === inc.id ? (
                        <div className="space-y-2" id="resolution-notes-form">
                          <input
                            type="text"
                            placeholder="Add responder ID (e.g. EMT-1, Cleaners)"
                            value={assignedStaff}
                            onChange={(e) => setAssignedStaff(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-black border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A059]"
                          />
                          <textarea
                            rows={2}
                            placeholder="Type resolution steps completed..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-black border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A059]"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setActioningIncidentId(null)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded text-[10px] font-semibold cursor-pointer border border-white/5"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleResolveIncident(inc.id)}
                              disabled={!resolutionNotes.trim()}
                              className="px-3 py-1 bg-[#C5A059] hover:bg-[#D8B775] text-black rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Resolve Incident
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          {inc.status === IncidentStatus.ACTIVE && (
                            <button
                              onClick={() => onUpdateIncident(inc.id, { status: IncidentStatus.RESPONDING })}
                              className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              <Play className="w-3 h-3 text-[#C5A059]" />
                              Begin Dispatch Response
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActioningIncidentId(inc.id);
                              setResolutionNotes("");
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#C5A059] hover:bg-[#D8B775] text-black rounded text-[10px] font-semibold cursor-pointer"
                          >
                            <CheckSquare className="w-3 h-3" />
                            Resolve with Notes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. TASKS TAB */}
      {activeTab === "TASKS" && (
        <div className="space-y-4" id="tasks-viewport">
          {/* Custom Task Form */}
          {showTaskForm && (
            <form onSubmit={handleTaskSubmit} className="bg-black p-4 border border-[#C5A059]/30 rounded-lg space-y-3 animate-in fade-in" id="custom-task-form">
              <span className="block text-xs font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Assign New Operational Staff/Volunteer Task
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inspect hand sanitizers, Gate 4 queue divide"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Assign Role Target</label>
                  <select
                    value={taskRole}
                    onChange={(e) => setTaskRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/85 text-xs focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value={UserRole.VOLUNTEER}>Stadium Volunteer</option>
                    <option value={UserRole.STADIUM_STAFF}>Stadium Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Task Instructions *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide brief details on what steps are expected."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Facility Link (Optional)</label>
                <select
                  value={taskFacilityId}
                  onChange={(e) => setTaskFacilityId(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/85 text-xs focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="">-- None --</option>
                  {stadium.facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs font-semibold cursor-pointer border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#C5A059] hover:bg-[#D8B775] text-black font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Create & Dispatch Task
                </button>
              </div>
            </form>
          )}

          {/* List of Tasks */}
          {stadium.tasks.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-xs bg-black/40 border border-white/10 border-dashed rounded-lg">
              📝 No tasks are currently assigned. Enjoy your matchday!
            </div>
          ) : (
            <div className="space-y-2" id="stadium-tasks-list">
              {stadium.tasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                const isInProgress = task.status === "IN_PROGRESS";
                
                // Determine if user can edit based on RBAC
                const canActOnTask = 
                  currentUserRole === UserRole.SUPER_ADMIN || 
                  currentUserRole === UserRole.STADIUM_ORGANIZER || 
                  currentUserRole === task.assignedRole;

                return (
                  <div
                    key={task.id}
                    id={`task-list-card-${task.id}`}
                    className={`p-3.5 bg-black border rounded-lg flex items-start gap-3.5 justify-between transition-all duration-300 ${
                      isCompleted 
                        ? "border-[#C5A059]/10 opacity-60" 
                        : (isInProgress ? "border-amber-500/30 bg-white/[0.02]" : "border-white/10")
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Interactive checkbox / indicator */}
                      <button
                        onClick={() => {
                          if (canActOnTask) {
                            onUpdateTask(task.id, { status: isCompleted ? "PENDING" : "COMPLETED" });
                          }
                        }}
                        disabled={!canActOnTask}
                        className={`shrink-0 mt-0.5 p-1 rounded-md transition-colors ${
                          isCompleted ? "text-[#C5A059] hover:bg-[#C5A059]/10" : "text-white/30 hover:bg-white/5"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <span className={`block font-semibold text-xs text-white ${isCompleted && "line-through text-white/30"}`}>
                          {task.title}
                        </span>
                        <p className="text-[11px] text-white/50 mt-0.5 font-normal leading-relaxed">{task.description}</p>
                        
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-white/40 font-semibold font-mono">
                          <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-[9px]">
                            {task.assignedRole}
                          </span>
                          {isInProgress && (
                            <span className="text-amber-400 font-bold">● IN PROGRESS</span>
                          )}
                          {isCompleted && (
                            <span className="text-[#C5A059] font-bold">✓ COMPLETED</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress toggle button for staffs */}
                    {!isCompleted && !isInProgress && canActOnTask && (
                      <button
                        onClick={() => onUpdateTask(task.id, { status: "IN_PROGRESS" })}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 rounded text-[10px] font-bold cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-amber-400" />
                        Start
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
