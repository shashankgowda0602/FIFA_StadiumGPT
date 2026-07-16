# FIFA StadiumGPT - Real-Time Stadium Operations & AI Assistant Platform

## 📋 Project Overview

**FIFA StadiumGPT** is an intelligent, cloud-native operational management system designed for large-scale FIFA World Cup stadium events. It combines real-time facility monitoring, AI-powered decision support, and multilingual assistance to optimize spectator experience, enhance crowd safety, and streamline staff coordination during high-stakes matches.

---

## 1️⃣ CHOSEN VERTICAL & DOMAIN

### **Vertical: Stadium Operations & Event Management**

This solution targets the **FIFA World Cup Infrastructure Management** vertical, focusing on:

- **Real-time operational dashboards** for stadium coordinators
- **Crowd flow optimization** and dynamic facility management
- **Incident reporting & emergency response** workflows
- **Multilingual fan assistance** via conversational AI
- **Predictive analytics** for resource allocation

### **Use Case: MetLife Stadium (Primary Example)**
- 82,500-seat capacity
- Multiple entry gates (A, B, C, D) with real-time queue monitoring
- Diverse facilities: food courts, restrooms, medical clinics, parking areas
- Active match-day incidents (beverage spills, medical emergencies)
- Staff task assignment and incident resolution tracking

---

## 2️⃣ APPROACH & LOGIC

### **Architecture Philosophy: Hybrid AI with Graceful Fallback**

The system follows a **dual-mode operation strategy**:

1. **Primary Mode (Cloud-Native AI)**
   - Google Gemini API (gemini-3.5-flash) for intelligent, context-aware responses
   - Real-time RAG (Retrieval-Augmented Generation) with live stadium state
   - JSON schema validation for structured decision support
   - Multi-language dynamic translation

2. **Fallback Mode (Local Rule-Based Logic)**
   - Pre-built decision trees for common scenarios (gate congestion, medical incidents, restroom queues)
   - Offline translation dictionary (5 languages: ES, FR, DE, AR, PT)
   - Zero latency, zero API dependency
   - Graceful degradation when Gemini API is unavailable

### **Data Model: Stadium Ecosystem**

```
Stadium
├── Match Schedule (live/scheduled matches with scores)
├── Facilities (entry gates, food courts, restrooms, medical centers)
│   ├── Real-time status (OPERATIONAL, CONGESTED)
│   ├── Queue metrics (length, wait time in minutes)
│   └── Special attributes (food dietary options, opening hours)
├── Incidents (maintenance, medical, security)
│   ├── Severity levels (MINOR, MAJOR, CRITICAL)
│   ├── Status tracking (ACTIVE, RESPONDING, RESOLVED)
│   └── Auto-linked staff tasks
└── Staff Tasks (incident resolution, crowd management)
    ├── Assigned roles (VOLUNTEER, STADIUM_STAFF, SECURITY)
    └── Status lifecycle (PENDING → IN_PROGRESS → COMPLETED)
```

### **Core Processing Logic**

#### **1. Input Sanitization**
```typescript
sanitizeString(input, maxLength)
  → Removes HTML tags (XSS protection)
  → Enforces max length boundaries
  → Returns clean, safe text
```

#### **2. Stadium Context Construction**
- Live match information (current status, score, teams)
- Facilities list with real-time operational state
- Active incidents and hazards
- Staff task queue

#### **3. AI Decision Flow**
```
User Query
  ↓
Gemini API Call (with full stadium context)
  ├─ Success: Return AI response
  └─ Failure: Fallback to getRuleBasedChatReply()
      ├─ Pattern matching on user message
      ├─ Filter relevant facilities
      └─ Generate structured markdown response
```

#### **4. Recommendation Engine**
The `/api/gemini/decision-support` endpoint analyzes stadium state and generates proactive actions:
- **CROWD** category: Redirect flows from congested gates to clear entries
- **FACILITY** category: Deploy sanitation crews to high-demand restrooms
- **MEDICAL** category: Dispatch emergency teams with high confidence (98%)
- **TRAFFIC** category: Route optimization based on historical patterns
- **SECURITY** category: Incident escalation and protective measures

---

## 3️⃣ HOW THE SOLUTION WORKS

### **REST API Endpoints (12 Core Operations)**

#### **Stadium Management**
- `GET /api/stadiums` — Retrieve all stadiums
- `POST /api/stadiums` — Create new stadium (with validation: capacity 1K–200K seats, lat/lng bounds)
- `PUT /api/stadiums/:id` — Update operational parameters (crowd density, parking, weather alerts)

#### **Facility Operations**
- `POST /api/stadiums/:id/facilities` — Add facilities (gates, food courts, restrooms, medical)
- `PUT /api/stadiums/:id/facilities/:facId` — Update facility status (queue length, wait times)

#### **Incident Management**
- `POST /api/stadiums/:id/incidents` — Report new incident with auto-generated staff task
- `PUT /api/stadiums/:id/incidents/:incId` — Update incident status (marks related tasks COMPLETED)

#### **Staff Task Management**
- `POST /api/stadiums/:id/tasks` — Create new task for volunteers/staff
- `PUT /api/stadiums/:id/tasks/:taskId` — Update task status

#### **AI & Analytics**
- `GET /api/stadiums/:id/predictive` — Hourly crowd forecasts, risk factor analysis (congestion, evacuation, traffic)
- `POST /api/gemini/chat` — Conversational AI assistant (gates, restrooms, food, medical info)
- `POST /api/gemini/decision-support` — Actionable operational recommendations (JSON array)
- `POST /api/translate` — Batch text translation with fallback dictionary

### **Request/Response Example**

**Chat Query:**
```bash
POST /api/gemini/chat
{
  "message": "Which gate has the shortest queue?",
  "stadiumId": "stadium-metlife",
  "language": "es"
}
```

**Rule-Based Fallback Response (Spanish):**
```markdown
### Bienvenido a la Guía de Puertas de Entrada de MetLife Stadium

👉 **Recomendación:** Dirígete a **Pepsi Gate D**, que tiene una fila corta.
El tiempo de espera actual es de solo **4 minutos**.

⚠️ **Advertencia:** Evita **Verizon Gate B** debido a la congestión peatonal
extrema (tiempo de espera de **45 mins**).
```

### **Decision Support Example**

**Request:**
```bash
POST /api/gemini/decision-support
{ "stadiumId": "stadium-metlife", "language": "en" }
```

**Response (Auto-Generated Recommendations):**
```json
[
  {
    "id": "rec-crowd-1721124567890",
    "title": "Redirect Crowd Inflow from Congested Gates",
    "category": "CROWD",
    "recommendation": "Deploy volunteer guides at Pepsi Gate D (4 min wait) with signage directing overflow from Verizon Gate B (45 min wait).",
    "reasoning": "Verizon Gate B has critical wait times due to train arrivals at the adjacent rail transit platform. Pepsi Gate D is operational with minimal queue.",
    "confidenceScore": 92,
    "actionTriggered": false,
    "affectedFacilityId": "nj-gate-b"
  },
  {
    "id": "rec-medical-1721124567891",
    "title": "Dispatch Emergency Medical Team",
    "category": "MEDICAL",
    "recommendation": "Deploy First Aid responders with emergency transport to Seating Section 104 immediately.",
    "reasoning": "Active heat exhaustion incident. Clinic 1 is fully operational and empty.",
    "confidenceScore": 98,
    "actionTriggered": true,
    "affectedFacilityId": "nj-medical-1"
  }
]
```

### **Incident Auto-Response Workflow**

```
User Reports Incident
  ↓
POST /api/stadiums/:id/incidents
  ├─ Input validation & XSS sanitization
  ├─ Create Incident record (ACTIVE status)
  └─ Auto-create linked Staff Task (PENDING)
      ↓
      Task visible in staff dashboard
      ↓
  PUT /api/stadiums/:id/incidents/:incId
      ├─ Update incident status (RESPONDING → RESOLVED)
      └─ Auto-sync related task (IN_PROGRESS → COMPLETED)
```

---

## 4️⃣ ASSUMPTIONS MADE

### **Operational Assumptions**

1. **Real-Time Data Freshness**
   - Facility status (queue length, wait times) are updated by on-ground IoT sensors/staff every 1–5 minutes
   - Crowd density is derived from ticket scanner and occupancy sensors
   - Weather/traffic are external API integrations (assumed available)

2. **Single Stadium State in Memory**
   - Pre-seeded with 3 demo stadiums (MetLife, Estadio Azteca, SoFi)
   - Modifications are in-memory only (no persistent database)
   - **Assumption:** For production, replace with MongoDB/PostgreSQL integration

3. **API Key Availability**
   - `GEMINI_API_KEY` environment variable must be set
   - Falls back to local rule-based logic if not configured (graceful degradation)
   - **Assumption:** Valid API key is provided via `.env` file or deployment secrets

4. **Language Coverage**
   - Supported languages: English, Spanish, French, German, Arabic, Portuguese
   - Fallback dictionary covers 100+ UI labels
   - **Assumption:** Requests with unsupported languages return English response

5. **Security Model**
   - Input sanitization removes HTML tags (mitigates XSS)
   - Max length enforcement prevents buffer overflow-like attacks
   - **Assumption:** HTTPS/TLS is configured in production (not enforced here)
   - **Assumption:** API authentication (OAuth2/JWT) is handled by API Gateway (not in this code)

6. **Incident Severity & Response**
   - Medical incidents automatically trigger highest priority (confidence 98%)
   - Maintenance incidents are lower priority but still tracked
   - **Assumption:** All incidents are tracked and routable to responsible teams

7. **Predictive Analytics Accuracy**
   - Crowd inflow curves are simulated based on typical match-day patterns
   - Scaling factors apply based on stadium congestion (HIGH → 1.4x multiplier)
   - **Assumption:** Historical data would refine these models in production

8. **Facility Data Completeness**
   - Each facility must have: name, category, status, capacity, queue metrics
   - Optional: foodDetails (vegetarian, halal, popular items)
   - **Assumption:** Incomplete facility data will use sensible defaults (0 wait time, OPERATIONAL status)

9. **Staff Task Routing**
   - Tasks are assigned to roles (VOLUNTEER, STADIUM_STAFF) based on incident category
   - No user authentication; assumes staff access is gated at API gateway layer
   - **Assumption:** Task assignment logic in production would check staff availability/location

10. **Geographic Accuracy**
    - Latitude/longitude are stored but not used for geospatial queries
    - **Assumption:** Frontend maps (GIS) would use these for visualization

11. **Multilingual Translation**
    - Dynamic translation via Gemini API (preferred)
    - Fallback to pre-built offline dictionary (comprehensive but potentially incomplete)
    - **Assumption:** New UI labels added to dictionary will require manual updates

12. **Development vs. Production Mode**
    - `NODE_ENV !== "production"` uses Vite dev server middleware
    - Production serves static assets from `/dist` directory
    - **Assumption:** Build pipeline runs `vite build` before deployment

---

## 🚀 Getting Started

### **1. Install Dependencies**
```bash
npm install
```

### **2. Configure Environment**
```bash
# Create .env file
cat > .env << EOF
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
NODE_ENV=development
EOF
```

### **3. Run Development Server**
```bash
npm run dev
# Server starts at http://localhost:3000
```

### **4. Test Chat Endpoint**
```bash
curl -X POST http://localhost:3000/api/gemini/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Which gate has the shortest queue?",
    "stadiumId": "stadium-metlife",
    "language": "en"
  }'
```

### **5. Test Decision Support**
```bash
curl -X POST http://localhost:3000/api/gemini/decision-support \
  -H "Content-Type: application/json" \
  -d '{ "stadiumId": "stadium-metlife", "language": "en" }'
```

---

## 📊 Key Features

✅ **Real-time Stadium Operations Dashboard**  
✅ **Multi-language AI Assistant** (English, Spanish, French, German, Arabic, Portuguese)  
✅ **Incident Tracking & Auto-Response Workflows**  
✅ **Predictive Analytics** (crowd forecasts, risk factors)  
✅ **Staff Task Management** (CRUD operations, status lifecycle)  
✅ **Facility Queue Monitoring** (wait times, congestion levels)  
✅ **Graceful API Fallback** (local rule-based logic when AI unavailable)  
✅ **XSS & Input Validation** (security hardening)  
✅ **Express.js + TypeScript** (type-safe, production-ready)  

---

## 🔐 Security Considerations

- **Input Sanitization:** Removes HTML tags; enforces max length
- **XSS Prevention:** All user inputs filtered before processing
- **No SQL/NoSQL Injection:** In-memory data model (no direct database queries)
- **API Rate Limiting:** Recommended at reverse proxy/API gateway layer
- **Authentication:** Assumed to be handled upstream (OAuth2/JWT)
- **HTTPS/TLS:** Must be enforced in production deployment

---

## 📝 License

Apache License 2.0 (SPDX-License-Identifier)

---

## 👨‍💻 Author

**Developed by:** Shashank (shashankjicm06-del)  
**Repository:** `FIFA_StadiumGPT`  
**Last Updated:** July 2026

---

## 🙋 Support & Questions

For issues, feature requests, or questions about the architecture, please open an issue in the repository.
