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
    eventName: "FIFA World Cup 2026 - Matchday 11",
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
        date: "2026-06-15",
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
        date: "2026-06-22",
        time: "15:00",
        status: "SCHEDULED"
      },
      {
        id: "m-nj-3",
        matchNumber: 104,
        stage: "Final Match",
        teamA: "Winner SF1",
        teamB: "Winner SF2",
        date: "2026-07-19",
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
        reportedAt: "2026-07-12T11:15:00Z"
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
        reportedAt: "2026-07-12T11:20:00Z",
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
        createdAt: "2026-07-12T11:16:00Z"
      },
      {
        id: "task-nj-202",
        title: "Redistribute crowd flow at Verizon Gate B",
        description: "Instruct volunteers to redirect incoming fans from congested Gate B to Gate A (shortest wait).",
        assignedRole: UserRole.VOLUNTEER,
        stadiumId: "stadium-metlife",
        facilityId: "nj-gate-b",
        status: "PENDING",
        createdAt: "2026-07-12T11:22:00Z"
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
    eventName: "FIFA World Cup 2026 - Tournament Opening Match",
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
        date: "2026-06-11",
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
        date: "2026-06-18",
        time: "20:00",
        status: "SCHEDULED"
      },
      {
        id: "m-az-3",
        matchNumber: 72,
        stage: "Round of 16",
        teamA: "Winner Group A",
        teamB: "Runner-up Group C",
        date: "2026-06-30",
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
    eventName: "FIFA World Cup 2026 - Matchday 3",
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
        date: "2026-06-12",
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
        date: "2026-06-19",
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
  const { name, country, city, address, latitude, longitude, capacity, eventName } = req.body;
  if (!name || !country || !city || !capacity) {
    res.status(400).json({ error: "Missing required fields: name, country, city, capacity" });
    return;
  }

  const newStadium: Stadium = {
    id: `stadium-${Date.now()}`,
    name,
    country,
    city,
    address: address || "",
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    capacity: Number(capacity),
    eventName: eventName || "FIFA World Cup 2026 Matchday",
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
  if (parkingOccupancy !== undefined) stadium.parkingOccupancy = Number(parkingOccupancy);
  if (weatherAlert !== undefined) stadium.weatherAlert = weatherAlert;
  if (trafficStatus !== undefined) stadium.trafficStatus = trafficStatus;
  if (emergencyAlert !== undefined) stadium.emergencyAlert = emergencyAlert;
  if (eventName !== undefined) stadium.eventName = eventName;

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

  const { title, category, description, facilityId, section, severity, reporterName } = req.body;
  if (!title || !category || !description || !severity) {
    res.status(400).json({ error: "Missing incident details" });
    return;
  }

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

  const { title, description, assignedRole, facilityId } = req.body;
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
  const { message, stadiumId, history } = req.body;
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

  const systemInstruction = `You are StadiumGPT, the official Generative AI operational assistant and digital host for the FIFA World Cup 2026.
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

  if (!ai) {
    // Fallback smart rule-based chatbot when Gemini API key is missing
    const msgLower = message.toLowerCase();
    let reply = "";

    if (msgLower.includes("gate") || msgLower.includes("entrance")) {
      const bestGate = stadium.facilities
        .filter(f => f.category === FacilityCategory.ENTRY_GATE)
        .sort((a, b) => a.waitTimeMinutes - b.waitTimeMinutes)[0];
      const congestedGates = stadium.facilities
        .filter(f => f.category === FacilityCategory.ENTRY_GATE && f.status === FacilityStatus.CONGESTED);

      reply = `### Welcome to ${stadium.name} Entry Gates Guide\n\n`;
      if (bestGate) {
        reply += `👉 **Recommendation:** Head to **${bestGate.name}** which has a short queue. Current wait time is only **${bestGate.waitTimeMinutes} minutes**.\n\n`;
      }
      if (congestedGates.length > 0) {
        reply += `⚠️ **Aviation Warning:** Avoid **${congestedGates.map(g => g.name).join(", ")}** due to extreme pedestrian congestion (**${congestedGates[0].waitTimeMinutes} mins** wait time).\n`;
      }
    } else if (msgLower.includes("restroom") || msgLower.includes("toilet") || msgLower.includes("bathroom")) {
      const openRestroom = stadium.facilities
        .filter(f => f.category === FacilityCategory.RESTROOM)
        .sort((a, b) => a.waitTimeMinutes - b.waitTimeMinutes)[0];
      reply = `### Restroom Facilities Info\n\n`;
      if (openRestroom) {
        reply += `🚽 The nearest optimal restroom is **${openRestroom.name}** with a short wait of **${openRestroom.waitTimeMinutes} minutes**.\n`;
      } else {
        reply += `All facilities are currently reported open. Please check the interactive map overlay for section indicators.`;
      }
    } else if (msgLower.includes("food") || msgLower.includes("vegetarian") || msgLower.includes("halal") || msgLower.includes("eat")) {
      const foodSpots = stadium.facilities.filter(f => f.category === FacilityCategory.FOOD_COURT || f.category === FacilityCategory.RESTAURANT || f.category === FacilityCategory.VIP_LOUNGE);
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
    } else if (msgLower.includes("medical") || msgLower.includes("emergency") || msgLower.includes("hurt") || msgLower.includes("first aid")) {
      const medical = stadium.facilities.find(f => f.category === FacilityCategory.MEDICAL_CENTER);
      reply = `### 🚨 EMERGENCY MEDICAL ASSISTANCE\n\n`;
      if (medical) {
        reply += `🏥 **Immediate Care Center:** The official **${medical.name}** is operational at **${medical.description}**.\n\n`;
      }
      reply += `Please locate the nearest security officer or volunteer helper. If you are experiencing an acute emergency, please report this incident using our **Report Incident** form on the live operator suite immediately!`;
    } else if (msgLower.includes("match") || msgLower.includes("score") || msgLower.includes("play")) {
      reply = `### Matchday Information ⚽\n\n**${stadium.eventName}**\n\n`;
      stadium.matchSchedule.forEach(m => {
        reply += `- **${m.teamA} vs ${m.teamB}** (${m.stage})\n`;
        reply += `  - Status: \`${m.status}\` ${m.score ? `| Score: ${m.score}` : ''}\n`;
        reply += `  - Schedule: ${m.date} at ${m.time}\n\n`;
      });
    } else {
      reply = `### StadiumGPT Response\n\nHello! I am **StadiumGPT**, your intelligent FIFA World Cup companion. I can help you with real-time guides about gates, restrooms, food courts, matches, and safety rules at **${stadium.name}**.\n\nWhat can I assist you with today?\n\n*Try asking:* "Which gate is shortest?", "Show me vegetarian food spots", or "Where is the medical center?"`;
    }

    res.json({ text: reply });
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
    console.error("Gemini API Error in server.ts:", err);
    res.status(500).json({ error: "Failed to query Gemini API", details: err.message });
  }
});


// 11. AI Decision Support System Endpoint (Produces intelligent operational actions)
app.post("/api/gemini/decision-support", async (req, res) => {
  const { stadiumId } = req.body;
  if (!stadiumId) {
    res.status(400).json({ error: "Missing stadiumId" });
    return;
  }

  const stadium = getStadium(stadiumId);
  if (!stadium) {
    res.status(404).json({ error: "Stadium context not found" });
    return;
  }

  if (!ai) {
    // Robust local fallback rule-based decision support system
    const recommendations = [];

    // Analyze Gate congestion
    const congestedGates = stadium.facilities.filter(f => f.category === FacilityCategory.ENTRY_GATE && f.status === FacilityStatus.CONGESTED);
    const clearGates = stadium.facilities.filter(f => f.category === FacilityCategory.ENTRY_GATE && f.status === FacilityStatus.OPERATIONAL && f.queueLength === QueueLength.SHORT);

    if (congestedGates.length > 0 && clearGates.length > 0) {
      recommendations.push({
        id: `rec-crowd-${Date.now()}`,
        title: "Redirect Crowd Inflow from Congested Gates",
        category: "CROWD",
        recommendation: `Redirect incoming fans from ${congestedGates.map(g => g.name).join(", ")} to the clear entries.`,
        reasoning: `${congestedGates[0].name} has critical wait times (${congestedGates[0].waitTimeMinutes} mins), while ${clearGates[0].name} is operational with only ${clearGates[0].waitTimeMinutes} mins wait.`,
        confidenceScore: 92,
        actionTriggered: false,
        affectedFacilityId: congestedGates[0].id
      });
    }

    // Analyze Restrooms
    const congestedRestrooms = stadium.facilities.filter(f => f.category === FacilityCategory.RESTROOM && f.queueLength === QueueLength.LONG);
    if (congestedRestrooms.length > 0) {
      recommendations.push({
        id: `rec-facility-${Date.now()}`,
        title: "Deploy Sanitization Crews to South Restrooms",
        category: "FACILITY",
        recommendation: "Increase sanitation and service frequency at Section 134 restrooms.",
        reasoning: "Restroom suite has spiked into CONGESTED status due to nearby match concessions. High volume requires active cleaners.",
        confidenceScore: 85,
        actionTriggered: false,
        affectedFacilityId: congestedRestrooms[0].id
      });
    }

    // Analyze Active Incidents
    const activeMedical = stadium.incidents.filter(i => i.category === "Medical" && i.status !== IncidentStatus.RESOLVED);
    if (activeMedical.length > 0) {
      recommendations.push({
        id: `rec-medical-${Date.now()}`,
        title: "Dispatch Emergency Medical Team",
        category: "MEDICAL",
        recommendation: "Deploy First Aid responders with emergency transport wheels to Seating Section 104.",
        reasoning: `Active heat exhaustion incident reported by staff. Clinic 1 is currently empty and fully operational. Dispatching immediate treatment.`,
        confidenceScore: 98,
        actionTriggered: true,
        affectedFacilityId: activeMedical[0].facilityId
      });
    }

    // Default general recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        id: `rec-gen-${Date.now()}`,
        title: "Proactive Volunteer Reallocation",
        category: "CROWD",
        recommendation: "Station additional volunteer guides near official Fan Merch Shops.",
        reasoning: "Fan shop queue is building up smoothly. Volunteers will speed up queue division and assist spectators with quick payments.",
        confidenceScore: 78,
        actionTriggered: false
      });
    }

    res.json(recommendations);
    return;
  }

  try {
    const facilitiesText = stadium.facilities.map(f => (
      `- ${f.name} (${f.id}): Category ${f.category}, Status: ${f.status}, Queue: ${f.queueLength}, Wait: ${f.waitTimeMinutes} mins.`
    )).join("\n");

    const incidentsText = stadium.incidents.length > 0
      ? stadium.incidents.map(i => `- ${i.title}: Category: ${i.category}, Severity: ${i.severity}, Status: ${i.status}, Section: ${i.section}`).join("\n")
      : "No active safety incidents reported.";

    const prompt = `Analyze the current real-time operations of ${stadium.name} and provide a list of proactive recommendations to improve operations, fan experience, and safety.

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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an Elite Cloud Architect and Stadium AI Decision Support Engine. Output strictly standard valid JSON matching the requested array format. No markdown, no triple backticks.",
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
    console.error("Gemini AI Decision Support Error:", err);
    res.status(500).json({ error: "Failed to analyze decision support", details: err.message });
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
