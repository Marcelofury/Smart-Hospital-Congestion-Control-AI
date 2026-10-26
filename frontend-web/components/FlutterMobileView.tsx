import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Home,
  MessageSquare,
  Navigation,
  Phone,
  RefreshCw,
  Send,
  ShieldAlert,
  Smartphone,
  Video,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowRight,
  Code2
} from 'lucide-react';
import { Patient, HospitalCapacity, TriageResult } from '../types';
import { requestAiTriage, savePatientRecord, updatePatientStatus } from '../services/triageApi';

interface FlutterMobileViewProps {
  currentPatient: Patient | null;
  hospitalCapacity: HospitalCapacity;
  onPatientCreated: (patient: Patient) => void;
  onOpenJsonInspector: (json: TriageResult) => void;
}

const SYMPTOM_PRESETS = [
  {
    label: '🚨 Severe Chest Pain & Breathlessness',
    category: 'Emergency',
    symptoms: 'Sudden retrosternal pressure, diaphoresis, shortness of breath, pain radiating down left arm.',
    age: 58,
    vitals: { heartRate: 114, bpSystolic: 160, bpDiastolic: 100, o2Sat: 91, painScale: 9 },
  },
  {
    label: '🏡 Sprained Ankle from Sports',
    category: 'Non-Urgent',
    symptoms: 'Twisted right ankle during basketball, swelling and mild bruising, can put partial weight.',
    age: 26,
    vitals: { heartRate: 78, bpSystolic: 122, bpDiastolic: 78, o2Sat: 99, painScale: 4 },
  },
  {
    label: '💻 Rash & Prescription Refill',
    category: 'Non-Urgent (Telehealth)',
    symptoms: 'Mild itchy rash on forearms after outdoor hike, request prescription cream refill.',
    age: 32,
    vitals: { heartRate: 72, bpSystolic: 116, bpDiastolic: 74, o2Sat: 99, painScale: 2 },
  },
  {
    label: '⚡ Deep Kitchen Laceration',
    category: 'Urgent',
    symptoms: 'Accidental deep cut on palm from chef knife, bleeding slowed with compression, needs sutures.',
    age: 40,
    vitals: { heartRate: 92, bpSystolic: 132, bpDiastolic: 86, o2Sat: 98, painScale: 6 },
  },
];

export const FlutterMobileView: React.FC<FlutterMobileViewProps> = ({
  currentPatient,
  hospitalCapacity,
  onPatientCreated,
  onOpenJsonInspector,
}) => {
  const [patientName, setPatientName] = useState('Alex Morgan');
  const [phone, setPhone] = useState('+1 (555) 724-9011');
  const [age, setAge] = useState<number>(34);
  const [symptoms, setSymptoms] = useState('');
  const [heartRate, setHeartRate] = useState<number>(82);
  const [bpSystolic, setBpSystolic] = useState<number>(120);
  const [bpDiastolic, setBpDiastolic] = useState<number>(80);
  const [o2Sat, setO2Sat] = useState<number>(98);
  const [painScale, setPainScale] = useState<number>(3);
  const [showVitals, setShowVitals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket' | 'checkin' | 'sms'>(currentPatient ? 'ticket' : 'checkin');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    (currentPatient?.estimatedWaitMinutes || 45) * 60
  );

  // Countdown timer for staggered arrival
  useEffect(() => {
    if (!currentPatient || currentPatient.triage_urgency === 'Emergency') return;
    setSecondsRemaining((currentPatient.estimatedWaitMinutes || 45) * 60);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPatient]);

  const handleApplyPreset = (preset: (typeof SYMPTOM_PRESETS)[0]) => {
    setSymptoms(preset.symptoms);
    setAge(preset.age);
    setHeartRate(preset.vitals.heartRate);
    setBpSystolic(preset.vitals.bpSystolic);
    setBpDiastolic(preset.vitals.bpDiastolic);
    setO2Sat(preset.vitals.o2Sat);
    setPainScale(preset.vitals.painScale);
    setShowVitals(true);
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setIsSubmitting(true);
    try {
      const vitals = {
        heartRate,
        bpSystolic,
        bpDiastolic,
        o2Sat,
        painScale,
      };

      const result = await requestAiTriage({
        patientName,
        age,
        phone,
        symptoms,
        vitals,
        hospitalCapacity,
      });

      const tokenPrefix =
        result.triage_urgency === 'Emergency' ? 'EM' : result.triage_urgency === 'Urgent' ? 'UR' : 'NO';
      const queueToken = `${tokenPrefix}-${Math.floor(100 + Math.random() * 900)}`;

      let initialStatus: Patient['status'] = 'registered';
      if (result.wait_strategy === 'Report Directly to Triage Bed') {
        initialStatus = 'in_bed';
      } else if (result.wait_strategy === 'Divert to Telehealth') {
        initialStatus = 'diverted_telehealth';
      } else if (result.wait_strategy === 'Wait at Home') {
        initialStatus = 'waiting_remote';
      } else {
        initialStatus = 'arrived';
      }

      const newPatient: Patient = {
        id: `pt-${Date.now()}`,
        patientName,
        phone,
        age,
        symptoms,
        triage_urgency: result.triage_urgency,
        wait_strategy: result.wait_strategy,
        recommended_arrival_time: result.recommended_arrival_time,
        congestion_mitigation_action: result.congestion_mitigation_action,
        queue_token_message: result.queue_token_message,
        status: initialStatus,
        assignedBedOrZone:
          result.assigned_bed_or_zone ||
          (result.triage_urgency === 'Emergency'
            ? 'Direct Bed ER-01'
            : result.wait_strategy === 'Divert to Telehealth'
            ? 'Virtual Telehealth Hub'
            : 'Home / Remote Queue'),
        queueToken,
        estimatedWaitMinutes: result.estimated_wait_minutes ?? (result.triage_urgency === 'Emergency' ? 0 : 45),
        vitals,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePatientRecord(newPatient);
      onPatientCreated(newPatient);
      setActiveTab('ticket');
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: Patient['status']) => {
    if (!currentPatient) return;
    const updated = { ...currentPatient, status };
    await updatePatientStatus(currentPatient.id, { status });
    onPatientCreated(updated);
  };

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const occupancyRatio =
    hospitalCapacity.waitingRoomOccupancy / Math.max(1, hospitalCapacity.waitingRoomMaxCapacity);
  const isCrowded = occupancyRatio >= 0.75;

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 w-full">
      {/* Mobile Device Frame with subtle card effect */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_15px_40px_-10px_rgba(139,92,246,0.15)] border border-purple-200/80 overflow-hidden flex flex-col min-h-[720px] transition-all">
        {/* Device Status Bar */}
        <div className="bg-purple-900 px-6 py-2.5 flex items-center justify-between text-xs text-purple-200 font-mono border-b border-purple-800">
          <span>9:41 AM</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-300"></span>
            <span className="text-[11px] font-medium text-purple-200">Patient Portal</span>
            <span className="text-purple-400">|</span>
            <span>5G</span>
          </div>
        </div>

        {/* Flutter Material 3 App Bar in Light Purple */}
        <div className="bg-gradient-to-r from-purple-800 via-purple-900 to-indigo-950 px-5 py-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Activity className="w-5 h-5 text-purple-200" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight tracking-tight">SmartCare Clinic</h1>
                <p className="text-xs text-purple-200">Remote Queue & Triage</p>
              </div>
            </div>

            {/* Quick Live Occupancy Badge */}
            <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 backdrop-blur-sm text-purple-100 border border-white/20">
              <span>
                Lobby: {hospitalCapacity.waitingRoomOccupancy}/{hospitalCapacity.waitingRoomMaxCapacity}
              </span>
            </div>
          </div>

          {/* Tab Bar in Clean Segmented Style */}
          <div className="flex space-x-1 mt-4 bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/10 text-xs font-medium">
            <button
              onClick={() => setActiveTab('ticket')}
              disabled={!currentPatient}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'ticket'
                  ? 'bg-white text-purple-900 shadow-sm font-semibold'
                  : currentPatient
                  ? 'text-purple-200 hover:text-white'
                  : 'text-purple-400/50 cursor-not-allowed'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Queue Pass</span>
            </button>
            <button
              onClick={() => setActiveTab('checkin')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'checkin'
                  ? 'bg-white text-purple-900 shadow-sm font-semibold'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Check-in</span>
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              disabled={!currentPatient}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'sms'
                  ? 'bg-white text-purple-900 shadow-sm font-semibold'
                  : currentPatient
                  ? 'text-purple-200 hover:text-white'
                  : 'text-purple-400/50 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS Feed</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/70 text-slate-800 flex flex-col justify-between">
          {/* TAB 1: ACTIVE DIGITAL QUEUE PASS */}
          {activeTab === 'ticket' && currentPatient && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Congestion Control Banner */}
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start space-x-3 shadow-sm ${
                  currentPatient.triage_urgency === 'Emergency'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : currentPatient.triage_urgency === 'Urgent'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}
              >
                {currentPatient.triage_urgency === 'Emergency' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold uppercase tracking-wider text-[11px] mb-0.5">
                    Congestion Mitigation Action:
                  </div>
                  <div>{currentPatient.congestion_mitigation_action}</div>
                </div>
              </div>

              {/* Digital Boarding Pass Ticket with card effect */}
              <div className="bg-white rounded-2xl p-5 border border-purple-200/90 shadow-md relative overflow-hidden">
                {/* Visual cutout notches on ticket sides */}
                <div className="absolute -left-3 top-1/2 w-6 h-6 rounded-full bg-slate-100 border border-purple-200"></div>
                <div className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-slate-100 border border-purple-200"></div>

                <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
                      Digital Queue Token
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{currentPatient.patientName}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Token ID</span>
                    <div className="text-2xl font-bold text-purple-700 font-mono tracking-tight">
                      {currentPatient.queueToken}
                    </div>
                  </div>
                </div>

                {/* Urgency & Strategy Badges */}
                <div className="grid grid-cols-2 gap-2 my-3.5">
                  <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Triage Urgency
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        currentPatient.triage_urgency === 'Emergency'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : currentPatient.triage_urgency === 'Urgent'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {currentPatient.triage_urgency}
                    </span>
                  </div>

                  <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Wait Strategy
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-purple-800 bg-white border border-purple-200">
                      {currentPatient.wait_strategy}
                    </span>
                  </div>
                </div>

                {/* Main Directive & Timing */}
                <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200 my-3">
                  <div className="flex items-center justify-between text-xs text-purple-800 mb-1">
                    <span className="font-semibold flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Recommended Arrival Time:</span>
                    </span>
                  </div>
                  <div className="text-sm font-bold text-purple-950 tracking-wide">
                    {currentPatient.recommended_arrival_time}
                  </div>

                  {currentPatient.triage_urgency !== 'Emergency' && (
                    <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Countdown to arrival:</span>
                      <span className="font-mono text-purple-700 font-bold bg-white px-2 py-0.5 rounded border border-purple-200 shadow-sm">
                        {formatCountdown(secondsRemaining)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Destination & Action */}
                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Area:</span>
                    <span className="font-medium text-slate-900">{currentPatient.assignedBedOrZone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Current Status:</span>
                    <span className="capitalize font-mono text-purple-700 font-medium">
                      {currentPatient.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-purple-100 flex flex-col gap-2">
                  {currentPatient.wait_strategy === 'Divert to Telehealth' && (
                    <button
                      onClick={() => handleUpdateStatus('diverted_telehealth')}
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition flex items-center justify-center space-x-2 text-xs"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Virtual Telehealth Consultation</span>
                    </button>
                  )}

                  {currentPatient.wait_strategy === 'Wait at Home' && (
                    <button
                      onClick={() => handleUpdateStatus('en_route')}
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition flex items-center justify-center space-x-2 text-xs"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>I am En Route (10 mins away)</span>
                    </button>
                  )}

                  {currentPatient.triage_urgency === 'Emergency' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                      <div className="text-rose-700 font-bold text-xs uppercase">
                        DO NOT WAIT IN LOBBY - DIRECT BED ENTRY
                      </div>
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        Rapid response escort dispatched to Red Bay Entrance.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => onOpenJsonInspector(currentPatient)}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-800 py-2 px-3 rounded-xl text-[11px] font-mono flex items-center justify-center space-x-1.5 transition border border-purple-200"
                  >
                    <Code2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>View AI Congestion JSON Output</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATIENT CHECK-IN FORM */}
          {activeTab === 'checkin' && (
            <form onSubmit={handleCheckInSubmit} className="space-y-3.5 animate-in fade-in duration-300">
              <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-sm">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-800 block mb-2">
                  Clinical Presets (Click to Test AI)
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {SYMPTOM_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleApplyPreset(preset)}
                      className="text-left text-xs p-2.5 rounded-lg bg-purple-50/40 hover:bg-purple-50 border border-purple-100 hover:border-purple-300 transition flex items-center justify-between group"
                    >
                      <span className="font-medium text-slate-800 group-hover:text-purple-900">
                        {preset.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-700 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    required
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Mobile Phone (For SMS Token Alert)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono shadow-sm"
                />
              </div>

              {/* Symptoms Input */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Reported Symptoms & Onset
                </label>
                <textarea
                  rows={3}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe symptoms, e.g. chest pain, ankle sprain, skin rash, fever, laceration..."
                  className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-500 resize-none shadow-sm"
                />
              </div>

              {/* Vital Signs Drawer */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowVitals(!showVitals)}
                  className="text-xs text-purple-700 hover:text-purple-900 font-medium flex items-center space-x-1"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{showVitals ? 'Hide Vital Signs' : '+ Add Triage Vital Signs (HR, BP, SpO2)'}</span>
                </button>

                {showVitals && (
                  <div className="mt-2.5 p-3.5 bg-white rounded-xl border border-purple-200 space-y-2.5 shadow-sm">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Heart Rate (bpm)</label>
                        <input
                          type="number"
                          value={heartRate}
                          onChange={(e) => setHeartRate(parseInt(e.target.value, 10) || 75)}
                          className="w-full bg-purple-50/30 border border-purple-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">BP (Sys/Dia)</label>
                        <div className="flex space-x-1">
                          <input
                            type="number"
                            value={bpSystolic}
                            onChange={(e) => setBpSystolic(parseInt(e.target.value, 10) || 120)}
                            className="w-1/2 bg-purple-50/30 border border-purple-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono"
                          />
                          <input
                            type="number"
                            value={bpDiastolic}
                            onChange={(e) => setBpDiastolic(parseInt(e.target.value, 10) || 80)}
                            className="w-1/2 bg-purple-50/30 border border-purple-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">SpO2 (%)</label>
                        <input
                          type="number"
                          value={o2Sat}
                          onChange={(e) => setO2Sat(parseInt(e.target.value, 10) || 98)}
                          className="w-full bg-purple-50/30 border border-purple-200 rounded-lg p-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                        <span>Pain Level Scale</span>
                        <span className="font-semibold text-purple-700">{painScale} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={painScale}
                        onChange={(e) => setPainScale(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Congestion Control Rule Warning */}
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900">
                <span className="font-semibold">Congestion Policy:</span> Non-urgent patients will be held in remote
                queue or telehealth to prevent physical hallway crowding.
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !symptoms.trim()}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center space-x-2 text-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Triage & Traffic Bottlenecks...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Process AI Triage & Get Queue Token</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: SMS NOTIFICATION SIMULATOR */}
          {activeTab === 'sms' && currentPatient && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center py-2">
                <div className="w-11 h-11 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-1 border border-purple-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">SMS Notification Dispatch</h3>
                <p className="text-xs text-slate-500">Updates sent to {currentPatient.phone}</p>
              </div>

              {/* SMS Chat Bubble */}
              <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm space-y-3">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    Today • Realtime Dispatch
                  </span>
                </div>

                <div className="flex flex-col items-start max-w-[95%] space-y-1">
                  <div className="bg-purple-50 text-slate-900 border border-purple-200 rounded-2xl rounded-tl-sm p-3.5 text-xs leading-relaxed shadow-sm">
                    <p className="font-semibold text-purple-900 mb-1">Hospital Care Coordination:</p>
                    <p>{currentPatient.queue_token_message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-1">Delivered via Firestore Cloud Event</span>
                </div>

                {currentPatient.wait_strategy === 'Wait at Home' && (
                  <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl text-xs text-purple-900">
                    <span className="font-semibold">Patient Comfort:</span> Staying at home until your exact arrival slot
                    at {currentPatient.recommended_arrival_time} preserves clinic safety and minimizes airborne pathogen exposure.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Bar: Quick Switch Back */}
          <div className="pt-3 mt-3 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
            <span>Powered by Gemini & Firestore</span>
            <button
              onClick={() => setActiveTab(activeTab === 'checkin' ? 'ticket' : 'checkin')}
              className="text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1"
            >
              <span>{activeTab === 'checkin' ? 'View Token' : '+ New Check-in'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
