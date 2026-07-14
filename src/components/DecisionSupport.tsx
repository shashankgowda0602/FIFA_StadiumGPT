/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Stadium, AIRecommendation, UserRole } from "../types.js";
import { 
  Cpu, 
  Sparkles, 
  CheckCircle, 
  Zap, 
  HelpCircle, 
  ShieldAlert, 
  HeartHandshake, 
  TrafficCone, 
  RefreshCw 
} from "lucide-react";

interface DecisionSupportProps {
  stadium: Stadium;
  onExecuteAction: (recommendation: AIRecommendation) => void;
  currentUserRole: UserRole;
}

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case "CROWD": return <UsersIcon className="w-4 h-4 text-indigo-400" />;
    case "SECURITY": return <ShieldAlert className="w-4 h-4 text-red-400" />;
    case "MEDICAL": return <HeartHandshake className="w-4 h-4 text-rose-400" />;
    case "FACILITY": return <Cpu className="w-4 h-4 text-amber-400" />;
    case "TRAFFIC": return <TrafficCone className="w-4 h-4 text-sky-400" />;
    default: return <Sparkles className="w-4 h-4 text-emerald-400" />;
  }
};

const getConfidenceBadgeColor = (score: number) => {
  if (score >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (score >= 75) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  return "text-blue-400 bg-blue-500/10 border-blue-500/30";
};

export default function DecisionSupport({ stadium, onExecuteAction, currentUserRole }: DecisionSupportProps) {
  const [recommendations, setRecommendations] = React.useState<AIRecommendation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"ALL" | "CROWD" | "MEDICAL" | "FACILITY">("ALL");

  const triggerFetchRecommendations = React.useCallback(async (active: boolean) => {
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/decision-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stadiumId: stadium.id })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch support decisions");
      }

      const data = await response.json();
      if (active) {
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }, [stadium.id]);

  // Re-fetch recommendations when stadium changes
  React.useEffect(() => {
    let active = true;
    triggerFetchRecommendations(active);
    return () => {
      active = false;
    };
  }, [stadium.id, triggerFetchRecommendations]);

  const handleExecute = (rec: AIRecommendation) => {
    onExecuteAction(rec);
    // Mark recommendation as locally triggered
    setRecommendations(prev => 
      prev.map(r => r.id === rec.id ? { ...r, actionTriggered: true } : r)
    );
  };

  const filteredRecs = React.useMemo(() => {
    return recommendations.filter(r => 
      activeTab === "ALL" || r.category === activeTab
    );
  }, [recommendations, activeTab]);

  return (
    <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-xl" id="decision-support-panel">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-4">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#C5A059] animate-pulse" />
            StadiumGPT Cognitive Decision Support
          </h3>
          <p className="text-xs text-white/50">Proactive tournament orchestration models powered by Google Gemini</p>
        </div>
        <button
          onClick={() => triggerFetchRecommendations(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-xs font-semibold border border-white/10 disabled:text-white/20 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Run Real-time Diagnostics
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" id="support-category-tabs">
        {(["ALL", "CROWD", "MEDICAL", "FACILITY"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all border ${
              activeTab === tab 
                ? "bg-white/5 text-[#C5A059] border-[#C5A059]/30" 
                : "bg-black/40 text-white/40 border-transparent hover:text-white/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Recommendations Feed */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
          <span className="text-xs text-white/40 font-mono">Analyzing crowd inflows and incident queues...</span>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="py-8 text-center text-white/40 text-xs bg-black/40 border border-white/10 border-dashed rounded-lg">
          No proactive suggestions are active for your chosen category. Stadium buffers are operating perfectly.
        </div>
      ) : (
        <div className="space-y-4" id="ai-recs-list">
          {filteredRecs.map((rec) => (
            <div
              key={rec.id}
              id={`ai-rec-card-${rec.id}`}
              className={`p-4 bg-black border rounded-lg transition-all duration-300 ${
                rec.actionTriggered 
                  ? "border-[#C5A059]/30 opacity-75 shadow-lg shadow-[#C5A059]/5" 
                  : "border-white/10 hover:border-[#C5A059]/30 shadow-lg"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex items-center justify-center w-8 h-8 rounded bg-white/5 border border-white/10 shrink-0 mt-0.5">
                    {getCategoryIcon(rec.category)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-white/40 uppercase font-mono tracking-wider">
                        {rec.category} RECOMMENDATION
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${getConfidenceBadgeColor(rec.confidenceScore)}`}>
                        {rec.confidenceScore}% confidence
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-white mt-1 mb-1 truncate">{rec.title}</h4>
                    <p className="text-xs text-white/80 bg-white/5 p-2.5 rounded-lg border border-white/5 font-normal leading-relaxed">
                      {rec.recommendation}
                    </p>
                    
                    {/* Reasoning Section */}
                    <div className="mt-2.5 space-y-1">
                      <span className="block text-[9px] font-black text-white/30 uppercase tracking-widest">Cognitive Reasoning</span>
                      <p className="text-[11px] text-white/50 leading-relaxed italic">{rec.reasoning}</p>
                    </div>
                  </div>
                </div>

                {/* Execute Button */}
                <div className="shrink-0 w-full sm:w-auto">
                  {rec.actionTriggered ? (
                    <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-lg text-xs font-bold font-mono">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Executed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleExecute(rec)}
                      disabled={currentUserRole === UserRole.FOOTBALL_FAN || currentUserRole === UserRole.VOLUNTEER}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#C5A059] hover:bg-[#D8B775] disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent text-black font-semibold rounded-lg text-xs transition-all cursor-pointer shadow-lg shadow-[#C5A059]/10"
                      title={
                        currentUserRole === UserRole.FOOTBALL_FAN || currentUserRole === UserRole.VOLUNTEER
                          ? "Available to Stadium Organizers & Staff only"
                          : "Activate recommendation"
                      }
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Deploy Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline fallback SVG component for Users
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
