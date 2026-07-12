/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserRole } from "../types.js";
import { 
  Plus, 
  MapPin, 
  Compass, 
  Calendar, 
  Settings, 
  Sparkles, 
  CheckCircle, 
  Layers 
} from "lucide-react";

interface StadiumConfiguratorProps {
  onAddStadium: (stadiumData: any) => Promise<any>;
  currentUserRole: UserRole;
}

export default function StadiumConfigurator({ onAddStadium, currentUserRole }: StadiumConfiguratorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  // Form Fields
  const [name, setName] = React.useState("");
  const [country, setCountry] = React.useState("United States");
  const [city, setCity] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [latitude, setLatitude] = React.useState("");
  const [longitude, setLongitude] = React.useState("");
  const [capacity, setCapacity] = React.useState("");
  const [eventName, setEventName] = React.useState("FIFA World Cup 2026 - Matchday");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !capacity) return;

    setLoading(true);
    try {
      await onAddStadium({
        name,
        country,
        city,
        address,
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        capacity: Number(capacity),
        eventName
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        // Reset form
        setName("");
        setCity("");
        setAddress("");
        setLatitude("");
        setLongitude("");
        setCapacity("");
        setEventName("FIFA World Cup 2026 - Matchday");
      }, 1500);

    } catch (err) {
      console.error("Failed to register stadium in configurator:", err);
    } finally {
      setLoading(false);
    }
  };

  const isAllowed = currentUserRole === UserRole.STADIUM_ORGANIZER || currentUserRole === UserRole.SUPER_ADMIN;

  if (!isAllowed) return null;

  return (
    <div id="stadium-configurator-container">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#C5A059] hover:bg-[#D8B775] text-black rounded-lg font-semibold text-xs transition-all duration-300 shadow-lg shadow-[#C5A059]/10 cursor-pointer animate-in fade-in"
        id="btn-open-configurator"
      >
        <Plus className="w-4 h-4" />
        Configure Stadium
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="configurator-modal">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#08090C]/90 backdrop-blur-md" 
            onClick={() => !loading && setIsOpen(false)} 
            id="configurator-backdrop"
          />

          {/* Modal Content */}
          <div
            id="configurator-form-container"
            className="relative w-full max-w-2xl bg-[#14161E] border border-white/10 rounded-xl shadow-2xl shadow-black/80 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#C5A059]/10 text-[#C5A059]">
                  <Settings className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="font-semibold text-white text-sm">Configure FIFA 2026 Smart Venue</h3>
                  <p className="text-[10px] text-white/50">Spawn dynamic stadiums with default security, medical & restroom facilities</p>
                </div>
              </div>
              <button
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2" id="configurator-success">
                <div className="w-12 h-12 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                </div>
                <h4 className="font-semibold text-white text-sm">Stadium Configured Successfully!</h4>
                <p className="text-xs text-white/50">Syncing live maps and facilities grids...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Stadium Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Estadio BBVA"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Event / Match Day Name</label>
                    <input
                      type="text"
                      placeholder="e.g. FIFA World Cup 2026 - Group Stage"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Country *</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white/80 text-xs focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="United States">United States</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">City / State *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monterrey"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Spectator Capacity *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 53500"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="Full stadium mailing address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Geographic Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 25.6802"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1">Geographic Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="e.g. -100.2443"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-black border border-white/5 rounded-lg space-y-1.5" id="fac-auto-notice">
                  <span className="block text-[9px] font-bold text-[#C5A059] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Auto-Provisioning Template
                  </span>
                  <p className="text-[10px] text-white/60 leading-normal">
                    To expedite stadium readiness, registering this venue will automatically provision standard operational buffers: **Entry Gate A** and **Restroom Zone 1** (fully interactive on GIS plans).
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-xs font-semibold cursor-pointer border border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name || !city || !capacity}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#C5A059] hover:bg-[#D8B775] disabled:bg-white/5 disabled:text-white/20 text-black rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Register Stadium
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
