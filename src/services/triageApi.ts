import { TriageResult, Patient, HospitalCapacity } from '../types';
import {
  savePatientToFirestore,
  updatePatientStatusInFirestore,
  updateHospitalCapacityInFirestore,
} from '../firebase/config';

export const INITIAL_CAPACITY: HospitalCapacity = {
  waitingRoomOccupancy: 21,
  waitingRoomMaxCapacity: 25,
  secondaryZoneOccupancy: 8,
  triageBedsOccupied: 7,
  totalTriageBeds: 10,
  congestionLevel: 'High',
  lastUpdated: new Date().toISOString(),
};

export const SEED_PATIENTS: Patient[] = [
  {
    id: 'pt-001',
    patientName: 'Robert Vance',
    phone: '+1 (555) 234-8901',
    age: 62,
    symptoms: 'Crushing retrosternal chest pain radiating to left jaw, diaphoresis, dyspnea for 20 mins',
    triage_urgency: 'Emergency',
    wait_strategy: 'Report Directly to Triage Bed',
    recommended_arrival_time: 'IMMEDIATE ENTRY - Zero waiting room transit',
    congestion_mitigation_action: 'Direct escort bypass through Red Bay Entrance A to Bed ER-02. Main lobby bypassed entirely.',
    queue_token_message: 'CRITICAL ALERT: Bypass waiting room immediately. Enter via Ambulance Red Bay to Bed ER-02. Trauma team is waiting.',
    status: 'in_bed',
    assignedBedOrZone: 'Direct Resuscitation Bed ER-02',
    queueToken: 'EM-01',
    estimatedWaitMinutes: 0,
    vitals: { heartRate: 118, bpSystolic: 165, bpDiastolic: 102, o2Sat: 91, painScale: 9 },
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'pt-002',
    patientName: 'Elena Rostova',
    phone: '+1 (555) 987-6543',
    age: 28,
    symptoms: 'Mild erythematous skin rash on forearm after gardening, slight itching, no airway swelling',
    triage_urgency: 'Non-Urgent',
    wait_strategy: 'Divert to Telehealth',
    recommended_arrival_time: 'Virtual Consultation in 10 minutes (At Home)',
    congestion_mitigation_action: '100% waiting room avoidance. Diverted to on-call telemedicine provider to prevent physical hospital crowding.',
    queue_token_message: 'Save time and avoid crowded waiting areas! Tap here to start your video consult now: https://telehealth.hospital.org/v/pt-002',
    status: 'diverted_telehealth',
    assignedBedOrZone: 'Virtual Telehealth Hub',
    queueToken: 'TH-44',
    estimatedWaitMinutes: 10,
    vitals: { heartRate: 74, bpSystolic: 118, bpDiastolic: 76, o2Sat: 99, painScale: 2 },
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 'pt-003',
    patientName: 'Marcus Chen',
    phone: '+1 (555) 432-1098',
    age: 34,
    symptoms: 'Inversion ankle sprain 2 hours ago playing basketball. Edema present, can bear partial weight.',
    triage_urgency: 'Non-Urgent',
    wait_strategy: 'Wait at Home',
    recommended_arrival_time: 'Return in 50 minutes at 3:30 PM',
    congestion_mitigation_action: 'Remote queue hold. Main waiting room at 84% capacity. Patient notified to rest foot elevated at home.',
    queue_token_message: 'Queue Token #N-382: Your spot is reserved. Please stay home or in vehicle. Staggered arrival at 3:30 PM. We text you 10m before X-ray ready.',
    status: 'waiting_remote',
    assignedBedOrZone: 'Digital Remote Queue / Home',
    queueToken: 'N-382',
    estimatedWaitMinutes: 50,
    vitals: { heartRate: 82, bpSystolic: 124, bpDiastolic: 80, o2Sat: 98, painScale: 5 },
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'pt-004',
    patientName: 'Sarah Jenkins',
    phone: '+1 (555) 789-0123',
    age: 42,
    symptoms: 'Deep knife laceration to left palm while prepping dinner. Controlled with pressure, requires sutures.',
    triage_urgency: 'Urgent',
    wait_strategy: 'Wait in Secondary Zone',
    recommended_arrival_time: 'Staggered Entry window: 2:45 PM (in 15 mins)',
    congestion_mitigation_action: 'Direct to Minor Trauma Annex Wing B to prevent hallway standing in main lobby.',
    queue_token_message: 'Urgent Token #U-119: Proceed to Courtyard Annex Wing B. Digital pager will beep when minor suture suite is sanitized.',
    status: 'arrived',
    assignedBedOrZone: 'Minor Trauma Annex Wing B',
    queueToken: 'U-119',
    estimatedWaitMinutes: 15,
    vitals: { heartRate: 90, bpSystolic: 130, bpDiastolic: 84, o2Sat: 98, painScale: 6 },
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

export async function requestAiTriage(params: {
  patientName: string;
  age: number;
  phone?: string;
  symptoms: string;
  vitals?: {
    heartRate?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    o2Sat?: number;
    painScale?: number;
  };
  hospitalCapacity?: HospitalCapacity;
}): Promise<TriageResult> {
  const response = await fetch('/api/triage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to evaluate triage: ${response.statusText}`);
  }

  const data: TriageResult = await response.json();
  return data;
}

export async function savePatientRecord(patient: Patient): Promise<void> {
  try {
    await savePatientToFirestore(patient);
  } catch (e) {
    console.warn('Saved locally, Firestore sync deferred:', e);
  }
}

export async function updatePatientStatus(patientId: string, updates: Partial<Patient>): Promise<void> {
  try {
    await updatePatientStatusInFirestore(patientId, updates);
  } catch (e) {
    console.warn('Updated locally, Firestore sync deferred:', e);
  }
}

export async function updateCapacity(capacity: HospitalCapacity): Promise<void> {
  try {
    await updateHospitalCapacityInFirestore(capacity);
  } catch (e) {
    console.warn('Updated capacity locally, Firestore sync deferred:', e);
  }
}
