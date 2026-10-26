import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Check if real Gemini API key is provided
const rawKey = process.env.GEMINI_API_KEY;
const hasRealKey =
  Boolean(rawKey) &&
  rawKey !== 'MY_GEMINI_API_KEY' &&
  !rawKey!.includes('MY_GEMINI_API_KEY') &&
  rawKey!.length > 15;

// Initialize Gemini SDK with required telemetry header
const ai = hasRealKey
  ? new GoogleGenAI({
      apiKey: rawKey!,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export interface TriageEvaluation {
  triage_urgency: 'Emergency' | 'Urgent' | 'Non-Urgent';
  wait_strategy: 'Wait at Home' | 'Divert to Telehealth' | 'Report Directly to Triage Bed' | 'Wait in Secondary Zone';
  recommended_arrival_time: string;
  congestion_mitigation_action: string;
  queue_token_message: string;
  clinical_summary?: string;
  assigned_bed_or_zone?: string;
  estimated_wait_minutes?: number;
}

// Deterministic medical rule evaluation fallback (in case API key is missing or network times out)
function evaluateRuleBasedTriage(
  symptoms: string,
  age: number,
  vitals?: { heartRate?: number; bpSystolic?: number; bpDiastolic?: number; o2Sat?: number; painScale?: number },
  hospitalCapacity?: { waitingRoomOccupancy: number; waitingRoomMaxCapacity: number }
): TriageEvaluation {
  const lower = symptoms.toLowerCase();
  const currentOccupancy = hospitalCapacity?.waitingRoomOccupancy ?? 18;
  const maxCapacity = hospitalCapacity?.waitingRoomMaxCapacity ?? 25;
  const occupancyRatio = currentOccupancy / Math.max(1, maxCapacity);

  const isEmergency =
    lower.includes('chest pain') ||
    lower.includes('heart attack') ||
    lower.includes('cannot breathe') ||
    lower.includes('shortness of breath') ||
    lower.includes('stroke') ||
    lower.includes('facial droop') ||
    lower.includes('unconscious') ||
    lower.includes('bleeding uncontrollably') ||
    lower.includes('arterial') ||
    lower.includes('severe head injury') ||
    lower.includes('anaphylaxis') ||
    (vitals?.o2Sat && vitals.o2Sat < 90) ||
    (vitals?.heartRate && (vitals.heartRate > 140 || vitals.heartRate < 45)) ||
    (vitals?.painScale && vitals.painScale >= 9 && (lower.includes('abdomen') || lower.includes('chest')));

  const isUrgent =
    lower.includes('fracture') ||
    lower.includes('broken') ||
    lower.includes('deep cut') ||
    lower.includes('laceration') ||
    lower.includes('high fever') ||
    lower.includes('vomiting blood') ||
    lower.includes('asthma') ||
    lower.includes('severe pain') ||
    (vitals?.painScale && vitals.painScale >= 7);

  const now = new Date();

  if (isEmergency) {
    const bedId = `Direct Resuscitation Bed ER-0${Math.floor(Math.random() * 6) + 1}`;
    return {
      triage_urgency: 'Emergency',
      wait_strategy: 'Report Directly to Triage Bed',
      recommended_arrival_time: 'IMMEDIATE ENTRY - Zero waiting room transit',
      congestion_mitigation_action: `Bypass main reception completely. Immediate blue corridor escort to ${bedId}. Do not sit in waiting lobby.`,
      queue_token_message: `EMERGENCY ALERT: Do NOT enter the waiting room. Proceed directly through Red Bay Entrance A to ${bedId}. Rapid response team alerted.`,
      clinical_summary: 'Critical acuity detected. Direct-to-bed protocol engaged to prevent bottleneck.',
      assigned_bed_or_zone: bedId,
      estimated_wait_minutes: 0,
    };
  }

  if (isUrgent) {
    // If waiting room is crowded (>70%), divert to secondary observation zone or courtyard lounge
    const waitMins = occupancyRatio > 0.8 ? 25 : 15;
    const arrivalTime = new Date(now.getTime() + waitMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const strategy = occupancyRatio > 0.7 ? 'Wait in Secondary Zone' : 'Wait in Secondary Zone';
    const zone = occupancyRatio > 0.7 ? 'Rapid Assessment Annex Wing B' : 'Secondary Sub-Waiting Pavilion C';

    return {
      triage_urgency: 'Urgent',
      wait_strategy: strategy,
      recommended_arrival_time: `Staggered Entry window: ${arrivalTime} (in ${waitMins} mins)`,
      congestion_mitigation_action: `Guide patient to ${zone} to keep main ER waiting room at safe baseline. Dispense digital buzzer token.`,
      queue_token_message: `Urgent Care Token #U-${Math.floor(100 + Math.random() * 900)}: Main lobby is at ${Math.round(occupancyRatio * 100)}% capacity. Please proceed to ${zone}. Physician review expected at ${arrivalTime}.`,
      clinical_summary: 'Moderate to high acuity. Placed in secondary assessment stream to clear main triage bottlenecks.',
      assigned_bed_or_zone: zone,
      estimated_wait_minutes: waitMins,
    };
  }

  // NON-URGENT: CRITICAL RULE: NEVER advise to sit in the main waiting room!
  const isTelehealthEligible =
    lower.includes('rash') ||
    lower.includes('prescription') ||
    lower.includes('refill') ||
    lower.includes('mild cold') ||
    lower.includes('sore throat') ||
    lower.includes('follow-up') ||
    lower.includes('lab results');

  if (isTelehealthEligible) {
    return {
      triage_urgency: 'Non-Urgent',
      wait_strategy: 'Divert to Telehealth',
      recommended_arrival_time: 'Virtual Consultation in 15 minutes (At Home / Remote)',
      congestion_mitigation_action: 'Zero physical footprint diversion. Route patient directly to on-duty telehealth physician to eliminate physical hospital traffic completely.',
      queue_token_message: 'Hospital Congestion Alert: Save travel time! Tap your secure link to start a Virtual Care consultation right now. No hospital waiting room visit required: https://telehealth.hospital.org/v/queue-remote',
      clinical_summary: 'Low acuity, suitable for remote digital consultation. 100% waiting room reduction achieved.',
      assigned_bed_or_zone: 'Virtual Telehealth Hub',
      estimated_wait_minutes: 15,
    };
  }

  // Non-urgent requiring physical exam: Wait at home or remote queue
  const staggerMinutes = occupancyRatio > 0.8 ? 75 : 45;
  const scheduledTime = new Date(now.getTime() + staggerMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    triage_urgency: 'Non-Urgent',
    wait_strategy: 'Wait at Home',
    recommended_arrival_time: `Return in ${staggerMinutes} minutes at ${scheduledTime}`,
    congestion_mitigation_action: `Enforce remote queue. Physical waiting room capacity is currently at ${Math.round(occupancyRatio * 100)}%. Disperse arrival by holding queue slot digitally.`,
    queue_token_message: `Queue Token #N-${Math.floor(1000 + Math.random() * 9000)}: Your spot is reserved digitally. To protect your comfort and prevent crowded waiting areas, please remain at home or nearby. Arrive at ${scheduledTime}. We will text you 10 mins before your bed is ready.`,
    clinical_summary: 'Non-urgent physical triage. Dispersed to remote queue to prevent physical congestion.',
    assigned_bed_or_zone: 'Digital Remote Queue / Home',
    estimated_wait_minutes: staggerMinutes,
  };
}

// POST /api/triage endpoint
app.post('/api/triage', async (req, res) => {
  try {
    const { patientName, age, symptoms, vitals, hospitalCapacity } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
      return res.status(400).json({ error: 'Symptoms description is required' });
    }

    const currentOccupancy = hospitalCapacity?.waitingRoomOccupancy ?? 19;
    const maxCapacity = hospitalCapacity?.waitingRoomMaxCapacity ?? 25;
    const bedsOccupied = hospitalCapacity?.triageBedsOccupied ?? 8;
    const totalBeds = hospitalCapacity?.totalTriageBeds ?? 10;
    const congestionLevel = hospitalCapacity?.congestionLevel ?? 'High';

    if (!ai) {
      // Use intelligent clinical rule engine
      const evaluation = evaluateRuleBasedTriage(symptoms, Number(age) || 35, vitals, hospitalCapacity);
      return res.json(evaluation);
    }

    const prompt = `You are the Smart Hospital Congestion Control AI. Your primary mission is to minimize physical crowded waiting rooms, disperse patient arrivals, and direct traffic away from hospital bottlenecks.

Analyze incoming patient check-in details and prioritize keeping low-urgency patients OUT of the physical waiting room until their exact appointment slot, while flagging severe emergency cases for immediate direct bed entry.

CURRENT HOSPITAL CONGESTION STATUS:
- Physical Waiting Room Occupancy: ${currentOccupancy} / ${maxCapacity} patients
- Hospital Bottleneck Alert Level: ${congestionLevel}
- Immediate Emergency Triage Beds: ${bedsOccupied} / ${totalBeds} occupied

INCOMING PATIENT CHECK-IN DETAILS:
- Patient Name: ${patientName || 'Anonymous'}
- Age: ${age || 'Unknown'}
- Reported Symptoms: "${symptoms}"
- Vital Signs: Heart Rate: ${vitals?.heartRate || 'Normal'}, BP: ${vitals?.bpSystolic || 120}/${vitals?.bpDiastolic || 80}, O2 Sat: ${vitals?.o2Sat || 98}%, Pain Scale: ${vitals?.painScale || 3}/10.

CRITICAL POLICY RULES:
1. ALWAYS format your output in clean JSON with the following exact key structure:
{
  "triage_urgency": "<Emergency | Urgent | Non-Urgent>",
  "wait_strategy": "<Wait at Home | Divert to Telehealth | Report Directly to Triage Bed | Wait in Secondary Zone>",
  "recommended_arrival_time": "<Exact arrival window, e.g., 'Return in 45 minutes at 2:15 PM'>",
  "congestion_mitigation_action": "<Specific instruction to reduce hallway/waiting room crowding>",
  "queue_token_message": "<SMS update sent to patient explaining where to wait and when to arrive>"
}
2. ABSOLUTE RULE: If triage_urgency is "Non-Urgent", NEVER advise the patient to sit in the main waiting room. Provide a staggered check-in time or remote queue strategy to keep waiting room capacity below critical thresholds. Choose "Wait at Home" or "Divert to Telehealth".
3. For "Emergency" cases (e.g. chest pain, severe trauma, hypoxia, severe acute stroke symptoms), choose "Report Directly to Triage Bed" and "IMMEDIATE ENTRY". Direct them past the waiting room straight into a designated emergency bed.
4. For "Urgent" cases, if waiting rooms are crowded, direct to "Wait in Secondary Zone" or staggered 15-20 min arrival.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out')), 4000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            triage_urgency: {
              type: Type.STRING,
              description: 'Urgency tier: Emergency, Urgent, or Non-Urgent',
              enum: ['Emergency', 'Urgent', 'Non-Urgent'],
            },
            wait_strategy: {
              type: Type.STRING,
              description: 'Queue strategy to avoid waiting room congestion',
              enum: ['Wait at Home', 'Divert to Telehealth', 'Report Directly to Triage Bed', 'Wait in Secondary Zone'],
            },
            recommended_arrival_time: {
              type: Type.STRING,
              description: 'Exact arrival window, e.g., "Return in 45 minutes at 2:15 PM"',
            },
            congestion_mitigation_action: {
              type: Type.STRING,
              description: 'Specific instruction to reduce hallway/waiting room crowding',
            },
            queue_token_message: {
              type: Type.STRING,
              description: 'SMS update sent to patient explaining where to wait and when to arrive',
            },
          },
          required: [
            'triage_urgency',
            'wait_strategy',
            'recommended_arrival_time',
            'congestion_mitigation_action',
            'queue_token_message',
          ],
        },
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const text = response.text ? response.text.trim() : '';
    let parsed: TriageEvaluation;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = evaluateRuleBasedTriage(symptoms, Number(age) || 35, vitals, hospitalCapacity);
    }

    // Safety guard enforcement: If triage_urgency is Non-Urgent, NEVER allow waiting in main waiting room
    if (parsed.triage_urgency === 'Non-Urgent') {
      if (parsed.wait_strategy === 'Report Directly to Triage Bed' || parsed.wait_strategy as string === 'Wait in Waiting Room') {
        parsed.wait_strategy = 'Wait at Home';
        parsed.recommended_arrival_time = 'Staggered Arrival: Return in 45 minutes at ' + new Date(Date.now() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        parsed.congestion_mitigation_action = 'Enforce remote queue. Physical waiting room capacity is preserved for emergency triage.';
      }
    }

    return res.json(parsed);
  } catch (err: unknown) {
    console.error('Triage AI evaluation error:', err);
    // Fallback to deterministic rule engine
    const fallback = evaluateRuleBasedTriage(
      req.body?.symptoms || '',
      Number(req.body?.age) || 35,
      req.body?.vitals,
      req.body?.hospitalCapacity
    );
    return res.json(fallback);
  }
});

// Start Express server and bind Vite middlewares
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Hospital Congestion Control AI running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
