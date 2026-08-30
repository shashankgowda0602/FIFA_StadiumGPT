# StadiumGPT OS • FIFA World Cup Digital Venue Platform

StadiumGPT OS is an advanced, high-performance, full-stack digital twin and operational venue management command center tailored for the FIFA World Cup 2026. It integrates interactive spatial mapping (GIS), predictive crowd simulation, an intelligent AI-powered decision support assistant, and an automated system compliance suite.

---

### view website: https://ais-pre-t4grgocsdsbbspdtnrqvv5-129129605209.asia-southeast1.run.app

---

## 🏆 System Profile & Analysis

### 1. Chosen Vertical: Smart Stadium Venue Operations & Crowd Management
The selected vertical is **Smart Stadium Event Operations and Crowd Intelligence** for high-capacity sporting events (e.g., FIFA World Cup 2026 matches hosted at venues like MetLife Stadium or SoFi Stadium). 
Large-scale tournaments present complex operational challenges: sudden crowd bottlenecks, real-time security threats, catering demand fluctuations, and language accessibility barriers. StadiumGPT OS serves as a centralized operating system (OS) bridging stadium command centers with on-the-ground staff and fans.

---

### 2. Approach & Logic

Our engineering approach centers around a **Digital Twin Paradigm** that maps real-time physical stadium data into a responsive, interactive virtual layout. 

```
               ┌──────────────────────────────────────────────────┐
               │              STADIUM OPERATOR PORTAL             │
               └───────────────────────┬──────────────────────────┘
                                       │ Real-time Dispatch
                                       ▼
  ┌───────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
  │  Interactive GIS Map  │◄──┤   Operational Server   ├──►│  AI Decision Support   │
  │  • SVG Node Routing   │   │   • Express API        │   │  • Gemini API Proxy    │
  │  • Walk Simulations   │   │   • Incident Registry  │   │  • Context RAG Engine  │
  └───────────────────────┘   └────────────────────────┘   └────────────────────────┘
```

#### Key Logic Components:
- **Spatial Topology Engine**: Stadium layouts are represented as connected topological nodes (entry gates, security points, concession zones, restrooms, seating bowls).
- **Dynamic Routing & Pathfinding**: Custom path computation calculates paths around the stadium perimeter and pitch. The routing algorithm dynamically adjusts estimated transit times based on **real-time crowd density metrics** and warns operators or fans if proposed paths cross active hazard or closed-facility zones.
- **Context-Augmented RAG Pipeline**: Rather than relying on generic model training, the assistant relies on a **Retrieval-Augmented Generation (RAG)** approach. The chat engine retrieves current stadium metrics (gate congestion, active incidents, food stall wait times) and injects this data into the prompt context to ensure precise, factual operational replies.
- **Closed-Loop Safety Dispatch**: Alerts, tasks, and incidents are coupled. An incident logged (e.g., Gate A congestion) automatically updates queue states on the map and prompts the generation of corresponding staff tasks.

---

### 3. How the Solution Works

#### A. Interactive GIS Stadium Map & Live Crowd Router
- **Interactive Layers**: Visualizes distinct spatial categories (Gates, Concessions, Restrooms, First Aid, Security Controls, Transit Hubs) on a lightweight SVG map canvas.
- **Transit Walk Simulator**: When a route is planned, a custom walk simulator animates a transit vector on the map in real-time, matching the calculated transit speeds.
- **Density Adjuster**: Incorporates live stadium-wide crowd density (Low, Moderate, High, Extreme) to dynamically scale pedestrian transit speeds and calculate precise queue/travel times.
- **Sector Hazard Overlays**: Automatically flags hazard points, closed facilities, or active incident zones directly in the route directions panel.

#### B. Live Predictive Analytics & Configurator
- **Dynamic Capacity Metrists**: Allows operators to set maximum capacities, view ticketing trends, and adjust crowd density parameters.
- **Incident Alerts Panel**: Tracks metrics like general crowd level, concession queues, and parking availability, with triggers for active emergency alerts and severe weather notifications.

#### C. Closed-Loop Task Board
- **Incident Dispatch Engine**: Aggregates live stadium issues (e.g., ticket scanner failures, medical distress, overcrowding) categorized by severity (Info, Low, Medium, High, Critical).
- **Staff Assignment Pipelines**: Generates specific, trackable duties linked to active incidents, allowing dispatchers to assign priority, delegate to departments, and track completion states.

#### D. Context-Aware AI Helper
- **Stadium-State Prompting**: Generates assistant context by feeding active database states (available facilities, incident rosters, crowd delays) to the Gemini model.
- **Interactive Fast-Actions**: Prompts users with suggested quick-actions, such as "Locate shortest gate queue" or "Request medical alert details."

#### E. System Compliance & Testing Suite
- **Input Sanitization Guard**: A robust regular expression parser (`sanitizeString`) filters scripts and tags, protecting endpoints against XSS injections.
- **Boundary Validation**: Rejects out-of-bounds metrics (e.g. capacity limits outside 1,000–200k, titles over 80 chars) with structured HTTP responses.
- **WCAG 2.1 Accessibility Suite**:
  - *Contrast mode*: Shifts colors to high-contrast borders and deep text palettes.
  - *Operational Audio Companion*: Features built-in speech synthesis to read live console logs aloud, aiding visually impaired operators in dynamic conditions.
  - *Semantic ARIA landmarks*: Implements proper tab index and key events for keyboard navigation.

---

### 4. Core Operational Assumptions
- **Grid Coordinates**: Stadium layouts are modeled on a precise `x, y` relative percentage grid (0 to 100 scale) rather than absolute GPS coordinates. This ensures that the GIS digital-twin component remains highly portable and renders without relying on heavy external mapping library overheads.
- **Pedestrian Transit Speeds**: Base walking speed is assumed to be 1.4 meters per second. This speed is scaled down dynamically based on crowd density multipliers (Moderate = 80%, High = 50%, Extreme = 20%).
- **Role-Based Access Control (RBAC)**: Role assumptions (Administrator, Staff, Event Security, Guest) are tracked via reactive state variables in the operator session to enable immediate interface switching during demonstrations.
- **Web Speech Engine**: It is assumed that the operator’s web browser supports the modern Web Speech Synthesis API for audio output. If unsupported, the console logs the telemetry silently without crashing.

---

## 🛠️ Full-Stack Technical Architecture

### Frontend (Client-side)
- **Vite + React (TypeScript)**: Powers responsive user-interfaces, structured type interfaces, and real-time interactive mapping.
- **Tailwind CSS**: Implements the signature **Slate & Gold theme**, providing a high-contrast aesthetic suitable for control room environments.
- **Lucide Icons**: Integrates consistent visual iconography for facilities, security, and alerts.

### Backend (Server-side)
- **Express.js API Node**: Operates as the central coordinator for live stadium configurations, incident databases, and the AI agent:
  - `/api/stadiums` (Saves, updates, and fetches dynamic stadium maps)
  - `/api/incidents` (Registers active incidents and alerts)
  - `/api/tasks` (Dispatches tasks directly to staff)
  - `/api/chat` (Proxies requests to the Gemini API securely, protecting environment keys from browser exposure)

---

## 🚀 Getting Started

### Prerequisite Environment
Create a `.env` file in the root directory mirroring `.env.example`:
```env
GEMINI_API_KEY=your_confidential_gemini_api_key_here
```

### Installation
Retrieve dependencies from the package registry:
```bash
npm install
```

### Start Local Development Server
Boot up the full-stack development environment:
```bash
npm run dev
```
The developer server binds securely to host `0.0.0.0` on port `3000`.

### Production Compilation
Build optimized client-side assets and compile the Express backend into a bundle:
```bash
npm run build
```
This outputs client-side assets to `dist/` and packages the Express backend into a single `dist/server.cjs` via esbuild.

### Production Execution
Start the production-ready server:
```bash
npm run start
```

---

*StadiumGPT OS • Authorized Operator Console • Secure Session • FIFA World Cup Digital Venue Platform*
