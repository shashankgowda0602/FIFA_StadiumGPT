/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserRole } from "../types.js";
import { User, Shield, Users, HelpCircle, HardHat } from "lucide-react";

interface RoleSelectorProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
}

export default function RoleSelector({ currentRole, onChangeRole }: RoleSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const roles = [
    {
      value: UserRole.FOOTBALL_FAN,
      label: "Football Fan",
      description: "Ask AI questions, view interactive maps, get navigation, and report lost items.",
      icon: Users,
      color: "from-emerald-500 to-teal-600",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
    },
    {
      value: UserRole.VOLUNTEER,
      label: "Stadium Volunteer",
      description: "Receive tasks, report field observations, and help visitors.",
      icon: HelpCircle,
      color: "from-amber-500 to-orange-600",
      badgeColor: "bg-amber-500/10 text-amber-400 border border-amber-500/30"
    },
    {
      value: UserRole.STADIUM_STAFF,
      label: "Stadium Staff",
      description: "Update queues, report incidents, manage parking and medical clinic statuses.",
      icon: HardHat,
      color: "from-sky-500 to-blue-600",
      badgeColor: "bg-sky-500/10 text-sky-400 border border-sky-500/30"
    },
    {
      value: UserRole.STADIUM_ORGANIZER,
      label: "Stadium Organizer",
      description: "Configure facilities, view live analytics, assign tasks, and trigger AI suggestions.",
      icon: Shield,
      color: "from-indigo-500 to-purple-600",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
    },
    {
      value: UserRole.SUPER_ADMIN,
      label: "Super Administrator",
      description: "Platform orchestration, cross-stadium global KPIs, and platform health.",
      icon: User,
      color: "from-rose-500 to-red-600",
      badgeColor: "bg-rose-500/10 text-rose-400 border border-rose-500/30"
    }
  ];

  const currentDetails = roles.find(r => r.value === currentRole) || roles[0];
  const IconComponent = currentDetails.icon;

  return (
    <div className="relative z-50" id="role-selector-container">
      <button
        id="role-selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2 bg-[#14161E]/80 border border-white/10 backdrop-blur-md rounded-xl text-sm font-medium text-white/80 hover:bg-[#1E212B] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50 shadow-lg"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded bg-[#C5A059]/20 text-[#C5A059]">
          <IconComponent className="w-4 h-4" />
        </span>
        <div className="text-left hidden sm:block">
          <span className="block text-[10px] text-white/40 uppercase tracking-widest font-semibold leading-none mb-0.5">RBAC Profile</span>
          <span className="font-semibold text-white">{currentDetails.label}</span>
        </div>
        <span className={`inline-block ml-1 text-[11px] px-2 py-0.5 rounded ${currentDetails.badgeColor} sm:hidden`}>
          {currentDetails.label.split(" ")[1] || currentDetails.label}
        </span>
        <svg
          className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)} 
            id="role-selector-backdrop"
          />
          <div
            id="role-selector-menu"
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111216]/95 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/80 overflow-hidden transform origin-top-right transition-all duration-300 z-50 divide-y divide-white/5 animate-in fade-in slide-in-from-top-2"
          >
            <div className="px-4 py-3 bg-black/40">
              <span className="block text-xs font-semibold text-white/40 uppercase tracking-widest">Select Operational Console</span>
            </div>
            <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
              {roles.map((role) => {
                const RoleIcon = role.icon;
                const isSelected = role.value === currentRole;

                return (
                  <button
                    key={role.value}
                    id={`role-option-${role.value.toLowerCase()}`}
                    onClick={() => {
                      onChangeRole(role.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-3.5 p-3 rounded-lg text-left transition-all duration-300 ${
                      isSelected
                        ? "bg-white/5 border border-white/10 text-[#C5A059]"
                        : "hover:bg-white/5 border border-transparent text-white/70"
                    }`}
                  >
                    <span className={`flex items-center justify-center p-2 rounded-lg bg-gradient-to-br ${role.color} text-white shadow-lg`}>
                      <RoleIcon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">{role.label}</span>
                        {isSelected && (
                          <span className="inline-block w-2 h-2 rounded-full bg-[#C5A059] shadow-md shadow-[#C5A059]/50" />
                        )}
                      </div>
                      <span className="block text-xs text-white/50 mt-0.5 leading-relaxed font-normal">
                        {role.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
