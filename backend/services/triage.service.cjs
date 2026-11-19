const { ai } = require('../config/gemini.cjs');
const { Type } = require('@google/genai');

function evaluateRuleBasedTriage(
  symptoms,
  age,
  vitals = {},
  hospitalCapacity = {}
) {
  const lower = symptoms.toLowerCase();
  const currentOccupancy = hospitalCapacity.waitingRoomOccupancy ?? 18;
  const maxCapacity = hospitalCapacity.waitingRoomMaxCapacity ?? 25;
  const occupancyRatio = currentOccupancy / Math.max(1, maxCapacity);

  const isEmergency =
    lower.includes('chest pain') ||
    lower.includes('heart attack') ||
    lower.includes('cannot breathe') ||
    lower.includes('shortness of breath') ||
    lower.includes('stroke') ||
    lower.includes('unconscious') ||
    lower.includes('bleeding uncontrollably') ||
    (vitals.o2Sat && vitals.o2Sat < 90) ||
    (vitals.heartRate && (vitals.heartRate > 140 || vitals.heartRate < 45));

  const isUrgent =
    lower.includes('fracture') ||
    lower.includes('broken') ||
    lower.includes('high fever') ||
    lower.includes('severe pain') ||
    (vitals.painScale && vitals.painScale >= 7);

  const now = new Date();

  if (isEmergency) {
    const bedId = 'Direct Resuscitation Bed ER-01';
    return {
      triage_urgency: 'Emergency',
      wait_strategy: 'Report Directly to Triage Bed',
      recommended_arrival_time: 'IMMEDIATE ENTRY - Zero waiting room transit',
      congestion_mitigation_action: 'Bypass main reception completely. Immediate escort to ' + bedId + '.',
      queue_token_message: 'EMERGENCY ALERT: Proceed directly to ' + bedId + '.',
      clinical_summary: 'Critical acuity detected. Direct-to-bed protocol engaged.',
      assigned_bed_or_zone: bedId,
      estimated_wait_minutes: 0,
    };
  }

  if (isUrgent) {
    const waitMins = occupancyRatio > 0.8 ? 25 : 15;
    const arrivalTime = new Date(now.getTime() + waitMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const zone = occupancyRatio > 0.7 ? 'Rapid Assessment Annex Wing B' : 'Secondary Sub-Waiting Pavilion C';

    return {
      triage_urgency: 'Urgent',
      wait_strategy: 'Wait in Secondary Zone',
      recommended_arrival_time: 'Staggered Entry window: ' + arrivalTime + ' (in ' + waitMins + ' mins)',
      congestion_mitigation_action: 'Guide patient to ' + zone + ' to keep main ER waiting room at safe baseline.',
      queue_token_message: 'Urgent Care Token: Please proceed to ' + zone + '.',
      clinical_summary: 'Moderate to high acuity. Placed in secondary assessment stream.',
      assigned_bed_or_zone: zone,
      estimated_wait_minutes: waitMins,
    };
  }

  const isTelehealthEligible =
    lower.includes('rash') ||
    lower.includes('prescription') ||
    lower.includes('mild cold') ||
    lower.includes('sore throat') ||
    lower.includes('follow-up');

  if (isTelehealthEligible) {
    return {
      triage_urgency: 'Non-Urgent',
      wait_strategy: 'Divert to Telehealth',
      recommended_arrival_time: 'Virtual Consultation in 15 minutes',
      congestion_mitigation_action: 'Route patient to on-duty telehealth physician.',
      queue_token_message: 'Virtual Care consultation available now.',
      clinical_summary: 'Low acuity, suitable for remote digital consultation.',
      assigned_bed_or_zone: 'Virtual Telehealth Hub',
      estimated_wait_minutes: 15,
    };
  }

  const staggerMinutes = occupancyRatio > 0.8 ? 75 : 45;
  const scheduledTime = new Date(now.getTime() + staggerMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    triage_urgency: 'Non-Urgent',
    wait_strategy: 'Wait at Home',
    recommended_arrival_time: 'Return in ' + staggerMinutes + ' minutes at ' + scheduledTime,
    congestion_mitigation_action: 'Enforce remote queue to prevent physical congestion.',
    queue_token_message: 'Queue Token reserved digitally. Arrive at ' + scheduledTime + '.',
    clinical_summary: 'Non-urgent physical triage. Dispersed to remote queue.',
    assigned_bed_or_zone: 'Digital Remote Queue / Home',
    estimated_wait_minutes: staggerMinutes,
  };
}

async function evaluateWithAI(patientData) {
  const { patientName, age, symptoms, vitals, hospitalCapacity } = patientData;
  const currentOccupancy = hospitalCapacity?.waitingRoomOccupancy ?? 19;
  const maxCapacity = hospitalCapacity?.waitingRoomMaxCapacity ?? 25;
  const bedsOccupied = hospitalCapacity?.triageBedsOccupied ?? 8;
  const totalBeds = hospitalCapacity?.totalTriageBeds ?? 10;
  const congestionLevel = hospitalCapacity?.congestionLevel ?? 'High';

  const prompt = [
    'You are the Smart Hospital Congestion Control AI. Analyze the patient below and choose a triage decision that keeps care safe while minimizing physical waiting-room congestion.',
    `Patient: ${patientName || 'Unknown'} | Age: ${age ?? 'unknown'} | Symptoms: ${symptoms}`,
    `Vitals: ${JSON.stringify(vitals ?? {})}`,
    `Waiting room: ${currentOccupancy}/${maxCapacity} occupied. Triage beds: ${bedsOccupied}/${totalBeds} occupied. Congestion: ${congestionLevel}.`,
    'Return ONLY valid JSON with these string fields: triage_urgency (Emergency, Urgent, or Non-Urgent), wait_strategy (Report Directly to Triage Bed, Divert to Telehealth, Wait in Secondary Zone, Wait in Waiting Room, or Wait at Home), recommended_arrival_time, congestion_mitigation_action, queue_token_message, clinical_summary, assigned_bed_or_zone, estimated_wait_minutes.',
    'For Emergency use wait_strategy "Report Directly to Triage Bed" and estimated_wait_minutes "0". For Non-Urgent prefer "Wait at Home" or "Divert to Telehealth" to keep patients out of the physical waiting room.',
  ].join('\n');

  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI response timed out')), 20000);
  });

  try {
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const text = response.text ? response.text.trim() : '';
    const parsed = JSON.parse(text);

    for (const field of [
      'triage_urgency',
      'wait_strategy',
      'recommended_arrival_time',
      'congestion_mitigation_action',
      'queue_token_message',
    ]) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
        throw new Error(`AI response missing ${field}`);
      }
    }

    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { evaluateRuleBasedTriage, evaluateWithAI };
