/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  STADIUM_ORGANIZER = "STADIUM_ORGANIZER",
  STADIUM_STAFF = "STADIUM_STAFF",
  VOLUNTEER = "VOLUNTEER",
  FOOTBALL_FAN = "FOOTBALL_FAN"
}

export enum FacilityCategory {
  ENTRY_GATE = "ENTRY_GATE",
  EXIT_GATE = "EXIT_GATE",
  SEATING_SECTION = "SEATING_SECTION",
  PARKING_AREA = "PARKING_AREA",
  FOOD_COURT = "FOOD_COURT",
  RESTAURANT = "RESTAURANT",
  WATER_STATION = "WATER_STATION",
  MEDICAL_CENTER = "MEDICAL_CENTER",
  RESTROOM = "RESTROOM",
  PRAYER_ROOM = "PRAYER_ROOM",
  MERCHANDISE_STORE = "MERCHANDISE_STORE",
  INFORMATION_DESK = "INFORMATION_DESK",
  CHARGING_STATION = "CHARGING_STATION",
  LOST_FOUND = "LOST_FOUND",
  VOLUNTEER_BOOTH = "VOLUNTEER_BOOTH",
  VIP_LOUNGE = "VIP_LOUNGE",
  ACCESSIBILITY_SERVICE = "ACCESSIBILITY_SERVICE",
  EMERGENCY_EXIT = "EMERGENCY_EXIT"
}

export enum FacilityStatus {
  OPERATIONAL = "OPERATIONAL",
  CONGESTED = "CONGESTED",
  LIMITED_SERVICE = "LIMITED_SERVICE",
  CLOSED = "CLOSED",
  EMERGENCY = "EMERGENCY"
}

export enum CrowdDensity {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  EXTREME = "EXTREME"
}

export enum QueueLength {
  NONE = "NONE",
  SHORT = "SHORT",
  MEDIUM = "MEDIUM",
  LONG = "LONG",
  CRITICAL = "CRITICAL"
}

export enum IncidentStatus {
  ACTIVE = "ACTIVE",
  RESPONDING = "RESPONDING",
  RESOLVED = "RESOLVED"
}

export enum IncidentSeverity {
  INFO = "INFO",
  MINOR = "MINOR",
  MAJOR = "MAJOR",
  CRITICAL = "CRITICAL"
}

export interface MatchSchedule {
  id: string;
  matchNumber: number;
  stage: string; // e.g., "Group Stage", "Round of 32", "Quarter-Final", "Opening Match"
  teamA: string;
  teamB: string;
  date: string;
  time: string; // UTC or local
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
  score?: string; // e.g., "2-1"
  attendance?: number;
}

export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  description: string;
  latitude: number; // local grid coordinates or offset for rendering
  longitude: number;
  capacity: number;
  status: FacilityStatus;
  openingHours: string;
  queueLength: QueueLength;
  waitTimeMinutes: number;
  foodDetails?: {
    hasVegetarian: boolean;
    hasHalal: boolean;
    popularItems: string[];
  };
}

export interface Incident {
  id: string;
  title: string;
  category: string; // "Medical", "Security", "Maintenance", "Crowd", "Lost Item", "Lost Child"
  description: string;
  facilityId?: string; // Near which gate or restroom
  section?: string;    // Stadium section
  severity: IncidentSeverity;
  status: IncidentStatus;
  reporterName: string;
  reportedAt: string;
  assignedStaffId?: string;
  resolutionNotes?: string;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  assignedRole: UserRole.STADIUM_STAFF | UserRole.VOLUNTEER;
  assignedUserId?: string;
  stadiumId: string;
  facilityId?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
}

export interface Stadium {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  eventName: string; // e.g., "FIFA World Cup - Matchday 1"
  matchSchedule: MatchSchedule[];
  facilities: Facility[];
  incidents: Incident[];
  tasks: StaffTask[];
  
  // Realtime Live operations states
  crowdDensity: CrowdDensity;
  parkingOccupancy: number; // percentage 0 - 100
  weatherAlert?: string;     // e.g., "Heavy Rain Warning" or "None"
  trafficStatus: string;    // e.g., "Smooth Flow", "Moderate Congestion", "Heavy Delays"
  emergencyAlert?: string;  // Stadium-wide broadcast
}

export interface AIRecommendation {
  id: string;
  title: string;
  category: "CROWD" | "SECURITY" | "MEDICAL" | "FACILITY" | "TRAFFIC";
  recommendation: string;
  reasoning: string;
  confidenceScore: number; // 0 to 100
  actionTriggered: boolean;
  affectedFacilityId?: string;
}

export interface PredictiveMetrics {
  hourlyForecast: {
    hour: string; // e.g. "14:00", "15:00"
    crowdInflow: number; // predicted number of people
    queueWaitTimeGates: number; // predicted wait times at gates
    parkingOccupancy: number; // predicted parking utilization %
    foodDemandLevel: number; // predicted demand %
    restroomDemandLevel: number; // predicted demand %
  }[];
  riskFactors: {
    category: string;
    riskScore: number; // 0-100
    reason: string;
  }[];
}

export interface StadiumGPTMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
}
