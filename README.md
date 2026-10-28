# Smart Hospital Congestion Control AI

AI-driven triage, dynamic arrival dispersion, and real-time remote queue management to eliminate hospital waiting room bottlenecks.

## Overview

Emergency departments do not fail because of a lack of beds alone. They fail because demand arrives in unpredictable bursts, low-acuity patients occupy scarce triage space, and staff have no unified, real-time view of capacity. The result is crowded waiting rooms, long waits, patients leaving without being seen, hallway care, staff burnout, and higher infection risk.

Smart Hospital Congestion Control AI turns every patient check-in into an intelligent flow decision. It combines patient-reported symptoms and vitals with live hospital capacity, uses Google Gemini to classify acuity and recommend a care pathway, and disperses non-urgent arrivals away from the physical waiting room. Emergency cases are routed directly to a resuscitation bed.

The platform includes a Flutter patient app, a staff command center, Firebase Authentication, Cloud Firestore, and an Express triage API with a deterministic clinical fallback engine.

## The Problem

- Patient arrivals are unpredictable, creating peak congestion that outpaces staffing.
- Low-acuity cases consume triage space needed for emergencies.
- Waiting rooms and bed availability are tracked separately, so staff lack one operational picture.
- Non-urgent patients sit in crowded rooms when they could wait at home or use telehealth.
- Congestion increases walkouts, delays emergency care, and contributes to staff burnout.

## The Solution

1. Patients check in from the Flutter app with symptoms, age, phone number, and optional vitals.
2. The API combines that data with live waiting-room occupancy, triage bed usage, and congestion level.
3. Gemini returns a structured decision: urgency tier, wait strategy, arrival window, congestion-mitigation action, and a patient-facing queue token message.
4. Emergency patients bypass the waiting room and go directly to a triage or resuscitation bed.
5. Urgent patients are routed to a secondary assessment zone with a staggered arrival window.
6. Non-urgent patients are diverted to telehealth or given a remote queue slot and told when to arrive.
7. Staff manage the live queue and capacity from a role-based command center, which feeds updated occupancy back into the next AI decision.

## How It Works

```text
Patient check-in (Flutter app)
        |
        |  symptoms, age, phone, vitals
        v
Express API  ------------------------------->  Google Gemini
        |                                          |
        |                                          |  structured JSON decision
        |  <---------------------------------------+
        |
        +--> Digital queue token / arrival window / telehealth link
        |
        +--> Cloud Firestore  <-->  Staff command center
                    ^
                    |
        live capacity feedback loop (occupancy, beds, congestion level)
```

### Safety guardrails

- Non-urgent patients are never advised to sit in the main waiting room.
- Emergency cases are routed directly to a triage bed and bypass reception.
- Gemini output must match a strict JSON schema.
- A 4-second timeout falls back to a deterministic clinical rule engine, so triage never stops.
- Clinicians can override any AI recommendation.
- Firestore security rules enforce role-based access.

> This project is a decision-support prototype, not a diagnostic device. It must be clinically validated and reviewed for local regulatory compliance before use with real patient data.

## Features

- AI-assisted triage using Google Gemini
- Four care-pathway strategies: direct-to-bed, secondary zone, telehealth, wait at home
- Staggered arrival windows and digital queue tokens
- Emergency direct-to-bed protocol
- Deterministic rule-based fallback for AI outages and timeouts
- Live patient queue for staff
- Real-time capacity management with Low / Moderate / High / Critical congestion levels
- Seven-role access control from patient guest to system administrator
- Firestore security rules for patients, capacity, and user records
- Flutter client for Android, iOS, and web
- Firebase Authentication and Cloud Firestore integration

## Tech Stack

| Layer | Technologies |
| --- | --- |
| AI | Google Gemini via `@google/genai`, Google AI Studio |
| Authentication | Firebase Authentication |
| Data | Cloud Firestore, Firestore Security Rules |
| Hosting and infrastructure | Firebase Hosting, Google Cloud Run, Render |
| Mobile client | Flutter, Dart, Provider, HTTP, Firebase Core/Auth/Firestore |
| API | Node.js, Express, TypeScript/JavaScript, `tsx` |
| Web tooling | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Integrations (planned) | SMS/WhatsApp notifications, telehealth providers, HL7/FHIR EHR feeds |

## Repository Layout

```text
.
├── backend/                    Express API (routes, controllers, services, models, config)
│   ├── app.cjs                 Backend entry point
│   ├── config/gemini.cjs       Gemini client initialization
│   ├── controllers/            Request handling
│   ├── services/               AI triage and rule-based fallback
│   ├── models/                 Triage data model
│   └── routes/                 API routes
├── flutter_app/                Flutter client
│   └── lib/
│       ├── screens/            Auth, check-in, queue pass, staff dashboard, capacity, users
│       ├── services/           Firebase Auth, Firestore, and triage API services
│       └── models/             Patient, user, and role models
├── server.ts                   Combined Express API and Vite web prototype entry
├── firebase-blueprint.json     Patient and hospital capacity data model
├── firestore.rules             Role-based Firestore security rules
├── firebase.json               Firebase Hosting and Firestore configuration
├── render.yaml                 Render deployment configuration
├── package.json                Web/API dependencies and scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Flutter 3.2 or newer with Dart 3.2 or newer
- A Firebase project
- A Gemini API key from Google AI Studio

### 1. Clone the repository

```bash
git clone https://github.com/Marcelofury/Smart-Hospital-Congestion-Control-AI.git
cd Smart-Hospital-Congestion-Control-AI
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Set your Gemini key in `.env`:

```env
GEMINI_API_KEY="your-gemini-api-key"
```

The backend also supports a local `backend/.env`; copy `backend/.env.example` if you prefer to keep API configuration there. Never commit `.env` files.

### 3. Install and run the API

```bash
npm install
node backend/app.cjs
```

The API runs on `http://localhost:3000`.

- `GET /api/health` returns service status.
- `POST /api/triage` returns a triage and flow decision.

### 4. Run the Flutter app

```bash
cd flutter_app
flutter pub get
flutter run
```

The client is pre-wired to the Firebase project in `lib/firebase_options.dart`. To use your own project, run:

```bash
flutterfire configure
```

The triage API base URL is set in `lib/screens/patient_check_in.dart`. Update `apiBaseUrl` to point at your local API or deployed backend.

### 5. Deploy Firebase rules and hosting

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

### Backend deployment on Render

`render.yaml` defines a Render web service. Set `GEMINI_API_KEY` in the Render dashboard as a secret environment variable. Free-tier instances may cold start after inactivity.

## API

### `POST /api/triage`

Request:

```json
{
  "patientName": "Taylor Reed",
  "age": 32,
  "phone": "+1 555 0100",
  "symptoms": "chest pain and shortness of breath",
  "vitals": {
    "heartRate": 128,
    "bpSystolic": 98,
    "bpDiastolic": 64,
    "o2Sat": 88,
    "painScale": 9
  },
  "hospitalCapacity": {
    "waitingRoomOccupancy": 22,
    "waitingRoomMaxCapacity": 25,
    "triageBedsOccupied": 9,
    "totalTriageBeds": 10,
    "congestionLevel": "Critical"
  }
}
```

Response:

```json
{
  "triage_urgency": "Emergency",
  "wait_strategy": "Report Directly to Triage Bed",
  "recommended_arrival_time": "IMMEDIATE ENTRY - Zero waiting room transit",
  "congestion_mitigation_action": "Bypass main reception completely and escort the patient directly to the resuscitation bed.",
  "queue_token_message": "EMERGENCY ALERT: Do not enter the waiting room. Proceed directly to the resuscitation bay.",
  "clinical_summary": "Critical acuity detected. Direct-to-bed protocol engaged.",
  "assigned_bed_or_zone": "Direct Resuscitation Bed ER-03",
  "estimated_wait_minutes": 0
}
```

### `GET /api/health`

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

## Triage Policy

| Urgency | Default pathway |
| --- | --- |
| Emergency | Direct to triage or resuscitation bed, bypass the waiting room |
| Urgent | Secondary assessment zone with a staggered 15-25 minute arrival |
| Non-Urgent | Telehealth diversion or remote queue with a 45-75 minute arrival |

The deterministic fallback applies the same policy when Gemini is unavailable. It flags emergencies using symptom keywords and vitals such as oxygen saturation below 90%, heart rate outside 45-140, and high pain scores.

## Roles and Permissions

| Role | Capabilities |
| --- | --- |
| `patient_guest` | Register, check in, and view their own queue pass |
| `patient_registered` | Same as guest, with a persistent patient profile |
| `triage_nurse` | View all patients, update status, override triage, assign beds |
| `clinician` | View all patients, update status, access the command dashboard |
| `charge_nurse` | All triage-nurse capabilities plus capacity management, simulator access, and patient deletion |
| `hospital_admin` | Manage capacity, users, and all patient operations |
| `system_admin` | Full system configuration and administration |

## Data Model

Firestore collections:

- `/patients/{patientId}` — check-in, triage result, queue token, status, assigned zone or bed, estimated wait.
- `/hospital_capacity/{configId}` — waiting-room occupancy, maximum capacity, secondary-zone occupancy, triage beds in use, congestion level, last update time.
- `/users/{userId}` — profile, role, department, active status.

Schemas are documented in `firebase-blueprint.json` and enforced by `firestore.rules`.

## SDG Alignment

- **SDG 3 — Good Health and Well-being:** faster emergency access, safer waiting environments, and better use of clinical capacity.
- **SDG 9 — Industry, Innovation and Infrastructure:** resilient digital health infrastructure built on cloud and AI.
- **SDG 10 — Reduced Inequalities:** telehealth and remote queues widen access for patients with limited mobility, transport, or proximity to care.
- **SDG 11 — Sustainable Cities and Communities:** safer, less crowded health facilities and more resilient public services.

## Business Impact

Pilot targets:

- 40-60% lower peak waiting-room occupancy
- 25-35% fewer patients leaving without being seen
- 20-30% shorter perceived waits
- 15-25% better triage throughput

Revenue model:

- Per-emergency-department SaaS subscription
- Implementation and EHR integration fee
- Analytics add-on
- Telehealth partner revenue share

Buyers include hospitals, urgent care centers, clinics, and public health systems.

## Roadmap

- **Phase 1 (0-3 months):** single-emergency-department pilot, clinical advisory board, baseline metrics, nurse-reviewed triage concordance.
- **Phase 2 (3-6 months):** HL7/FHIR EHR integration, SMS/WhatsApp notifications, multilingual support, offline mode.
- **Phase 3 (6-12 months):** predictive arrival forecasting with Vertex AI, staffing and bed management, multi-site dashboard.
- **Phase 4 (12+ months):** HIPAA/GDPR compliance, security audit, clinical validation study, expansion to clinics and public health partners.

## Security and Privacy

- Firebase Authentication protects user identity.
- Firestore security rules restrict patient, capacity, and user records by role.
- AI requests contain only the data required for triage.
- No production PHI should be used in demos or development environments.
- A clinical safety review, penetration test, and local compliance assessment are required before real-world deployment.

## License

No open-source license has been specified. Contact the project team before reuse or redistribution.
