export type TriageUrgency = 'Emergency' | 'Urgent' | 'Non-Urgent';

export type WaitStrategy =
  | 'Wait at Home'
  | 'Divert to Telehealth'
  | 'Report Directly to Triage Bed'
  | 'Wait in Secondary Zone';

export interface TriageResult {
  triage_urgency: TriageUrgency;
  wait_strategy: WaitStrategy;
  recommended_arrival_time: string;
  congestion_mitigation_action: string;
  queue_token_message: string;
  clinical_summary?: string;
  assigned_bed_or_zone?: string;
  estimated_wait_minutes?: number;
}

export type PatientStatus =
  | 'registered'
  | 'waiting_remote'
  | 'diverted_telehealth'
  | 'en_route'
  | 'arrived'
  | 'in_bed'
  | 'completed';

export interface Patient {
  id: string;
  patientName: string;
  phone?: string;
  age: number;
  symptoms: string;
  triage_urgency: TriageUrgency;
  wait_strategy: WaitStrategy;
  recommended_arrival_time: string;
  congestion_mitigation_action: string;
  queue_token_message: string;
  status: PatientStatus;
  assignedBedOrZone: string;
  queueToken: string;
  estimatedWaitMinutes: number;
  vitals?: {
    heartRate?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    o2Sat?: number;
    painScale?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HospitalCapacity {
  waitingRoomOccupancy: number;
  waitingRoomMaxCapacity: number;
  secondaryZoneOccupancy: number;
  triageBedsOccupied: number;
  totalTriageBeds: number;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  lastUpdated: string;
}
