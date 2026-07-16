/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  Stadium, 
  FacilityCategory, 
  FacilityStatus, 
  CrowdDensity, 
  QueueLength, 
  IncidentSeverity, 
  IncidentStatus, 
  UserRole,
  StaffTask,
  Facility,
  Incident
} from "./src/types.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Robust XSS input sanitization and length truncation security helper
function sanitizeString(str: any, maxLength: number = 255): string {
  if (typeof str !== "string") return "";
  let clean = str.trim();
  // Strip standard HTML tags to block Stored/Reflected XSS payloads
  clean = clean.replace(/<[^>]*>/g, "");
  // Enforce security boundaries on length
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  return clean;
}

// Initialize server-side Gemini API Client with recommended telemetry headers
const geminiApiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("Warning: GEMINI_API_KEY is not configured or set to placeholder. Gemini capabilities will fall back to smart local rule-based assistance.");
}

const currentYear = new Date().getFullYear();

// Pre-seeded high-fidelity stadium databases
let stadiums: Stadium[] = [
  {
    id: "stadium-metlife",
    name: "MetLife Stadium",
    country: "United States",
    city: "East Rutherford, NJ/NY",
    address: "1 MetLife Stadium Dr, East Rutherford, NJ 07073",
    latitude: 40.8135,
    longitude: -74.0744,
    capacity: 82500,
    eventName: "FIFA World Cup - Matchday 11",
    crowdDensity: CrowdDensity.MODERATE,
    parkingOccupancy: 65,
    weatherAlert: "Heat Advisory - Hydration recommended",
    trafficStatus: "Moderate Congestion",
    emergencyAlert: "",
    matchSchedule: [
      {
        id: "m-nj-1",
        matchNumber: 11,
        stage: "Group Stage",
        teamA: "USA",
        teamB: "Italy",
        date: `${currentYear}-06-15`,
        time: "19:00",
        status: "LIVE",
        score: "1-1",
        attendance: 81842
      },
      {
        id: "m-nj-2",
        matchNumber: 40,
        stage: "Group Stage",
        teamA: "Portugal",
        teamB: "Morocco",
        date: `${currentYear}-06-22`,
        time: "15:00",
        status: "SCHEDULED"
      },
      {
        id: "m-nj-3",
        matchNumber: 104,
        stage: "Final Match",
        teamA: "Winner SF1",
        teamB: "Winner SF2",
        date: `${currentYear}-07-19`,
        time: "20:00",
        status: "SCHEDULED"
      }
    ],
    facilities: [
      {
        id: "nj-gate-a",
        name: "Welcome Gate A (North Entrance)",
        category: FacilityCategory.ENTRY_GATE,
        description: "Main north passenger terminal with security scanners & ticketing booths.",
        latitude: 25,
        longitude: 15,
        capacity: 15000,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 22:30",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 5
      },
      {
        id: "nj-gate-b",
        name: "Verizon Gate B (East Entrance)",
        category: FacilityCategory.ENTRY_GATE,
        description: "Primary entrance next to the rail transit platform.",
        latitude: 75,
        longitude: 20,
        capacity: 20000,
        status: FacilityStatus.CONGESTED,
        openingHours: "15:00 - 22:30",
        queueLength: QueueLength.CRITICAL,
        waitTimeMinutes: 45
      },
      {
        id: "nj-gate-c",
        name: "MetLife Gate C (South Entrance)",
        category: FacilityCategory.ENTRY_GATE,
        description: "South ticket processing area, heavily serving Parking Lots G & F.",
        latitude: 80,
        longitude: 80,
        capacity: 15000,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 22:30",
        queueLength: QueueLength.MEDIUM,
        waitTimeMinutes: 15
      },
      {
        id: "nj-gate-d",
        name: "Pepsi Gate D (West Entrance)",
        category: FacilityCategory.ENTRY_GATE,
        description: "West transit shuttle drop-off & ticket scanner bay.",
        latitude: 20,
        longitude: 75,
        capacity: 15000,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 22:30",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 4
      },
      {
        id: "nj-parking-a",
        name: "Gold Parking Lot A",
        category: FacilityCategory.PARKING_AREA,
        description: "Premium parking on the north rim, pre-paid passes only.",
        latitude: 15,
        longitude: 10,
        capacity: 4000,
        status: FacilityStatus.CONGESTED,
        openingHours: "12:00 - 23:59",
        queueLength: QueueLength.LONG,
        waitTimeMinutes: 25
      },
      {
        id: "nj-parking-f",
        name: "General Parking Lot F/G",
        category: FacilityCategory.PARKING_AREA,
        description: "Public general parking with complimentary shuttles to Gate D.",
        latitude: 90,
        longitude: 85,
        capacity: 8000,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "12:00 - 23:59",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 5
      },
      {
        id: "nj-food-1",
        name: "Hudson River Grill & Bites",
        category: FacilityCategory.FOOD_COURT,
        description: "Gourmet hot dogs, NY style pizzas, soft drinks.",
        latitude: 45,
        longitude: 35,
        capacity: 250,
        status: FacilityStatus.CONGESTED,
        openingHours: "16:00 - 22:00",
        queueLength: QueueLength.LONG,
        waitTimeMinutes: 22,
        foodDetails: {
          hasVegetarian: true,
          hasHalal: false,
          popularItems: ["Nathan's Hot Dog", "NY Pepperoni Slice", "Jersey Pretzel"]
        }
      },
      {
        id: "nj-food-2",
        name: "Jersey Taco Plaza",
        category: FacilityCategory.FOOD_COURT,
        description: "Spicy chicken tacos, vegetarian quesadillas, and cold nachos.",
        latitude: 55,
        longitude: 65,
        capacity: 180,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "16:00 - 22:00",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 3,
        foodDetails: {
          hasVegetarian: true,
          hasHalal: true,
          popularItems: ["Barbacoa Chicken Taco", "Vegan Black Bean Bowl", "Agua Fresca"]
        }
      },
      {
        id: "nj-restroom-north",
        name: "Restroom Suite Section 112 (North)",
        category: FacilityCategory.RESTROOM,
        description: "Large capacity multi-stall restrooms, includes ADA units & baby changing.",
        latitude: 35,
        longitude: 25,
        capacity: 60,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 23:00",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 2
      },
      {
        id: "nj-restroom-south",
        name: "Restroom Suite Section 134 (South)",
        category: FacilityCategory.RESTROOM,
        description: "Highly central facilities next to Gate C corridor.",
        latitude: 65,
        longitude: 75,
        capacity: 65,
        status: FacilityStatus.CONGESTED,
        openingHours: "15:00 - 23:00",
        queueLength: QueueLength.LONG,
        waitTimeMinutes: 12
      },
      {
        id: "nj-medical-1",
        name: "First Aid Clinic (Concourse Level 1)",
        category: FacilityCategory.MEDICAL_CENTER,
        description: "Full service emergency medical shelter staffed by EMTs and nurses.",
        latitude: 30,
        longitude: 50,
        capacity: 25,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "14:00 - 23:30",
        queueLength: QueueLength.NONE,
        waitTimeMinutes: 0
      },
      {
        id: "nj-merchandise",
        name: "FIFA Official Fan Shop NYNJ",
        category: FacilityCategory.MERCHANDISE_STORE,
        description: "Official Match Day scarves, jerseys, caps, and footballs.",
        latitude: 50,
        longitude: 20,
        capacity: 350,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 22:30",
        queueLength: QueueLength.MEDIUM,
        waitTimeMinutes: 10
      },
      {
        id: "nj-info",
        name: "Spectator Information Hub B",
        category: FacilityCategory.INFORMATION_DESK,
        description: "Visitor questions, stadium maps, mobile charger rentals, lost kids assistance.",
        latitude: 45,
        longitude: 45,
        capacity: 50,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 23:00",
        queueLength: QueueLength.NONE,
        waitTimeMinutes: 0
      },
      {
        id: "nj-exit-emergency",
        name: "Emergency Exit Corridor 3 (North-East)",
        category: FacilityCategory.EMERGENCY_EXIT,
        description: "Pre-secured wide exit avenue, strictly closed during active match play.",
        latitude: 85,
        longitude: 30,
        capacity: 5000,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "Emergency Only",
        queueLength: QueueLength.NONE,
        waitTimeMinutes: 0
      }
    ],
    incidents: [
      {
        id: "inc-nj-101",
        title: "Beverage Spill Near Restroom Section 134",
        category: "Maintenance",
        description: "Massive soda spill causing slick surfaces. Needs immediate mop clean-up to prevent slips.",
        facilityId: "nj-restroom-south",
        section: "Concourse 134",
        severity: IncidentSeverity.MINOR,
        status: IncidentStatus.ACTIVE,
        reporterName: "Vol. Jacob Miller",
        reportedAt: `${currentYear}-07-12T11:15:00Z`
      },
      {
        id: "inc-nj-102",
        title: "Dehydration case at Section 104",
        category: "Medical",
        description: "Fan experiencing dizziness and mild heat exhaustion in the open sun. Requested wheelchair transport to Clinic 1.",
        facilityId: "nj-medical-1",
        section: "Seating Sec 104",
        severity: IncidentSeverity.MAJOR,
        status: IncidentStatus.RESPONDING,
        reporterName: "Staff Sarah Jenkins",
        reportedAt: `${currentYear}-07-12T11:20:00Z`,
        assignedStaffId: "nj-medic-team-1"
      }
    ],
    tasks: [
      {
        id: "task-nj-201",
        title: "Clean beverage spill at Section 134 Restroom",
        description: "Dispatch cleaning personnel with wet-floor signboards and disinfectant.",
        assignedRole: UserRole.STADIUM_STAFF,
        stadiumId: "stadium-metlife",
        facilityId: "nj-restroom-south",
        status: "IN_PROGRESS",
        createdAt: `${currentYear}-07-12T11:16:00Z`
      },
      {
        id: "task-nj-202",
        title: "Redistribute crowd flow at Verizon Gate B",
        description: "Instruct volunteers to redirect incoming fans from congested Gate B to Gate A (shortest wait).",
        assignedRole: UserRole.VOLUNTEER,
        stadiumId: "stadium-metlife",
        facilityId: "nj-gate-b",
        status: "PENDING",
        createdAt: `${currentYear}-07-12T11:22:00Z`
      }
    ]
  },
  {
    id: "stadium-azteca",
    name: "Estadio Azteca",
    country: "Mexico",
    city: "Mexico City",
    address: "Calz. de Tlalpan 3465, Santa Úrsula Coapa, Coyoacán, 04650 Ciudad de México",
    latitude: 19.3029,
    longitude: -99.1505,
    capacity: 87523,
    eventName: "FIFA World Cup - Tournament Opening Match",
    crowdDensity: CrowdDensity.HIGH,
    parkingOccupancy: 88,
    weatherAlert: "None",
    trafficStatus: "Heavy Delays",
    emergencyAlert: "",
    matchSchedule: [
      {
        id: "m-az-1",
        matchNumber: 1,
        stage: "Tournament Opening Match",
        teamA: "Mexico",
        teamB: "Croatia",
        date: `${currentYear}-06-11`,
        time: "18:00",
        status: "COMPLETED",
        score: "2-0",
        attendance: 87211
      },
      {
        id: "m-az-2",
        matchNumber: 24,
        stage: "Group Stage",
        teamA: "Mexico",
        teamB: "Japan",
        date: `${currentYear}-06-18`,
        time: "20:00",
        status: "SCHEDULED"
      },
      {
        id: "m-az-3",
        matchNumber: 72,
        stage: "Round of 16",
        teamA: "Winner Group A",
        teamB: "Runner-up Group C",
        date: `${currentYear}-06-30`,
        time: "17:00",
        status: "SCHEDULED"
      }
    ],
    facilities: [
      {
        id: "az-gate-1",
        name: "Acceso Norte 1",
        category: FacilityCategory.ENTRY_GATE,
        description: "Main north entryway bordering the metro station.",
        latitude: 50,
        longitude: 10,
        capacity: 25000,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "14:00 - 22:00",
        queueLength: QueueLength.MEDIUM,
        waitTimeMinutes: 18
      },
      {
        id: "az-gate-2",
        name: "Acceso Sur 2",
        category: FacilityCategory.ENTRY_GATE,
        description: "Southern pedestrian entry connecting with peripheral avenues.",
        latitude: 50,
        longitude: 90,
        capacity: 25000,
        status: FacilityStatus.CONGESTED,
        openingHours: "14:00 - 22:00",
        queueLength: QueueLength.CRITICAL,
        waitTimeMinutes: 35
      },
      {
        id: "az-food-1",
        name: "Cantina del Sol",
        category: FacilityCategory.FOOD_COURT,
        description: "Tacos al pastor, quesadillas, nachos, and fresh horchata.",
        latitude: 40,
        longitude: 40,
        capacity: 300,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "14:00 - 21:30",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 4,
        foodDetails: {
          hasVegetarian: true,
          hasHalal: false,
          popularItems: ["Tacos al Pastor Trio", "Quesadilla Especial", "Horchata Grande"]
        }
      },
      {
        id: "az-medical",
        name: "Centro Médico de Emergencias Azteca",
        category: FacilityCategory.MEDICAL_CENTER,
        description: "Fully equipped surgical and first-aid response facility under Tunnel 8.",
        latitude: 50,
        longitude: 50,
        capacity: 40,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "13:00 - 23:00",
        queueLength: QueueLength.NONE,
        waitTimeMinutes: 0
      },
      {
        id: "az-restroom-1",
        name: "Sanitarios Sección Preferente 2",
        category: FacilityCategory.RESTROOM,
        description: "Upgraded modern high-flow restrooms.",
        latitude: 30,
        longitude: 70,
        capacity: 50,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "14:00 - 22:00",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 3
      }
    ],
    incidents: [],
    tasks: []
  },
  {
    id: "stadium-sofi",
    name: "SoFi Stadium",
    country: "United States",
    city: "Inglewood, CA / Los Angeles",
    address: "1001 Stadium Dr, Inglewood, CA 90301",
    latitude: 33.9534,
    longitude: -118.339,
    capacity: 70240,
    eventName: "FIFA World Cup - Matchday 3",
    crowdDensity: CrowdDensity.LOW,
    parkingOccupancy: 30,
    weatherAlert: "None",
    trafficStatus: "Smooth Flow",
    emergencyAlert: "",
    matchSchedule: [
      {
        id: "m-la-1",
        matchNumber: 3,
        stage: "USA Opening Match",
        teamA: "USA",
        teamB: "Canada",
        date: `${currentYear}-06-12`,
        time: "17:00",
        status: "COMPLETED",
        score: "3-2",
        attendance: 69850
      },
      {
        id: "m-la-2",
        matchNumber: 31,
        stage: "Group Stage",
        teamA: "Brazil",
        teamB: "South Korea",
        date: `${currentYear}-06-19`,
        time: "19:00",
        status: "SCHEDULED"
      }
    ],
    facilities: [
      {
        id: "la-entry-1",
        name: "American Airlines Plaza Entrance 1",
        category: FacilityCategory.ENTRY_GATE,
        description: "Open-concept architectural canopy entrance with fast-track biometric scan.",
        latitude: 30,
        longitude: 30,
        capacity: 22000,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 22:00",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 2
      },
      {
        id: "la-food-vip",
        name: "Canyon Club Gourmet Market",
        category: FacilityCategory.VIP_LOUNGE,
        description: "Premium culinary options for suiteholders and club access tickets.",
        latitude: 50,
        longitude: 45,
        capacity: 400,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "15:00 - 22:00",
        queueLength: QueueLength.SHORT,
        waitTimeMinutes: 4,
        foodDetails: {
          hasVegetarian: true,
          hasHalal: true,
          popularItems: ["Smoked Wagyu Sliders", "Truffle Flatbread", "Organic Salad Cup"]
        }
      }
    ],
    incidents: [],
    tasks: []
  }
];

// Helper to find and update stadium
function getStadium(id: string): Stadium | undefined {
  return stadiums.find(s => s.id === id);
}

// REST API Endpoints

// 1. Get all stadiums
app.get("/api/stadiums", (req, res) => {
  res.json(stadiums);
});

// 2. Create dynamic stadium
app.post("/api/stadiums", (req, res) => {
  let { name, country, city, address, latitude, longitude, capacity, eventName } = req.body;
  if (!name || !country || !city || !capacity) {
    res.status(400).json({ error: "Missing required fields: name, country, city, capacity" });
    return;
  }

  // Security input sanitization & maximum length enforcement
  name = sanitizeString(name, 80);
  country = sanitizeString(country, 50);
  city = sanitizeString(city, 50);
  address = sanitizeString(address, 200);
  eventName = sanitizeString(eventName, 100);

  const numCapacity = Number(capacity);
  if (isNaN(numCapacity) || numCapacity < 1000 || numCapacity > 200000) {
    res.status(400).json({ error: "Sane capacity bounds: must be a number between 1,000 and 200,000 seats." });
    return;
  }

  const numLat = Number(latitude);
  const numLng = Number(longitude);
  if (isNaN(numLat) || numLat < -90 || numLat > 90 || isNaN(numLng) || numLng < -180 || numLng > 180) {
    res.status(400).json({ error: "Latitude or Longitude is out of standard physical bounds." });
    return;
  }

  const newStadium: Stadium = {
    id: `stadium-${Date.now()}`,
    name,
    country,
    city,
    address: address || "",
    latitude: numLat || 0,
    longitude: numLng || 0,
    capacity: numCapacity,
    eventName: eventName || "FIFA World Cup Matchday",
    crowdDensity: CrowdDensity.LOW,
    parkingOccupancy: 0,
    weatherAlert: "None",
    trafficStatus: "Smooth Flow",
    emergencyAlert: "",
    matchSchedule: [],
    facilities: [
      {
        id: `fac-gate-a-${Date.now()}`,
        name: "Gate A (Main Entrance)",
        category: FacilityCategory.ENTRY_GATE,
        description: "Primary access portal.",
        latitude: 20,
        longitude: 20,
        capacity: Math.floor(capacity / 4),
        status: FacilityStatus.OPERATIONAL,
        openingHours: "16:00 - 23:00",
        queueLength: QueueLength.NONE,
        waitTimeMinutes: 0
      },
      {
        id: `fac-restroom-${Date.now()}`,
        name: "Restroom Zone 1",
        category: FacilityCategory.RESTROOM,
        description: "Central concourse restroom.",
        latitude: 50,
        longitude: 50,
        capacity: 50,
        status: FacilityStatus.OPERATIONAL,
        openingHours: "16:00 - 23:00",
        queueLength: QueueLength.NONE,
        waitTimeMinutes: 0
      }
    ],
    incidents: [],
    tasks: []
  };

  stadiums.push(newStadium);
  res.status(201).json(newStadium);
});

// 3. Update full stadium operational parameters
app.put("/api/stadiums/:id", (req, res) => {
  const { id } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  const { crowdDensity, parkingOccupancy, weatherAlert, trafficStatus, emergencyAlert, eventName } = req.body;

  if (crowdDensity !== undefined) stadium.crowdDensity = crowdDensity;
  if (parkingOccupancy !== undefined) {
    const numPark = Number(parkingOccupancy);
    if (isNaN(numPark) || numPark < 0 || numPark > 100) {
      res.status(400).json({ error: "Parking occupancy must be between 0% and 100%." });
      return;
    }
    stadium.parkingOccupancy = numPark;
  }
  if (weatherAlert !== undefined) stadium.weatherAlert = sanitizeString(weatherAlert, 150);
  if (trafficStatus !== undefined) stadium.trafficStatus = sanitizeString(trafficStatus, 100);
  if (emergencyAlert !== undefined) stadium.emergencyAlert = sanitizeString(emergencyAlert, 150);
  if (eventName !== undefined) stadium.eventName = sanitizeString(eventName, 100);

  res.json(stadium);
});

// 4. Add facility to stadium
app.post("/api/stadiums/:id/facilities", (req, res) => {
  const { id } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  const { name, category, description, latitude, longitude, capacity, openingHours, foodDetails } = req.body;
  if (!name || !category || !openingHours) {
    res.status(400).json({ error: "Missing required fields: name, category, openingHours" });
    return;
  }

  const newFacility: Facility = {
    id: `fac-${Date.now()}`,
    name,
    category,
    description: description || "",
    latitude: Number(latitude) || 50,
    longitude: Number(longitude) || 50,
    capacity: Number(capacity) || 100,
    status: FacilityStatus.OPERATIONAL,
    openingHours,
    queueLength: QueueLength.NONE,
    waitTimeMinutes: 0,
    foodDetails: foodDetails || undefined
  };

  stadium.facilities.push(newFacility);
  res.status(201).json(newFacility);
});

// 5. Update/patch facility (e.g. adjust wait times/queues)
app.put("/api/stadiums/:id/facilities/:facId", (req, res) => {
  const { id, facId } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  const facility = stadium.facilities.find(f => f.id === facId);
  if (!facility) {
    res.status(404).json({ error: "Facility not found" });
    return;
  }

  const { status, queueLength, waitTimeMinutes } = req.body;

  if (status !== undefined) facility.status = status;
  if (queueLength !== undefined) facility.queueLength = queueLength;
  if (waitTimeMinutes !== undefined) facility.waitTimeMinutes = Number(waitTimeMinutes);

  res.json(facility);
});

// 6. Report/post active incident
app.post("/api/stadiums/:id/incidents", (req, res) => {
  const { id } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  let { title, category, description, facilityId, section, severity, reporterName } = req.body;
  if (!title || !category || !description || !severity) {
    res.status(400).json({ error: "Missing required incident details: title, category, description, severity" });
    return;
  }

  // Sanitize fields to protect against XSS injection
  title = sanitizeString(title, 100);
  category = sanitizeString(category, 50);
  description = sanitizeString(description, 1000);
  section = sanitizeString(section, 50);
  reporterName = sanitizeString(reporterName, 100);

  const newIncident: Incident = {
    id: `inc-${Date.now()}`,
    title,
    category,
    description,
    facilityId: facilityId || "",
    section: section || "",
    severity,
    status: IncidentStatus.ACTIVE,
    reporterName: reporterName || "System Sensor",
    reportedAt: new Date().toISOString()
  };

  stadium.incidents.unshift(newIncident);

  // Automatically spin up a staff task for resolving the incident
  const newTask: StaffTask = {
    id: `task-${Date.now()}`,
    title: `Address Incident: ${title}`,
    description: `Investigate and resolve: ${description}. Location: ${section || 'N/A'}. Severity: ${severity}.`,
    assignedRole: category === "Medical" ? UserRole.STADIUM_STAFF : UserRole.STADIUM_STAFF,
    stadiumId: id,
    facilityId: facilityId || undefined,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };
  stadium.tasks.unshift(newTask);

  res.status(201).json({ incident: newIncident, task: newTask });
});

// 7. Update incident status / resolution notes
app.put("/api/stadiums/:id/incidents/:incId", (req, res) => {
  const { id, incId } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  const incident = stadium.incidents.find(i => i.id === incId);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  const { status, assignedStaffId, resolutionNotes } = req.body;

  if (status !== undefined) incident.status = status;
  if (assignedStaffId !== undefined) incident.assignedStaffId = assignedStaffId;
  if (resolutionNotes !== undefined) incident.resolutionNotes = resolutionNotes;

  // Sync related tasks
  const relatedTask = stadium.tasks.find(t => t.title.includes(incident.title));
  if (relatedTask) {
    if (status === IncidentStatus.RESOLVED) {
      relatedTask.status = "COMPLETED";
    } else if (status === IncidentStatus.RESPONDING) {
      relatedTask.status = "IN_PROGRESS";
    }
  }

  res.json(incident);
});

// 8. Manage staff tasks
app.post("/api/stadiums/:id/tasks", (req, res) => {
  const { id } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  let { title, description, assignedRole, facilityId } = req.body;
  if (!title || !description) {
    res.status(400).json({ error: "Missing required fields: title, description" });
    return;
  }

  title = sanitizeString(title, 100);
  description = sanitizeString(description, 1000);

  const newTask: StaffTask = {
    id: `task-${Date.now()}`,
    title,
    description,
    assignedRole: assignedRole || UserRole.VOLUNTEER,
    stadiumId: id,
    facilityId,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  stadium.tasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.put("/api/stadiums/:id/tasks/:taskId", (req, res) => {
  const { id, taskId } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  const task = stadium.tasks.find(t => t.id === taskId);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const { status, assignedUserId } = req.body;
  if (status !== undefined) task.status = status;
  if (assignedUserId !== undefined) task.assignedUserId = assignedUserId;

  res.json(task);
});

// 9. Simulation Predictive Analytics Engine (Generates dynamic forecasts based on match-time state)
app.get("/api/stadiums/:id/predictive", (req, res) => {
  const { id } = req.params;
  const stadium = getStadium(id);
  if (!stadium) {
    res.status(404).json({ error: "Stadium not found" });
    return;
  }

  // Live simulation parameters based on selected stadium
  const isCongested = stadium.crowdDensity === CrowdDensity.HIGH || stadium.crowdDensity === CrowdDensity.EXTREME;
  const baseScale = isCongested ? 1.4 : 0.9;

  const hours = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
  const crowdInflowCurve = [1500, 4800, 9500, 18000, 24000, 11000, 2000, 3500, 14000, 18000];
  const waitTimesCurve = [5, 12, 18, 32, 45, 15, 4, 8, 25, 38];
  
  const hourlyForecast = hours.map((hour, idx) => {
    const crowdInflow = Math.round(crowdInflowCurve[idx] * baseScale);
    const queueWaitTimeGates = Math.round(waitTimesCurve[idx] * baseScale);
    
    // Parking fills up fast before the game (17:00-19:00), peaks, and drains after 21:00
    let parkingOccupancy = Math.min(100, Math.round((idx < 5 ? 30 + idx * 14 : 95 - (idx - 5) * 8) * baseScale));
    if (stadium.id === "stadium-sofi") parkingOccupancy = Math.round(parkingOccupancy * 0.4);

    // Food demand spikes pre-match and half-time (idx 4 and 5 e.g. 18:00 - 19:00)
    const isSpikeHour = hour === "18:00" || hour === "19:00" || hour === "21:00";
    const foodDemandLevel = Math.min(100, Math.round((isSpikeHour ? 85 : 35 + (idx % 3) * 12) * baseScale));
    const restroomDemandLevel = Math.min(100, Math.round((isSpikeHour ? 90 : 25 + (idx % 2) * 15) * baseScale));

    return {
      hour,
      crowdInflow,
      queueWaitTimeGates,
      parkingOccupancy,
      foodDemandLevel,
      restroomDemandLevel
    };
  });

  const riskFactors = [
    {
      category: "Crowd Congestion (Main gates)",
      riskScore: isCongested ? 85 : 35,
      reason: isCongested ? "Heavy bunching of spectators detected at Verizon Gate B due to train arrivals." : "Pedestrian flows remain within normal safe buffers."
    },
    {
      category: "Restroom Availability",
      riskScore: isCongested ? 70 : 25,
      reason: isCongested ? "Extended lines reported at level 1 food concourse facilities during halftime." : "Wait times are consistently under 3 minutes."
    },
    {
      category: "Emergency Evacuation Route Clearance",
      riskScore: 12,
      reason: "All secondary avenues and emergency fire exits are reported clear and fully unlocked."
    },
    {
      category: "Traffic Delays (Avenue approach)",
      riskScore: stadium.id === "stadium-azteca" ? 92 : (stadium.id === "stadium-metlife" ? 64 : 15),
      reason: stadium.id === "stadium-azteca" ? "Extreme highway bottlenecks on Calzada de Tlalpan; match transit recommended." : "Average delays around outer parking lots."
    }
  ];

  res.json({ hourlyForecast, riskFactors });
});


// 10. StadiumGPT Generative RAG Assistant API
app.post("/api/gemini/chat", async (req, res) => {
  const { message, stadiumId, history, language } = req.body;
  if (!message || !stadiumId) {
    res.status(400).json({ error: "Missing message or stadiumId" });
    return;
  }

  const stadium = getStadium(stadiumId);
  if (!stadium) {
    res.status(404).json({ error: "Stadium context not found" });
    return;
  }

  // Construct a solid, highly-contextualized RAG knowledge base for the stadium state
  const liveMatch = stadium.matchSchedule.find(m => m.status === "LIVE") || stadium.matchSchedule[0];
  const facilitiesContext = stadium.facilities.map(f => (
    `- ${f.name} [Category: ${f.category}]: Currently ${f.status}. Queue Level: ${f.queueLength}, Wait Time: ${f.waitTimeMinutes} mins. Opening: ${f.openingHours}. Details: ${f.description} ${f.foodDetails ? `Serves Vegetarian: ${f.foodDetails.hasVegetarian}, Serves Halal: ${f.foodDetails.hasHalal}. Hot items: ${f.foodDetails.popularItems.join(', ')}` : ''}`
  )).join("\n");

  const incidentsContext = stadium.incidents.length > 0 
    ? stadium.incidents.map(i => `- ${i.title} (${i.category}): Severity: ${i.severity}, Status: ${i.status}, Located near ${i.section || 'facility'}. Details: ${i.description}`).join("\n")
    : "No active critical safety incidents or hazards reported.";

  let systemInstruction = `You are StadiumGPT, the official Generative AI operational assistant and digital host for FIFA World Cup match events.
You are running contextualized, real-time assistance specifically for ${stadium.name} in ${stadium.city}, ${stadium.country}.
Answer as a highly professional, polite, and helpful assistant. Deliver crisp, structured, markdown responses. Always direct fans to the facilities with shorter lines or recommended paths.

CURRENT REAL-TIME STADIUM STATE FOR ${stadium.name.toUpperCase()}:
- Current Event/Matchday: ${stadium.eventName}
- Major Active Match: ${liveMatch ? `${liveMatch.teamA} vs ${liveMatch.teamB} (${liveMatch.stage}, Status: ${liveMatch.status}, Score: ${liveMatch.score || 'N/A'})` : 'No matches live currently'}
- Live General Crowd Density: ${stadium.crowdDensity}
- Live Parking Lot Occupancy: ${stadium.parkingOccupancy}%
- Active Meteorological Weather Warning: ${stadium.weatherAlert || 'None'}
- Outer Road Traffic Conditions: ${stadium.trafficStatus}
- Emergency Broadcast Announcement: ${stadium.emergencyAlert || 'None active'}

AVAILABLE FACILITIES & STATUSES:
${facilitiesContext}

ACTIVE INCIDENTS/HAZARDS:
${incidentsContext}

RESPONSIVE INSTRUCTIONS:
1. When asked about gates, restrooms, or foods, look at the status and waitTimes list. Proactively recommend the ones with Queue Length "SHORT" or "NONE", and warn them about "CRITICAL" or "LONG" queues.
2. If the user mentions a safety hazard or medical situation, immediately tell them where the nearest First Aid Clinic is (e.g. Clinic Level 1 or tunnel), and prompt them to tap 'Report Incident' or seek stadium staff.
3. Keep answers friendly, crisp, actionable, and formatted beautifully in Markdown lists or small tables. Support multilingual responses naturally if the user asks in Spanish, French, Italian, etc.
4. Keep the output extremely focused on the stadium data. Do not make up fake gates or facilities that do not exist in the context above.`;

  const targetLang = (language || "en").toLowerCase();
  
  if (targetLang !== "en") {
    systemInstruction += `\n\nCRITICAL MANDATE: The operator/user has selected the language: "${language}" (code: "${targetLang}").
You MUST translate all output dynamically and write your entire response strictly in "${language}".
Do not use English words for descriptions, instructions, or recommendations, except for official proper names of teams or stadiums if required. Ensure dates, wait times, labels, titles, and headers are fully translated into "${language}".`;
  }

  if (!ai) {
    // Fallback smart rule-based chatbot when Gemini API key is missing
    res.json({ text: getRuleBasedChatReply(message, stadium, targetLang) });
    return;
  }

  try {
    // Call server-side Gemini API generateContent
    const userPrompt = `${message}\n\nPlease analyze and reply clearly using the provided stadium instructions. Include custom suggested follow-up prompts at the end of the text if applicable.`;
    
    // Formatting history correctly for chat endpoint
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: "Initialize system prompt instructions." }] },
        { role: "model", parts: [{ text: "Understood. I am loaded with the StadiumGPT stadium context." }] },
        ...(history || []).map((h: any) => ({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        })),
        { role: "user", parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const aiText = response.text || "Sorry, I could not generate a response. Please check back shortly.";
    res.json({ text: aiText });
  } catch (err: any) {
    console.error("Gemini API Error in server.ts (falling back to rules):", err);
    // Graceful fallback to local rule-based response on any API error/quota limit
    res.json({ text: getRuleBasedChatReply(message, stadium, targetLang) });
  }
});


// Helper function for local chatbot fallback responses
function getRuleBasedChatReply(message: string, stadium: Stadium, targetLang: string): string {
  const msgLower = message.toLowerCase();
  let reply = "";

  if (msgLower.includes("gate") || msgLower.includes("entrance") || msgLower.includes("puerta") || msgLower.includes("entrée") || msgLower.includes("eingang") || msgLower.includes("بوابة") || msgLower.includes("portão")) {
    const bestGate = stadium.facilities
      .filter(f => f.category === FacilityCategory.ENTRY_GATE)
      .sort((a, b) => a.waitTimeMinutes - b.waitTimeMinutes)[0];
    const congestedGates = stadium.facilities
      .filter(f => f.category === FacilityCategory.ENTRY_GATE && f.status === FacilityStatus.CONGESTED);

    if (targetLang === "es") {
      reply = `### Bienvenido a la Guía de Puertas de Entrada de ${stadium.name}\n\n`;
      if (bestGate) {
        reply += `👉 **Recomendación:** Dirígete a **${bestGate.name}**, que tiene una fila corta. El tiempo de espera actual es de solo **${bestGate.waitTimeMinutes} minutos**.\n\n`;
      }
      if (congestedGates.length > 0) {
        reply += `⚠️ **Advertencia:** Evita **${congestedGates.map(g => g.name).join(", ")}** debido a la congestión peatonal extrema (tiempo de espera de **${congestedGates[0].waitTimeMinutes} minutos**).\n`;
      }
    } else if (targetLang === "fr") {
      reply = `### Bienvenue sur le Guide des Portes d'Entrée de ${stadium.name}\n\n`;
      if (bestGate) {
        reply += `👉 **Recommandation:** Dirigez-vous vers **${bestGate.name}**, qui a une file d'attente courte. Le temps d'attente actuel est de seulement **${bestGate.waitTimeMinutes} minutes**.\n\n`;
      }
      if (congestedGates.length > 0) {
        reply += `⚠️ **Avertissement de congestion:** Évitez **${congestedGates.map(g => g.name).join(", ")}** en raison d'une congestion piétonne extrême (temps d'attente de **${congestedGates[0].waitTimeMinutes} minutes**).\n`;
      }
    } else if (targetLang === "de") {
      reply = `### Willkommen beim Eingangstor-Führer für ${stadium.name}\n\n`;
      if (bestGate) {
        reply += `👉 **Empfehlung:** Gehen Sie zu **${bestGate.name}** mit kurzer Schlange. Die aktuelle Wartezeit beträgt nur **${bestGate.waitTimeMinutes} Minuten**.\n\n`;
      }
      if (congestedGates.length > 0) {
        reply += `⚠️ **Stauwarnung:** Vermeiden Sie **${congestedGates.map(g => g.name).join(", ")}** wegen extremer Überlastung (Wartezeit **${congestedGates[0].waitTimeMinutes} Min**).\n`;
      }
    } else if (targetLang === "ar") {
      reply = `### مرحبًا بك في دليل بوابات الدخول لـ ${stadium.name}\n\n`;
      if (bestGate) {
        reply += `👉 **توصية:** توجه إلى **${bestGate.name}** التي بها طابور قصير. وقت الانتظار الحالي هو **${bestGate.waitTimeMinutes} دقائق** فقط.\n\n`;
      }
      if (congestedGates.length > 0) {
        reply += `⚠️ **تحذير من الازدحام:** تجنب **${congestedGates.map(g => g.name).join(", ")}** بسبب الازدحام الشديد للمشاة (وقت الانتظار **${congestedGates[0].waitTimeMinutes} دقائق**).\n`;
      }
    } else if (targetLang === "pt") {
      reply = `### Bem-vindo ao Guia de Portões de Entrada de ${stadium.name}\n\n`;
      if (bestGate) {
        reply += `👉 **Recomendação:** Vá para o **${bestGate.name}**, que tem fila curta. O tempo de espera atual é de apenas **${bestGate.waitTimeMinutes} minutos**.\n\n`;
      }
      if (congestedGates.length > 0) {
        reply += `⚠️ **Aviso de Congestionamento:** Evite **${congestedGates.map(g => g.name).join(", ")}** devido ao congestionamento extremo de pedestres (tempo de espera de **${congestedGates[0].waitTimeMinutes} minutos**).\n`;
      }
    } else {
      reply = `### Welcome to ${stadium.name} Entry Gates Guide\n\n`;
      if (bestGate) {
        reply += `👉 **Recommendation:** Head to **${bestGate.name}** which has a short queue. Current wait time is only **${bestGate.waitTimeMinutes} minutes**.\n\n`;
      }
      if (congestedGates.length > 0) {
        reply += `⚠️ **Warning:** Avoid **${congestedGates.map(g => g.name).join(", ")}** due to extreme pedestrian congestion (**${congestedGates[0].waitTimeMinutes} mins** wait time).\n`;
      }
    }
  } else if (msgLower.includes("restroom") || msgLower.includes("toilet") || msgLower.includes("bathroom") || msgLower.includes("baño") || msgLower.includes("sanitaire") || msgLower.includes("toilette") || msgLower.includes("arwc") || msgLower.includes("wc") || msgLower.includes("banheiro") || msgLower.includes("مرحاض")) {
    const openRestroom = stadium.facilities
      .filter(f => f.category === FacilityCategory.RESTROOM)
      .sort((a, b) => a.waitTimeMinutes - b.waitTimeMinutes)[0];
    
    if (targetLang === "es") {
      reply = `### Información de Baños\n\n`;
      if (openRestroom) {
        reply += `🚽 El baño óptimo más cercano es **${openRestroom.name}** con una corta espera de **${openRestroom.waitTimeMinutes} minutos**.\n`;
      } else {
        reply += `Todos los baños están reportados abiertos. Por favor revisa el mapa interactivo.`;
      }
    } else if (targetLang === "fr") {
      reply = `### Guide des Toilettes\n\n`;
      if (openRestroom) {
        reply += `🚽 Les toilettes optimales les plus proches sont **${openRestroom.name}** avec une attente de seulement **${openRestroom.waitTimeMinutes} minutes**.\n`;
      } else {
        reply += `Tous les sanitaires sont signalés ouverts. Veuillez vérifier la carte interactive.`;
      }
    } else if (targetLang === "de") {
      reply = `### Toiletten-Informationen\n\n`;
      if (openRestroom) {
        reply += `🚽 Die nächste optimale Toilette ist **${openRestroom.name}** mit einer kurzen Wartezeit von **${openRestroom.waitTimeMinutes} Minuten**.\n`;
      } else {
        reply += `Alle Toiletten sind geöffnet. Bitte prüfen Sie den interaktiven Plan.`;
      }
    } else if (targetLang === "ar") {
      reply = `### معلومات المراحيض\n\n`;
      if (openRestroom) {
        reply += `🚽 أقرب دورة مياه مثالية هي **${openRestroom.name}** مع وقت انتظار قصير يبلغ **${openRestroom.waitTimeMinutes} دقائق**.\n`;
      } else {
        reply += `جميع المراحيض مفتوحة حاليًا. يرجى مراجعة الخريطة التفاعلية.`;
      }
    } else if (targetLang === "pt") {
      reply = `### Informações sobre Banheiros\n\n`;
      if (openRestroom) {
        reply += `🚽 O banheiro ideal mais próximo é o **${openRestroom.name}** com uma espera curta de **${openRestroom.waitTimeMinutes} minutos**.\n`;
      } else {
        reply += `Todos os banheiros estão abertos. Por favor, verifique o mapa interativo.`;
      }
    } else {
      reply = `### Restroom Facilities Info\n\n`;
      if (openRestroom) {
        reply += `🚽 The nearest optimal restroom is **${openRestroom.name}** with a short wait of **${openRestroom.waitTimeMinutes} minutes**.\n`;
      } else {
        reply += `All facilities are currently reported open. Please check the interactive map overlay for section indicators.`;
      }
    }
  } else if (msgLower.includes("food") || msgLower.includes("vegetarian") || msgLower.includes("halal") || msgLower.includes("eat") || msgLower.includes("comida") || msgLower.includes("nourriture") || msgLower.includes("essen") || msgLower.includes("طعام") || msgLower.includes("comer")) {
    const foodSpots = stadium.facilities.filter(f => f.category === FacilityCategory.FOOD_COURT || f.category === FacilityCategory.RESTAURANT || f.category === FacilityCategory.VIP_LOUNGE);
    
    if (targetLang === "es") {
      reply = `### Guía de Comida y Bebida\n\nAquí tienes las concesiones activas cerca de ti:\n\n`;
      foodSpots.forEach(f => {
        reply += `🍔 **${f.name}** (Espera: ${f.waitTimeMinutes}m)\n`;
        reply += `   - *Descripción:* ${f.description}\n`;
        if (f.foodDetails) {
          reply += `   - *Opciones dietéticas:* ${f.foodDetails.hasVegetarian ? '✅ Vegetariano' : '❌ No Veg'} | ${f.foodDetails.hasHalal ? '✅ Halal' : '❌ No Halal'}\n`;
          reply += `   - *Populares:* ${f.foodDetails.popularItems.join(", ")}\n`;
        }
        reply += `\n`;
      });
    } else if (targetLang === "fr") {
      reply = `### Guide Restauration & Boissons\n\nVoici les concessions actives près de vous:\n\n`;
      foodSpots.forEach(f => {
        reply += `🍔 **${f.name}** (Attente: ${f.waitTimeMinutes}m)\n`;
        reply += `   - *Vibe:* ${f.description}\n`;
        if (f.foodDetails) {
          reply += `   - *Options diététiques:* ${f.foodDetails.hasVegetarian ? '✅ Végétarien' : '❌ Non Veg'} | ${f.foodDetails.hasHalal ? '✅ Halal' : '❌ Non Halal'}\n`;
          reply += `   - *Populaire:* ${f.foodDetails.popularItems.join(", ")}\n`;
        }
        reply += `\n`;
      });
    } else if (targetLang === "de") {
      reply = `### Essen- & Getränkeführer\n\nHier sind die aktiven Verkaufsstände in Ihrer Nähe:\n\n`;
      foodSpots.forEach(f => {
        reply += `🍔 **${f.name}** (Wartezeit: ${f.waitTimeMinutes} Min)\n`;
        reply += `   - *Beschreibung:* ${f.description}\n`;
        if (f.foodDetails) {
          reply += `   - *Ernährung:* ${f.foodDetails.hasVegetarian ? '✅ Vegetarisch' : '❌ Nicht Veg'} | ${f.foodDetails.hasHalal ? '✅ Halal' : '❌ Nicht Halal'}\n`;
          reply += `   - *Beliebt:* ${f.foodDetails.popularItems.join(", ")}\n`;
        }
        reply += `\n`;
      });
    } else if (targetLang === "ar") {
      reply = `### دليل المأكولات والمشروبات\n\nإليك كشك الخدمات النشط بالقرب منك:\n\n`;
      foodSpots.forEach(f => {
        reply += `🍔 **${f.name}** (الانتظار: ${f.waitTimeMinutes} دقيقة)\n`;
        reply += `   - *الوصف:* ${f.description}\n`;
        if (f.foodDetails) {
          reply += `   - *خيارات غذائية:* ${f.foodDetails.hasVegetarian ? '✅ نباتي' : '❌ غير نباتي'} | ${f.foodDetails.hasHalal ? '✅ حلال' : '❌ غير حلال'}\n`;
          reply += `   - *الأكثر مبيعاً:* ${f.foodDetails.popularItems.join(", ")}\n`;
        }
        reply += `\n`;
      });
    } else if (targetLang === "pt") {
      reply = `### Guia de Alimentação\n\nAqui estão as concessões ativas perto de você:\n\n`;
      foodSpots.forEach(f => {
        reply += `🍔 **${f.name}** (Espera: ${f.waitTimeMinutes}m)\n`;
        reply += `   - *Descrição:* ${f.description}\n`;
        if (f.foodDetails) {
          reply += `   - *Opções dietéticas:* ${f.foodDetails.hasVegetarian ? '✅ Vegetariano' : '❌ Não Veg'} | ${f.foodDetails.hasHalal ? '✅ Halal' : '❌ Não Halal'}\n`;
          reply += `   - *Populares:* ${f.foodDetails.popularItems.join(", ")}\n`;
        }
        reply += `\n`;
      });
    } else {
      reply = `### Food & Beverage Guide\n\nHere are the active concessions near you:\n\n`;
      foodSpots.forEach(f => {
        reply += `🍔 **${f.name}** (Wait: ${f.waitTimeMinutes}m)\n`;
        reply += `   - *Vibe:* ${f.description}\n`;
        if (f.foodDetails) {
          reply += `   - *Dietary options:* ${f.foodDetails.hasVegetarian ? '✅ Vegetarian' : '❌ No Veg'} | ${f.foodDetails.hasHalal ? '✅ Halal' : '❌ No Halal'}\n`;
          reply += `   - *Popular:* ${f.foodDetails.popularItems.join(", ")}\n`;
        }
        reply += `\n`;
      });
    }
  } else if (msgLower.includes("medical") || msgLower.includes("emergency") || msgLower.includes("hurt") || msgLower.includes("first aid") || msgLower.includes("médico") || msgLower.includes("médical") || msgLower.includes("krank") || msgLower.includes("arzt") || msgLower.includes("طبيب") || msgLower.includes("إسعاف")) {
    const medical = stadium.facilities.find(f => f.category === FacilityCategory.MEDICAL_CENTER);
    
    if (targetLang === "es") {
      reply = `### 🚨 ASISTENCIA MÉDICA DE EMERGENCIA\n\n`;
      if (medical) {
        reply += `🏥 **Centro de Atención Inmediata:** El oficial **${medical.name}** está operativo en **${medical.description}**.\n\n`;
      }
      reply += `Por favor, localiza al oficial de seguridad o voluntario más cercano. Si estás experimentando una emergencia grave, ¡reporta el incidente de inmediato usando el formulario **Reportar Incidente** en la consola del operador!`;
    } else if (targetLang === "fr") {
      reply = `### 🚨 ASSISTANCE MÉDICALE D'URGENCE\n\n`;
      if (medical) {
        reply += `🏥 **Centre de Soins Immédiats:** Le centre officiel **${medical.name}** est opérationnel à **${medical.description}**.\n\n`;
      }
      reply += `Veuillez localiser l'agent de sécurité ou le bénévole le plus proche. Si vous rencontrez une urgence grave, veuillez signaler cet incident immédiatement via notre formulaire **Signaler un Incident**!`;
    } else if (targetLang === "de") {
      reply = `### 🚨 NOTFALLMEDIZINISCHE HILFE\n\n`;
      if (medical) {
        reply += `🏥 **Soforthilfezentrum:** Das offizielle **${medical.name}** ist in **${medical.description}** einsatzbereit.\n\n`;
      }
      reply += `Bitte wenden Sie sich an die nächste Sicherheitskraft oder einen Helfer. Wenn Sie einen akuten Notfall haben, melden Sie dies bitte sofort über unser Formular **Vorfallsbericht** in der Operator-Suite!`;
    } else if (targetLang === "ar") {
      reply = `### 🚨 مساعدة طبية طارئة\n\n`;
      if (medical) {
        reply += `🏥 **مركز الرعاية الفورية:** المركز الرسمي **${medical.name}** يعمل في **${medical.description}**.\n\n`;
      }
      reply += `يرجى تحديد موقع أقرب ضابط أمن أو متطوع. إذا كنت تواجه حالة طوارئ حادة، فيرجى الإبلاغ عن هذا الحادث باستخدام نموذج **الإبلاغ عن حادث** في جناح المشغل على الفور!`;
    } else if (targetLang === "pt") {
      reply = `### 🚨 ASSISTÊNCIA MÉDICA DE EMERGÊNCIA\n\n`;
      if (medical) {
        reply += `🏥 **Centro de Atendimento Imediato:** O posto oficial **${medical.name}** está operacional em **${medical.description}**.\n\n`;
      }
      reply += `Por favor, localize o oficial de segurança ou voluntário mais próximo. Se estiver enfrentando uma emergência grave, relate o incidente imediatamente usando o nosso formulário **Relatar Incidente** na suíte operacional!`;
    } else {
      reply = `### 🚨 EMERGENCY MEDICAL ASSISTANCE\n\n`;
      if (medical) {
        reply += `🏥 **Immediate Care Center:** The official **${medical.name}** is operational at **${medical.description}**.\n\n`;
      }
      reply += `Please locate the nearest security officer or volunteer helper. If you are experiencing an acute emergency, please report this incident using our **Report Incident** form on the live operator suite immediately!`;
    }
  } else if (msgLower.includes("match") || msgLower.includes("score") || msgLower.includes("play") || msgLower.includes("partido") || msgLower.includes("match") || msgLower.includes("spiel") || msgLower.includes("مباراة") || msgLower.includes("jogo")) {
    if (targetLang === "es") {
      reply = `### Información de la Jornada ⚽\n\n**${stadium.eventName}**\n\n`;
      stadium.matchSchedule.forEach(m => {
        reply += `- **${m.teamA} vs ${m.teamB}** (${m.stage})\n`;
        reply += `  - Estado: \`${m.status}\` ${m.score ? `| Marcador: ${m.score}` : ''}\n`;
        reply += `  - Horario: ${m.date} a las ${m.time}\n\n`;
      });
    } else if (targetLang === "fr") {
      reply = `### Informations Matchday ⚽\n\n**${stadium.eventName}**\n\n`;
      stadium.matchSchedule.forEach(m => {
        reply += `- **${m.teamA} vs ${m.teamB}** (${m.stage})\n`;
        reply += `  - Statut: \`${m.status}\` ${m.score ? `| Score: ${m.score}` : ''}\n`;
        reply += `  - Calendrier: ${m.date} à ${m.time}\n\n`;
      });
    } else if (targetLang === "de") {
      reply = `### Spieltagsinformationen ⚽\n\n**${stadium.eventName}**\n\n`;
      stadium.matchSchedule.forEach(m => {
        reply += `- **${m.teamA} vs ${m.teamB}** (${m.stage})\n`;
        reply += `  - Status: \`${m.status}\` ${m.score ? `| Ergebnis: ${m.score}` : ''}\n`;
        reply += `  - Termine: ${m.date} um ${m.time} Uhr\n\n`;
      });
    } else if (targetLang === "ar") {
      reply = `### معلومات يوم المباراة ⚽\n\n**${stadium.eventName}**\n\n`;
      stadium.matchSchedule.forEach(m => {
        reply += `- **${m.teamA} مقابل ${m.teamB}** (${m.stage})\n`;
        reply += `  - الحالة: \`${m.status}\` ${m.score ? `| النتيجة: ${m.score}` : ''}\n`;
        reply += `  - الجدول: ${m.date} في ${m.time}\n\n`;
      });
    } else if (targetLang === "pt") {
      reply = `### Informações do Matchday ⚽\n\n**${stadium.eventName}**\n\n`;
      stadium.matchSchedule.forEach(m => {
        reply += `- **${m.teamA} vs ${m.teamB}** (${m.stage})\n`;
        reply += `  - Estado: \`${m.status}\` ${m.score ? `| Placar: ${m.score}` : ''}\n`;
        reply += `  - Horário: ${m.date} às ${m.time}\n\n`;
      });
    } else {
      reply = `### Matchday Information ⚽\n\n**${stadium.eventName}**\n\n`;
      stadium.matchSchedule.forEach(m => {
        reply += `- **${m.teamA} vs ${m.teamB}** (${m.stage})\n`;
        reply += `  - Status: \`${m.status}\` ${m.score ? `| Score: ${m.score}` : ''}\n`;
        reply += `  - Schedule: ${m.date} at ${m.time}\n\n`;
      });
    }
  } else {
    if (targetLang === "es") {
      reply = `### Respuesta de StadiumGPT\n\n¡Hola! Soy **StadiumGPT**, tu compañero inteligente para la Copa Mundial de la FIFA. Puedo ayudarte con guías en tiempo real sobre puertas, baños, comida, partidos y seguridad en **${stadium.name}**.\n\n¿En qué puedo ayudarte hoy?\n\n*Intenta preguntar:* "¿Qué puerta tiene menos fila?", "Opciones de comida vegetariana" o "¿Dónde está la enfermería?"`;
    } else if (targetLang === "fr") {
      reply = `### Réponse de StadiumGPT\n\nBonjour ! Je suis **StadiumGPT**, votre compagnon intelligent pour la Coupe du Monde de la FIFA. Je peux vous aider avec des guides en temps réel sur les portes, les toilettes, les points de restauration, les matchs et la sécurité à **${stadium.name}**.\n\nComment puis-je vous aider aujourd'hui ?\n\n*Essayez de demander:* "Quelle porte a le moins d'attente ?", "Montre-moi les stands végétariens" ou "Où est le centre médical ?"`;
    } else if (targetLang === "de") {
      reply = `### StadiumGPT-Antwort\n\nHallo! Ich bin **StadiumGPT**, Ihr intelligenter Begleiter für die FIFA-Weltmeisterschaft. Ich kann Ihnen mit Echtzeit-Führern zu Toren, Toiletten, Imbissen, Spielen und Sicherheitsregeln im **${stadium.name}** helfen.\n\nWie kann ich Ihnen heute helfen?\n\n*Fragen Sie zum Beispiel:* "Welches Tor ist am leersten?", "Zeige mir vegetarische Speisen" oder "Wo ist die Sanitätsstation?"`;
    } else if (targetLang === "ar") {
      reply = `### إجابة StadiumGPT\n\nمرحبًا! أنا **StadiumGPT**، رفيقك الذكي في كأس العالم لكرة القدم فيفا. يمكنني مساعدتك بإرشادات في الوقت الفعلي حول البوابات، ودورات المياه، ومناطق الطعام، والمباريات، وقواعد السلامة في **${stadium.name}**.\n\nكيف يمكنني مساعدتك اليوم؟\n\n*جرب أن تسأل:* "أي بوابة هي الأقصر طابورًا؟"، "أرني مأكولات نباتية"، أو "أين يقع المركز الطبي؟"`;
    } else if (targetLang === "pt") {
      reply = `### Resposta do StadiumGPT\n\nOlá! Eu sou o **StadiumGPT**, seu companheiro inteligente da Copa do Mundo FIFA. Posso ajudar com guias em tempo real sobre portões, banheiros, alimentação, jogos e segurança no estádio **${stadium.name}**.\n\nComo posso ajudar você hoje?\n\n*Tente perguntar:* "Qual portão está mais vazio?", "Opções de comida vegetariana" ou "Onde fica o centro médico?"`;
    } else {
      reply = `### StadiumGPT Response\n\nHello! I am **StadiumGPT**, your intelligent FIFA World Cup companion. I can help you with real-time guides about gates, restrooms, food courts, matches, and safety rules at **${stadium.name}**.\n\nWhat can I assist you with today?\n\n*Try asking:* "Which gate is shortest?", "Show me vegetarian food spots", or "Where is the medical center?"`;
    }
  }

  return reply;
}


// 11. AI Decision Support System Endpoint (Produces intelligent operational actions)
app.post("/api/gemini/decision-support", async (req, res) => {
  const { stadiumId, language } = req.body;
  if (!stadiumId) {
    res.status(400).json({ error: "Missing stadiumId" });
    return;
  }

  const stadium = getStadium(stadiumId);
  if (!stadium) {
    res.status(404).json({ error: "Stadium context not found" });
    return;
  }

  const targetLang = (language || "en").toLowerCase().trim();

  if (!ai) {
    // Robust local fallback rule-based decision support system
    res.json(getRuleBasedDecisionSupport(stadium, targetLang));
    return;
  }

  try {
    const facilitiesText = stadium.facilities.map(f => (
      `- ${f.name} (${f.id}): Category ${f.category}, Status: ${f.status}, Queue: ${f.queueLength}, Wait: ${f.waitTimeMinutes} mins.`
    )).join("\n");

    const incidentsText = stadium.incidents.length > 0
      ? stadium.incidents.map(i => `- ${i.title}: Category: ${i.category}, Severity: ${i.severity}, Status: ${i.status}, Section: ${i.section}`).join("\n")
      : "No active safety incidents reported.";

    let prompt = `Analyze the current real-time operations of ${stadium.name} and provide a list of proactive recommendations to improve operations, fan experience, and safety.

STADIUM STATE:
- Crowd Density: ${stadium.crowdDensity}
- Parking Occupancy: ${stadium.parkingOccupancy}%
- Weather Alert: ${stadium.weatherAlert || "None"}
- Traffic Conditions: ${stadium.trafficStatus}
- Active Incidents:
${incidentsText}

FACILITIES STATE:
${facilitiesText}

Respond ONLY with a JSON array conforming exactly to this structure. Each recommendation should solve an active issue like gate congestion, active incident, high traffic, or high restroom wait:
[
  {
    "id": "unique-id-string",
    "title": "Clear Actionable Title",
    "category": "CROWD" | "SECURITY" | "MEDICAL" | "FACILITY" | "TRAFFIC",
    "recommendation": "Step-by-step recommendation for stadium coordinators.",
    "reasoning": "Reason why the AI generated this, citing the specific congested gates or incidents above.",
    "confidenceScore": 85, // Integer 0 to 100
    "actionTriggered": false,
    "affectedFacilityId": "id-of-congested-gate-or-facility-or-empty"
  }
]`;

    if (targetLang !== "en") {
      prompt += `\n\nCRITICAL MANDATE: The user has selected the language: "${language}" (code: "${targetLang}").
You MUST translate all values for "title", "recommendation", and "reasoning" fields strictly into that language.
Ensure names of teams, stages, or proper nouns (like StadiumGPT or stadium names) remain accurate, but descriptions and directions are fully translated.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an Elite Cloud Architect and Stadium AI Decision Support Engine. Output strictly standard valid JSON matching the requested array format. No markdown, no triple backticks. If target language is non-English, deliver the JSON content in that language.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              confidenceScore: { type: Type.INTEGER },
              actionTriggered: { type: Type.BOOLEAN },
              affectedFacilityId: { type: Type.STRING }
            },
            required: ["id", "title", "category", "recommendation", "reasoning", "confidenceScore", "actionTriggered"]
          }
        },
        temperature: 0.2
      }
    });

    let resText = response.text || "[]";
    // Sanitize any extra backticks just in case
    resText = resText.replace(/```json/g, "").replace(/```/g, "").trim();
    const recommendations = JSON.parse(resText);
    res.json(recommendations);
  } catch (err: any) {
    console.error("Gemini AI Decision Support Error (falling back to rules):", err);
    res.json(getRuleBasedDecisionSupport(stadium, targetLang));
  }
});


// Helper function for local decision support fallback
function getRuleBasedDecisionSupport(stadium: Stadium, targetLang?: string) {
  const recommendations = [];
  const lang = (targetLang || "en").toLowerCase().trim();

  // Analyze Gate congestion
  const congestedGates = stadium.facilities.filter(f => f.category === FacilityCategory.ENTRY_GATE && f.status === FacilityStatus.CONGESTED);
  const clearGates = stadium.facilities.filter(f => f.category === FacilityCategory.ENTRY_GATE && f.status === FacilityStatus.OPERATIONAL && f.queueLength === QueueLength.SHORT);

  if (congestedGates.length > 0 && clearGates.length > 0) {
    let title = "Redirect Crowd Inflow from Congested Gates";
    let recommendation = `Redirect incoming fans from ${congestedGates.map(g => g.name).join(", ")} to the clear entries.`;
    let reasoning = `${congestedGates[0].name} has critical wait times (${congestedGates[0].waitTimeMinutes} mins), while ${clearGates[0].name} is operational with only ${clearGates[0].waitTimeMinutes} mins wait.`;

    if (lang === "es") {
      title = "Redirigir el flujo de multitud de las puertas congestionadas";
      recommendation = `Redirigir a los aficionados entrantes de ${congestedGates.map(g => g.name).join(", ")} a las entradas despejadas.`;
      reasoning = `${congestedGates[0].name} tiene tiempos de espera críticos (${congestedGates[0].waitTimeMinutes} min), mientras que ${clearGates[0].name} está operativo con solo ${clearGates[0].waitTimeMinutes} min de espera.`;
    } else if (lang === "fr") {
      title = "Rediriger le flux de foule des portes encombrées";
      recommendation = `Rediriger les supporters entrants de ${congestedGates.map(g => g.name).join(", ")} vers les entrées dégagées.`;
      reasoning = `${congestedGates[0].name} a des temps d'attente critiques (${congestedGates[0].waitTimeMinutes} min), tandis que ${clearGates[0].name} est opérationnel avec seulement ${clearGates[0].waitTimeMinutes} min d'attente.`;
    } else if (lang === "de") {
      title = "Zuschauerstrom von überlasteten Toren umleiten";
      recommendation = `Leiten Sie ankommende Fans von ${congestedGates.map(g => g.name).join(", ")} zu den freien Eingängen um.`;
      reasoning = `${congestedGates[0].name} hat kritische Wartezeiten (${congestedGates[0].waitTimeMinutes} Min.), während ${clearGates[0].name} betriebsbereit ist mit nur ${clearGates[0].waitTimeMinutes} Min. Wartezeit.`;
    } else if (lang === "ar") {
      title = "إعادة توجيه تدفق الجماهير من البوابات المزدحمة";
      recommendation = `إعادة توجيه المشجعين القادمين من ${congestedGates.map(g => g.name).join(", ")} إلى المداخل الشاغرة.`;
      reasoning = `تحتوي ${congestedGates[0].name} على أوقات انتظار حرجة (${congestedGates[0].waitTimeMinutes} دقيقة)، بينما تعمل ${clearGates[0].name} بوقت انتظار يبلغ ${clearGates[0].waitTimeMinutes} دقيقة فقط.`;
    } else if (lang === "pt") {
      title = "Redirecionar fluxo de multidão de portões congestionados";
      recommendation = `Redirecionar torcedores vindos de ${congestedGates.map(g => g.name).join(", ")} para as entradas liberadas.`;
      reasoning = `${congestedGates[0].name} tem tempos de espera críticos (${congestedGates[0].waitTimeMinutes} min), enquanto ${clearGates[0].name} está operacional com apenas ${clearGates[0].waitTimeMinutes} min de espera.`;
    }

    recommendations.push({
      id: `rec-crowd-${Date.now()}`,
      title,
      category: "CROWD",
      recommendation,
      reasoning,
      confidenceScore: 92,
      actionTriggered: false,
      affectedFacilityId: congestedGates[0].id
    });
  }

  // Analyze Restrooms
  const congestedRestrooms = stadium.facilities.filter(f => f.category === FacilityCategory.RESTROOM && f.queueLength === QueueLength.LONG);
  if (congestedRestrooms.length > 0) {
    let title = "Deploy Sanitization Crews to South Restrooms";
    let recommendation = "Increase sanitation and service frequency at Section 134 restrooms.";
    let reasoning = "Restroom suite has spiked into CONGESTED status due to nearby match concessions. High volume requires active cleaners.";

    if (lang === "es") {
      title = "Desplegar equipos de desinfección a los baños del sur";
      recommendation = "Aumentar la frecuencia de limpieza y servicio en los baños de la Sección 134.";
      reasoning = "El conjunto de baños ha aumentado a estado CONGESTIONADO debido a las concesiones de partidos cercanas. El alto volumen requiere limpiadores activos.";
    } else if (lang === "fr") {
      title = "Déployer des équipes de désinfection aux toilettes sud";
      recommendation = "Augmenter la fréquence de nettoyage et de service aux toilettes de la Section 134.";
      reasoning = "La suite de toilettes est passée en statut ENCOMBRÉ en raison des concessions de match à proximité. Le volume élevé nécessite des nettoyeurs actifs.";
    } else if (lang === "de") {
      title = "Reinigungsteams für die südlichen Toiletten bereitstellen";
      recommendation = "Erhöhen Sie die Reinigungs- und Servicefrequenz in den Toiletten von Sektion 134.";
      reasoning = "Der Toilettenbereich ist aufgrund nahegelegener Verkaufsstände in den Status ÜBERLASTET geraten. Hohes Aufkommen erfordert aktive Reinigungskräfte.";
    } else if (lang === "ar") {
      title = "نشر أطقم التعقيم في دورات المياه الجنوبية";
      recommendation = "زيادة وتيرة التعقيم والخدمة في دورات مياه القسم 134.";
      reasoning = "ارتفعت حالة دورات المياه إلى مزدحمة بسبب مبيعات المأكولات القريبة. يتطلب الحجم الكبير عمال نظافة نشطين.";
    } else if (lang === "pt") {
      title = "Implantar equipes de higienização nos banheiros do sul";
      recommendation = "Aumentar a frequência de limpeza e serviço nos banheiros da Seção 134.";
      reasoning = "O conjunto de banheiros subiu para o status CONGESTIONADO devido às concessões de jogos próximas. O alto volume exige limpadores ativos.";
    }

    recommendations.push({
      id: `rec-facility-${Date.now()}`,
      title,
      category: "FACILITY",
      recommendation,
      reasoning,
      confidenceScore: 85,
      actionTriggered: false,
      affectedFacilityId: congestedRestrooms[0].id
    });
  }

  // Analyze Active Incidents
  const activeMedical = stadium.incidents.filter(i => i.category === "Medical" && i.status !== IncidentStatus.RESOLVED);
  if (activeMedical.length > 0) {
    let title = "Dispatch Emergency Medical Team";
    let recommendation = "Deploy First Aid responders with emergency transport wheels to Seating Section 104.";
    let reasoning = `Active heat exhaustion incident reported by staff. Clinic 1 is currently empty and fully operational. Dispatching immediate treatment.`;

    if (lang === "es") {
      title = "Despachar equipo médico de emergencia";
      recommendation = "Desplegar socorristas de primeros auxilios con camillas de transporte de emergencia a la sección de asientos 104.";
      reasoning = `Personal reporta incidente de agotamiento por calor activo. La Clínica 1 está vacía y totalmente operativa. Despachando tratamiento inmediato.`;
    } else if (lang === "fr") {
      title = "Dépêcher une équipe médicale d'urgence";
      recommendation = "Déployer des secouristes de premiers secours avec brancards de transport d'urgence vers la section 104.";
      reasoning = `Incident d'épuisement par la chaleur actif signalé par le personnel. La clinique 1 est actuellement vide et opérationnelle. Envoi d'un traitement immédiat.`;
    } else if (lang === "de") {
      title = "Notfallmedizinisches Team entsenden";
      recommendation = "Senden Sie Ersthelfer mit Krankentragen zur Tribünensektion 104.";
      reasoning = `Aktiver Fall von Hitzeschlag vom Personal gemeldet. Klinik 1 ist derzeit leer und voll funktionsfähig. Sofortige Behandlung wird eingeleitet.`;
    } else if (lang === "ar") {
      title = "إرسال فريق الطوارئ الطبي";
      recommendation = "نشر مستجيبي الإسعافات الأولية مع نقالات النقل الطارئ إلى قسم المقاعد 104.";
      reasoning = `أبلغ الموظفون عن حالة إجهاد حراري نشطة. العيادة 1 فارغة حاليًا وتعمل بكامل طاقتها. إرسال العلاج الفوري.`;
    } else if (lang === "pt") {
      title = "Despachar equipe médica de emergência";
      recommendation = "Enviar socorristas de primeiros socorros com macas de transporte de emergência para a seção de assentos 104.";
      reasoning = `Incidente de exaustão por calor ativo relatado pela equipe. A Clínica 1 está vazia e totalmente operacional. Despachando atendimento imediato.`;
    }

    recommendations.push({
      id: `rec-medical-${Date.now()}`,
      title,
      category: "MEDICAL",
      recommendation,
      reasoning,
      confidenceScore: 98,
      actionTriggered: true,
      affectedFacilityId: activeMedical[0].facilityId
    });
  }

  // Default general recommendation
  if (recommendations.length === 0) {
    let title = "Proactive Volunteer Reallocation";
    let recommendation = "Station additional volunteer guides near official Fan Merch Shops.";
    let reasoning = "Fan shop queue is building up smoothly. Volunteers will speed up queue division and assist spectators with quick payments.";

    if (lang === "es") {
      title = "Reasignación proactiva de voluntarios";
      recommendation = "Ubicar guías voluntarios adicionales cerca de las tiendas oficiales de recuerdos de aficionados.";
      reasoning = "La fila de la tienda de recuerdos está aumentando moderadamente. Los voluntarios agilizarán la división de la fila y ayudarán a los espectadores con pagos rápidos.";
    } else if (lang === "fr") {
      title = "Réaffectation proactive des bénévoles";
      recommendation = "Placer des guides bénévoles supplémentaires près des boutiques de souvenirs officielles.";
      reasoning = "La file d'attente de la boutique de souvenirs se forme tranquillement. Les bénévoles accéléreront la division de la file et aideront les spectateurs à payer rapidement.";
    } else if (lang === "de") {
      title = "Proaktive Umverteilung von Helfern";
      recommendation = "Stationieren Sie zusätzliche Helfer in der Nähe der offiziellen Fan-Merchandise-Shops.";
      reasoning = "Die Schlange im Fan-Shop wächst stetig. Helfer werden die Aufteilung beschleunigen und Zuschauern bei schnellen Zahlungen helfen.";
    } else if (lang === "ar") {
      title = "إعادة توزيع المتطوعين الاستباقية";
      recommendation = "تمركز مرشدين متطوعين إضافيين بالقرب من متاجر هدايا المشجعين الرسمية.";
      reasoning = "طابور متجر الهدايا يتراكم بسلاسة. سيسرع المتطوعون تقسيم الطابور ويساعدون المتفرجين في الدفع السريع.";
    } else if (lang === "pt") {
      title = "Realocação proativa de voluntários";
      recommendation = "Posicionar guias voluntários adicionais perto das lojas oficiais de produtos dos torcedores.";
      reasoning = "A fila da loja de produtos está crescendo de forma constante. Os voluntários vão agilizar a divisão das filas e ajudar os espectadores com pagamentos rápidos.";
    }

    recommendations.push({
      id: `rec-gen-${Date.now()}`,
      title,
      category: "CROWD",
      recommendation,
      reasoning,
      confidenceScore: 78,
      actionTriggered: false
    });
  }

  return recommendations;
}


// 12. Dynamic Batch Translation API Endpoint (with built-in offline local fallback)
app.post("/api/translate", async (req, res) => {
  const { texts, targetLanguage } = req.body;
  if (!texts || !Array.isArray(texts) || !targetLanguage) {
    res.status(400).json({ error: "Missing texts array or targetLanguage" });
    return;
  }

  const target = targetLanguage.toLowerCase().trim();
  
  // If target is English, no translation needed
  if (target === "en") {
    res.json({ translatedTexts: texts });
    return;
  }

  // Robust, complete fallback offline translation dictionary for all main UI labels
  const dictionary: Record<string, Record<string, string>> = {
    es: {
      "stadium": "estadio",
      "capacity": "capacidad",
      "command center": "centro de comando",
      "active live match ticker": "marcador del partido en vivo",
      "matchday": "día del partido",
      "concourse scanners nominal": "escáneres del vestíbulo nominales",
      "live tweaks": "ajustes en vivo",
      "crowd": "multitud",
      "parking %": "% de estacionamiento",
      "traffic": "tráfico",
      "weather": "clima",
      "active bulletins": "boletines activos",
      "parking lots": "estacionamientos",
      "interactive map & ai helper": "mapa interactivo y asistente de ia",
      "predictive analytics": "análisis predictivo",
      "ai decision support": "soporte de decisiones de ia",
      "incidents & staff tasks": "incidentes y tareas del personal",
      "compliance & testing": "cumplimiento y pruebas",
      "super-admin-global-kpis": "kpis globales del super-administrador",
      "cross-stadium global orchestration console": "consola de orquestación global multi-estadio",
      "total venues": "sedes totales",
      "total combined capacity": "capacidad total combinada",
      "total active safety incidents": "incidentes activos de seguridad",
      "global server health": "salud global del servidor",
      "all venues synced": "todas las sedes sincronizadas",
      "seats": "asientos",
      "alerts": "alertas",
      "nominal": "nominal",
      "fifa world cup digital venue platform": "plataforma digital de sedes de la copa mundial de la fifa",
      "authorized operator console": "consola de operador autorizada",
      "secure session": "sesión segura",
      "all rights reserved": "todos los derechos reservados",
      "which gate has the shortest queue?": "¿qué puerta tiene la cola más corta?",
      "show me where the medical center is.": "muéstrame dónde está el centro médico.",
      "do you have vegetarian food options?": "¿tienen opciones de comida vegetariana?",
      "how crowded is the stadium right now?": "¿qué tan lleno está el estadio en este momento?",
      "what announcements are active?": "¿qué anuncios están activos?",
      "live now": "en vivo ahora",
      "Active Bulletins": "boletines activos",
      "Parking Lots": "estacionamientos",
      "gis map visualizer": "visualizador de mapa gis",
      "crowd control": "control de multitudes",
      "concession stands": "puestos de comida",
      "restrooms": "baños",
      "entry gates": "puertas de entrada",
      "medical clinics": "clínicas médicas",
      "select facility to command": "seleccionar instalación para comandar",
      "reporting incident dispatcher": "despachador de reportes de incidentes",
      "report safety or facility hazard": "reportar peligro de seguridad o instalación",
      "report incident": "reportar incidente",
      "staff queue optimizer": "optimizador de colas del personal",
      "chat with stadiumgpt helper": "chatear con asistente stadiumgpt",
      "ask anything about gates, concession wait times, restrooms, and security rules": "pregunta lo que quieras sobre puertas, tiempos de comida, baños y seguridad",
      "type stadium question...": "escribe una pregunta sobre el estadio...",
      "send": "enviar"
    },
    fr: {
      "stadium": "stade",
      "capacity": "capacité",
      "command center": "centre de commandement",
      "active live match ticker": "téléscripteur de match en direct",
      "matchday": "jour de match",
      "concourse scanners nominal": "scanners de hall nominaux",
      "live tweaks": "ajustements en direct",
      "crowd": "foule",
      "parking %": "% de parking",
      "traffic": "circulation",
      "weather": "météo",
      "active bulletins": "bulletins actifs",
      "parking lots": "parkings",
      "interactive map & ai helper": "carte interactive et assistant ia",
      "predictive analytics": "analyses prédictives",
      "ai decision support": "aide à la décision ia",
      "incidents & staff tasks": "incidents et tâches du personnel",
      "compliance & testing": "conformité et tests",
      "super-admin-global-kpis": "indicateurs globaux de super-admin",
      "cross-stadium global orchestration console": "console d'orchestration globale multi-stades",
      "total venues": "total des sites",
      "total combined capacity": "capacité totale combinée",
      "total active safety incidents": "incidents de sécurité actifs",
      "global server health": "santé globale du serveur",
      "all venues synced": "tous les sites synchronisés",
      "seats": "sièges",
      "alerts": "alertes",
      "nominal": "nominal",
      "fifa world cup digital venue platform": "plateforme numérique des sites de la coupe du monde de la fifa",
      "authorized operator console": "console d'opérateur autorisée",
      "secure session": "session sécurisée",
      "all rights reserved": "tous droits réservés",
      "which gate has the shortest queue?": "quelle porte a la file d'attente la plus courte ?",
      "show me where the medical center is.": "montrez-moi où se trouve le centre médical.",
      "do you have vegetarian food options?": "avez-vous des options de nourriture végétarienne ?",
      "how crowded is the stadium right now?": "quel est le taux d'occupation du stade en ce moment ?",
      "what announcements are active?": "quels messages d'alerte sont actifs ?",
      "live now": "en direct",
      "Active Bulletins": "bulletins actifs",
      "Parking Lots": "parkings",
      "gis map visualizer": "visualiseur de carte sig",
      "crowd control": "contrôle des foules",
      "concession stands": "points de vente",
      "restrooms": "toilettes",
      "entry gates": "portes d'entrée",
      "medical clinics": "cliniques médicales",
      "select facility to command": "sélectionner l'installation à commander",
      "reporting incident dispatcher": "répartiteur de rapports d'incidents",
      "report safety or facility hazard": "signaler un danger ou incident",
      "report incident": "signaler un incident",
      "staff queue optimizer": "optimiseur de file d'attente du personnel",
      "chat with stadiumgpt helper": "discuter avec l'assistant de stade",
      "ask anything about gates, concession wait times, restrooms, and security rules": "posez vos questions sur les entrées, l'attente, les toilettes et la sécurité",
      "type stadium question...": "tapez votre question...",
      "send": "envoyer"
    },
    de: {
      "stadium": "Stadion",
      "capacity": "Kapazität",
      "command center": "Kommandozentrale",
      "active live match ticker": "Live-Spiel-Ticker",
      "matchday": "Spieltag",
      "concourse scanners nominal": "Umlauf-Scanner nominal",
      "live tweaks": "Live-Anpassungen",
      "crowd": "Menge",
      "parking %": "Parkplatz %",
      "traffic": "Verkehr",
      "weather": "Wetter",
      "active bulletins": "Aktive Meldungen",
      "parking lots": "Parkplätze",
      "interactive map & ai helper": "Interaktive Karte & KI-Helfer",
      "predictive analytics": "Prädiktive Analysen",
      "ai decision support": "KI-Entscheidungshilfe",
      "incidents & staff tasks": "Vorfälle & Personalaufgaben",
      "compliance & testing": "Compliance & Tests",
      "super-admin-global-kpis": "Super-Admin Globale KPIs",
      "cross-stadium global orchestration console": "Globale stadionübergreifende Orchestrierungskonsole",
      "total venues": "Gesamte Spielorte",
      "total combined capacity": "Gesamte kombinierte Kapazität",
      "total active safety incidents": "Aktive Sicherheitsvorfälle",
      "global server health": "Globale Servergesundheit",
      "all venues synced": "Alle Spielorte synchronisiert",
      "seats": "Sitzplätze",
      "alerts": "Alarme",
      "nominal": "nominal",
      "fifa world cup digital venue platform": "Digitale FIFA WM-Spielort-Plattform",
      "authorized operator console": "Autorisierte Bedienerkonsole",
      "secure session": "Sichere Sitzung",
      "all rights reserved": "Alle Rechte vorbehalten",
      "which gate has the shortest queue?": "Welches Tor hat die kürzeste Schlange?",
      "show me where the medical center is.": "Zeig mir, wo das medizinische Zentrum ist.",
      "do you have vegetarian food options?": "Gibt es vegetarische Essensoptionen?",
      "how crowded is the stadium right now?": "Wie voll ist das Stadion gerade?",
      "what announcements are active?": "Welche Durchsagen sind aktiv?",
      "live now": "Live Jetzt",
      "Active Bulletins": "Aktive Bulletins",
      "Parking Lots": "Parkplätze",
      "gis map visualizer": "GIS-Karten-Visualisierer",
      "crowd control": "Mengensteuerung",
      "concession stands": "Verkaufsstände",
      "restrooms": "Toiletten",
      "entry gates": "Eingangstore",
      "medical clinics": "Medizinische Kliniken",
      "select facility to command": "Anlage zur Steuerung auswählen",
      "reporting incident dispatcher": "Incident Report Dispatcher",
      "report safety or facility hazard": "Sicherheits- oder Anlagenrisiko melden",
      "report incident": "Vorfall melden",
      "staff queue optimizer": "Personal Schlangen-Optimierer",
      "chat with stadiumgpt helper": "Chat mit StadiumGPT-Helfer",
      "ask anything about gates, concession wait times, restrooms, and security rules": "Fragen Sie alles zu Toren, Wartezeiten, Toiletten und Regeln",
      "type stadium question...": "Stadion-Frage eingeben...",
      "send": "Senden"
    },
    ar: {
      "stadium": "الملعب",
      "capacity": "السعة",
      "command center": "مركز القيادة",
      "active live match ticker": "شريط المباراة المباشرة",
      "matchday": "يوم المباراة",
      "concourse scanners nominal": "أجهزة المسح الضوئي طبيعية",
      "live tweaks": "تعديلات مباشرة",
      "crowd": "الجمهور",
      "parking %": "نسبة مواقف السيارات",
      "traffic": "حركة المرور",
      "weather": "الطقس",
      "active bulletins": "النشرات النشطة",
      "parking lots": "مواقف السيارات",
      "interactive map & ai helper": "الخريطة التفاعلية ومساعد الذكاء الاصطناعي",
      "predictive analytics": "التحليلات التنبؤية",
      "ai decision support": "دعم القرار بالذكاء الاصطناعي",
      "incidents & staff tasks": "الحوادث ومهام الموظفين",
      "compliance & testing": "الامتثال والاختبار",
      "super-admin-global-kpis": "مؤشرات الأداء العالمية للمسؤول الفائق",
      "cross-stadium global orchestration console": "لوحة التحكم العالمية للتنسيق بين الملاعب",
      "total venues": "إجمالي الملاعب",
      "total combined capacity": "السعة الإجمالية المشتركة",
      "total active safety incidents": "حوادث السلامة النشطة",
      "global server health": "صحة الخادم العالمية",
      "all venues synced": "مزامنة جميع الملاعب",
      "seats": "مقاعد",
      "alerts": "تنبيهات",
      "nominal": "طبيعي",
      "fifa world cup digital venue platform": "المنصة الرقمية لملاعب كأس العالم فيفا",
      "authorized operator console": "لوحة تحكم المشغل المعتمد",
      "secure session": "جلسة آمنة",
      "all rights reserved": "جميع الحقوق محفوظة",
      "which gate has the shortest queue?": "أي بوابة بها أقصر طابور؟",
      "show me where the medical center is.": "أرني أين يقع المركز الطبي.",
      "do you have vegetarian food options?": "هل لديكم خيارات طعام نباتي؟",
      "how crowded is the stadium right now?": "ما مدى ازدحام الاستاد الآن؟",
      "what announcements are active?": "ما هي الإعلانات النشطة؟",
      "live now": "مباشر الآن",
      "Active Bulletins": "النشرات النشطة",
      "Parking Lots": "مواقف السيارات",
      "gis map visualizer": "مستعرض خرائط نظم المعلومات الجغرافية GIS",
      "crowd control": "التحكم في الحشود",
      "concession stands": "أكشاك البيع",
      "restrooms": "دورات المياه",
      "entry gates": "بوابات الدخول",
      "medical clinics": "العيادات الطبية",
      "select facility to command": "اختر المنشأة للتحكم بها",
      "reporting incident dispatcher": "مراسل بلاغات الحوادث",
      "report safety or facility hazard": "أبلغ عن خطر أمني أو عيب منشآت",
      "report incident": "أبلغ عن حادث",
      "staff queue optimizer": "محسن طوابير الموظفين",
      "chat with stadiumgpt helper": "تحدث مع مساعد StadiumGPT",
      "ask anything about gates, concession wait times, restrooms, and security rules": "اسأل عن البوابات، أوقات الانتظار، دورات المياه، وقواعد الأمن",
      "type stadium question...": "اكتب سؤالك عن الملعب...",
      "send": "إرسال"
    },
    pt: {
      "stadium": "estádio",
      "capacity": "capacidade",
      "command center": "centro de comando",
      "active live match ticker": "placar do jogo ao vivo",
      "matchday": "dia do jogo",
      "concourse scanners nominal": "scanners do saguão nominais",
      "live tweaks": "ajustes ao vivo",
      "crowd": "multidão",
      "parking %": "% de estacionamento",
      "traffic": "trânsito",
      "weather": "clima",
      "active bulletins": "boletins ativos",
      "parking lots": "estacionamentos",
      "interactive map & ai helper": "mapa interativo e assistente de ia",
      "predictive analytics": "análises preditivas",
      "ai decision support": "suporte de decisão de ia",
      "incidents & staff tasks": "incidentes e tarefas da equipe",
      "compliance & testing": "conformidade e testes",
      "super-admin-global-kpis": "kpis globais do super-administrador",
      "cross-stadium global orchestration console": "console de orquestração global multiestádio",
      "total venues": "total de locais",
      "total combined capacity": "capacidade combinada total",
      "total active safety incidents": "incidentes ativos de segurança",
      "global server health": "saúde global do servidor",
      "all venues synced": "todos os locais sincronizados",
      "seats": "assentos",
      "alerts": "alertas",
      "nominal": "nominal",
      "fifa world cup digital venue platform": "plataforma digital de sedes da copa do mundo da fifa",
      "authorized operator console": "console de operador autorizado",
      "secure session": "sessão segura",
      "all rights reserved": "todos os direitos reservados",
      "which gate has the shortest queue?": "qual portão tem a menor fila?",
      "show me where the medical center is.": "mostre-me onde fica o centro médico.",
      "do you have vegetarian food options?": "você tem opções de comida vegetariana?",
      "how crowded is the stadium right now?": "quão cheio está o estádio agora?",
      "what announcements are active?": "quais comunicados estão ativos?",
      "live now": "ao vivo agora",
      "Active Bulletins": "boletins ativos",
      "Parking Lots": "estacionamentos",
      "gis map visualizer": "visualizador de mapa gis",
      "crowd control": "controle de multidão",
      "concession stands": "ponto de alimentação",
      "restrooms": "banheiros",
      "entry gates": "portões de entrada",
      "medical clinics": "clínicas médicas",
      "select facility to command": "selecionar instalação para comandar",
      "reporting incident dispatcher": "despachador de relatórios de incidentes",
      "report safety or facility hazard": "relatar perigo de segurança ou instalação",
      "report incident": "relatar incidente",
      "staff queue optimizer": "otimizador de filas da equipe",
      "chat with stadiumgpt helper": "conversar com assistente stadiumgpt",
      "ask anything about gates, concession wait times, restrooms, and security rules": "pergunte sobre portões, tempos de espera, banheiros e regras",
      "type stadium question...": "digite sua pergunta...",
      "send": "enviar"
    }
  };

  if (!ai) {
    // offline replacement of dictionary items
    const translated = texts.map(text => {
      const lower = text.toLowerCase().trim();
      if (dictionary[target] && dictionary[target][lower]) {
        return dictionary[target][lower];
      }
      return text;
    });
    res.json({ translatedTexts: translated });
    return;
  }

  try {
    const prompt = `Translate the following list of strings into the specified target language: "${targetLanguage}" (code: "${target}").
Keep any markdown formatting, numbers, proper names (like StadiumGPT or stadium names), or percents unchanged.
Return ONLY a valid JSON array of translated strings in the exact same index order. Do not include any markdown block formatting wrapper (no backticks) or explanation.

JSON array to translate:
${JSON.stringify(texts)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Translated strings"
        },
        temperature: 0.1
      }
    });

    let resText = response.text || "[]";
    resText = resText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(resText);
    if (Array.isArray(parsed) && parsed.length === texts.length) {
      res.json({ translatedTexts: parsed });
    } else {
      throw new Error("Incorrect parsed response structure");
    }
  } catch (err: any) {
    console.error("Failed to translate dynamically via Gemini:", err);
    // fallback offline translation mapping
    const translated = texts.map(text => {
      const lower = text.toLowerCase().trim();
      if (dictionary[target] && dictionary[target][lower]) {
        return dictionary[target][lower];
      }
      return text;
    });
    res.json({ translatedTexts: translated });
  }
});


// Configure dev server vs production static assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server using Vite's Middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware");
  } else {
    // Serve production built assets from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StadiumGPT Operational Server running at http://0.0.0.0:${PORT}/`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start StadiumGPT custom server:", err);
});
