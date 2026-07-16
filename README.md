# StadiumGPT OS • FIFA World Cup Digital Venue Platform

StadiumGPT OS is an advanced, high-performance, full-stack digital twin and operational venue management command center tailored for any FIFA World Cup matches. It combines interactive spatial mapping (GIS), predictive crowd simulation, an intelligent AI-powered decision support assistant, and an automated system compliance suite.

---

## 🌟 Key Functional Pillars

### 1. Interactive GIS Stadium Map & Live Crowd Router
- **Interactive Stadium Map**: Visualizes stadium sectors, entry gates, seating bowls, food stalls, restrooms, and medical centers over an dynamic, responsive SVG blueprint layout.
- **Start-to-Destination Pathing**: Allows operators and spectators to select any custom origin and destination (e.g., Gate A to Concession B). It instantly calculates paths around the pitch avoiding spectator zones.
- **Dynamic Walk Simulator**: Runs real-time stepping path simulations on the map canvas to represent transit routes and live crowd bottlenecks.
- **Congestion and Speed Adjuster**: Incorporates live stadium-wide crowd density (Low, Moderate, High, Extreme) to scale pedestrian walk speeds and calculate precise transit times.
- **Sectored Safety Warnings**: Automatically detects and flags closed facilities, high-risk bottlenecks, or emergency zones directly within the step-by-step route directions drawer.

### 2. Live Analytics & Configurator
- **Dynamic Capacity Metrists**: Configures maximum seating capacities, current ticket sales, and spectator densities.
- **Real-time Incident Alerts**: Tracks general, safety, and parking occupancy metrics. Includes triggers for live emergency warnings, severe weather alerts, and congested zones.

### 3. Closed-Loop Incident Task Center
- **Incident Dispatch Engine**: Tracks active stadium incidents (e.g., gate overflows, medical issues, ticket reader failures) grouped by severity.
- **Staff Task Board**: Automatically bridges incident states with actionable staff duties, permitting dispatchers to delegate task priority levels and track task status updates in real-time.

### 4. Interactive RAG Chatbot
- **Context-Aware Assistance**: Delivers a live assistant backed by stadium status parameters (e.g., open gates, concession menus, facility queues).
- **Interactive Suggestions**: Prompts users with fast operational quick-actions to locate low-wait gates, request medical status, or lookup food details.

### 5. Global Compliance & Testing Suite
- **Security Defenses**: Simulates security validations, input length limits (e.g., titles truncated to 80 chars, capacity constrained to 1k–200k), HTML tag escaping (blocking XSS injection payloads), and tests environment secret boundary isolation.
- **Efficiency Auditing**: Benchmarks API query latencies to verify sub-250ms responses, evaluates Hook dependencies to prevent infinite re-render loops, and measures UI memory footprint.
- **Accessibility (WCAG 2.1) Dashboard**:
  - *WCAG High Contrast Mode*: Instantly adjusts visual borders and container contrast.
  - *Operational Audio Companion*: Features speech-synthesis audio triggers to read terminal diagnostics out loud for visually impaired control center operators.
  - *Semantic ARIA landmarks*: Implements tabIndex navigation hooks and button-roles on active SVG elements.

---

## 🛠️ Full-Stack Technical Architecture

### Frontend (Client-side)
- **Vite + React (TypeScript)**: Delivers ultra-responsive performance, typed state interfaces, and dynamic components.
- **Tailwind CSS**: Powers custom responsive interfaces, including a specialized **Aesthetic Gold/Slate Theme** and animate utility classes (e.g., `.animate-route-flow`, `.animate-pulse-gold`).
- **Lucide Icons**: Integrates consistent vector representations for stadium utilities.

### Backend (Server-side)
- **Express.js API Node**: Coordinates live operational endpoints:
  - `/api/stadiums` (GET/POST/PATCH stadium layout profiles and live crowd statuses)
  - `/api/incidents` (GET/POST active stadium incidents)
  - `/api/tasks` (GET/POST task dispatch logs)
  - `/api/chat` (Secure server-side Gemini API proxy)
- **Input Sanitization Guard**: Intercepts server-side inputs via a regular expression parser (`sanitizeString`), stripping malicious `<script>` components and HTML payloads to secure endpoints against Reflected/Stored Cross-Site Scripting (XSS).
- **Boundary Validation**: Rejects unphysical coordinate values or out-of-range capacity variables with descriptive 400 Bad Request statuses.

---

## 🚀 Development & Deployment

### Prerequisite Environment
Create a `.env` file in the root of the project using the structure documented in `.env.example`:
```env
GEMINI_API_KEY=your_confidential_gemini_api_key_here
```

### Installation
Ensure all dependencies are retrieved from the registry:
```bash
npm install
```

### Run Local Development Server
Execute the custom dev compilation flow:
```bash
npm run dev
```
*The operational console maps local traffic securely onto port `3000` via Host `0.0.0.0`.*

### Compilation and Build
Compiles the application and generates the server bundle using Vite and esbuild:
```bash
npm run build
```
This produces optimized production assets under `dist/` and compiles the backend into `dist/server.cjs` for high-speed, self-contained startup.

### Production Execution
Spins up the compiled application:
```bash
npm run start
```



### Real-Time Operations Flow
┌─────────────────────────────────────────────────────────────────┐
│  OPERATOR UPDATES STADIUM STATE (Crowd Density, Weather, etc.)  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  API: PUT /stadiums   │
         │  {crowdDensity: HIGH} │
         └───────────┬───────────┘
                     │
                     ↓
    ┌────────────────────────────────────┐
    │ Express Server: Validates & Updates│
    │ In-memory Stadium State            │
    └────────────┬───────────────────────┘
                 │
                 ↓
    ┌─────────────────────────────────────┐
    │ Recalculates walk times, queues,    │
    │ triggers predictive models          │
    └────────────┬────────────────────────┘
                 │
                 ↓
    ┌──────────────────────────────────────┐
    │ Frontend receives state update,      │
    │ re-renders map, analytics, alerts    │
    │ Notification feed updated            │
    └──────────────────────────────────────┘

---

*StadiumGPT OS • Authorized Operator Console • Secure Session • FIFA World Cup Digital Venue Platform*
