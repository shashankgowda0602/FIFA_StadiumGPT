/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Stadium, PredictiveMetrics } from "../types.js";
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Users, 
  Car, 
  Utensils 
} from "lucide-react";

interface AnalyticsDashboardProps {
  stadium: Stadium;
}

export default function AnalyticsDashboard({ stadium }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = React.useState<PredictiveMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchPredictiveData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stadiums/${stadium.id}/predictive`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Error fetching predictive metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPredictiveData();
  }, [stadium]);

  if (loading || !metrics) {
    return (
      <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-8 text-center" id="analytics-loading">
        <div className="w-10 h-10 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs text-white/40 font-mono">Running crowd simulation and demand forecasts...</span>
      </div>
    );
  }

  // Calculate some aggregate values for top KPIs
  const maxInflow = Math.max(...metrics.hourlyForecast.map(h => h.crowdInflow));
  const avgWait = Math.round(metrics.hourlyForecast.reduce((acc, h) => acc + h.queueWaitTimeGates, 0) / metrics.hourlyForecast.length);
  const highestRisk = metrics.riskFactors.sort((a, b) => b.riskScore - a.riskScore)[0];

  return (
    <div className="space-y-6" id="analytics-dashboard-panel">
      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="analytics-kpis">
        <div className="bg-black border border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-lg">
          <span className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <span className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold font-sans">Predicted Peak Inflow</span>
            <span className="block font-mono text-xl font-black text-white mt-0.5">{maxInflow.toLocaleString()} fans/hr</span>
            <span className="block text-[10px] text-indigo-400 font-medium mt-0.5 font-mono">Estimated near kickoff hour</span>
          </div>
        </div>

        <div className="bg-black border border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-lg">
          <span className="p-3 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 rounded-lg shrink-0">
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <span className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold font-sans">Avg Gate Wait Forecast</span>
            <span className="block font-mono text-xl font-black text-white mt-0.5">{avgWait} mins</span>
            <span className="block text-[10px] text-[#C5A059] font-medium mt-0.5 font-mono">Optimized routing active</span>
          </div>
        </div>

        <div className="bg-black border border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-lg">
          <span className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <span className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold font-sans">Critical Risk Forecast</span>
            <span className="block font-mono text-sm font-bold text-white mt-1 truncate max-w-[170px]">{highestRisk?.category || "None"}</span>
            <span className="block text-[10px] text-amber-400 font-bold font-mono mt-0.5">Score: {highestRisk?.riskScore || 0}/100</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics-charts-row1">
        {/* Crowd Congestion Flow */}
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 shadow-xl">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5 text-sm">
            <TrendingUp className="w-4 h-4 text-[#C5A059]" />
            Predicted Hourly Spectator Inflow
          </h3>
          <p className="text-xs text-white/50 mb-4">Hourly gate ingress volume projections (spectators/hour)</p>
          <div className="h-[200px]" id="crowd-inflow-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.hourlyForecast} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111216", borderColor: "rgba(255, 255, 255, 0.15)", borderRadius: "8px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ color: "#C5A059", fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="crowdInflow" name="Inflow (Fans)" stroke="#C5A059" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gate Wait Time Projections */}
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 shadow-xl">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5 text-sm">
            <Clock className="w-4 h-4 text-indigo-400" />
            Predicted Gate Queue Delay Curves
          </h3>
          <p className="text-xs text-white/50 mb-4">Projections of wait times (minutes) at ticket scanners and bag check</p>
          <div className="h-[200px]" id="gate-delay-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.hourlyForecast} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111216", borderColor: "rgba(255, 255, 255, 0.15)", borderRadius: "8px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ color: "#a5b4fc", fontSize: "11px" }}
                />
                <Line type="monotone" dataKey="queueWaitTimeGates" name="Wait Time (Mins)" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="analytics-charts-row2">
        {/* Food and Restroom Demand Levels */}
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 shadow-xl lg:col-span-2">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5 text-sm">
            <Utensils className="w-4 h-4 text-amber-500" />
            Predictive Demand Load (Food vs Restrooms)
          </h3>
          <p className="text-xs text-white/50 mb-4">Expected dynamic capacity utilization loads (%) around main corridors</p>
          <div className="h-[200px]" id="demand-load-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.hourlyForecast} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} domain={[0, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#111216", borderColor: "rgba(255, 255, 255, 0.15)", borderRadius: "8px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Bar dataKey="foodDemandLevel" name="Food Courts Demand %" fill="#C5A059" radius={[4, 4, 0, 0]} />
                <Bar dataKey="restroomDemandLevel" name="Restrooms Demand %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Assessment List */}
        <div className="bg-[#14161E]/90 border border-white/10 rounded-xl p-5 shadow-xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1.5 text-sm">
              <Activity className="w-4 h-4 text-rose-500" />
              Tournament Risk Factors
            </h3>
            <p className="text-xs text-white/50 mb-4">Calculated risk ratings based on weather, congestion & parking</p>
          </div>

          <div className="space-y-4 my-2 flex-1" id="risk-factors-list">
            {metrics.riskFactors.map((risk, idx) => {
              const score = risk.riskScore;
              let barColor = "bg-[#C5A059]";
              if (score >= 75) barColor = "bg-red-600";
              else if (score >= 45) barColor = "bg-amber-500";

              return (
                <div key={idx} className="space-y-1.5" id={`risk-factor-${idx}`}>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-white/80 truncate max-w-[180px]">{risk.category}</span>
                    <span className="font-mono text-[10px] text-white/40">{score}/100</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${score}%` }} />
                  </div>
                  <p className="text-[10px] text-white/50 leading-normal italic">{risk.reason}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/5 pt-3 flex items-center gap-1.5 text-[10px] text-[#C5A059] font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
            DIAGNOSTIC STATUS: NOMINAL (STABLE BUFFERS)
          </div>
        </div>
      </div>
    </div>
  );
}
