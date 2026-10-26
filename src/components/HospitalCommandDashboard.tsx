import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bed,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  Home,
  Layers,
  MapPin,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Users,
  Video,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { Patient, HospitalCapacity, TriageResult } from '../types';
import { updatePatientStatus, updateCapacity } from '../services/triageApi';

interface HospitalCommandDashboardProps {
  patients: Patient[];
  hospitalCapacity: HospitalCapacity;
  onSelectPatient: (patient: Patient) => void;
  onOpenJsonInspector: (json: TriageResult) => void;
  onTriggerSurge: () => void;
  onOpenNewCheckIn: () => void;
}

export const HospitalCommandDashboard: React.FC<HospitalCommandDashboardProps> = ({
  patients,
  hospitalCapacity,
  onSelectPatient,
  onOpenJsonInspector,
  onTriggerSurge,
  onOpenNewCheckIn,
}) => {
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const waitingRoomMax = hospitalCapacity.waitingRoomMaxCapacity;
  const waitingRoomCurrent = hospitalCapacity.waitingRoomOccupancy;
  const waitingRoomPercent = Math.min(100, Math.round((waitingRoomCurrent / waitingRoomMax) * 100));

  // Count diverted patients (kept out of waiting room)
  const remotePatientsCount = patients.filter(
    (p) => p.wait_strategy === 'Wait at Home' || p.wait_strategy === 'Divert to Telehealth'
  ).length;

  const emergencyDirectBedCount = patients.filter(
    (p) => p.wait_strategy === 'Report Directly to Triage Bed'
  ).length;

  const filteredPatients = patients.filter((patient) => {
    if (filterUrgency !== 'all' && patient.triage_urgency !== filterUrgency) return false;
    if (filterStrategy !== 'all' && patient.wait_strategy !== filterStrategy) return false;
    if (
      searchQuery &&
      !patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !patient.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !patient.queueToken.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleStatusChange = async (patientId: string, newStatus: Patient['status']) => {
    await updatePatientStatus(patientId, { status: newStatus });
  };

  const handleAdjustCapacity = async (delta: number) => {
    const newOccupancy = Math.max(0, Math.min(waitingRoomMax, waitingRoomCurrent + delta));
    let level: HospitalCapacity['congestionLevel'] = 'Low';
    const ratio = newOccupancy / waitingRoomMax;
    if (ratio >= 0.85) level = 'Critical';
    else if (ratio >= 0.7) level = 'High';
    else if (ratio >= 0.45) level = 'Moderate';

    await updateCapacity({
      ...hospitalCapacity,
      waitingRoomOccupancy: newOccupancy,
      congestionLevel: level,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Hospital Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiting Room Occupancy Card */}
        <div className="card-effect rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Main Waiting Room</span>
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                waitingRoomPercent >= 80
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {hospitalCapacity.congestionLevel} Congestion
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {waitingRoomCurrent}
            </span>
            <span className="text-slate-500 text-sm">/ {waitingRoomMax} seats</span>
            <span className="text-xs font-medium text-purple-700 ml-auto font-mono bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              {waitingRoomPercent}% capacity
            </span>
          </div>

          {/* Progress Bar with purple theme */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-500 rounded-full"
              style={{ width: `${waitingRoomPercent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Critical threshold: 20 seats</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleAdjustCapacity(-1)}
                className="w-5 h-5 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 font-mono text-xs transition"
                title="Decrease occupancy"
              >
                -
              </button>
              <button
                onClick={() => handleAdjustCapacity(1)}
                className="w-5 h-5 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 font-mono text-xs transition"
                title="Increase occupancy"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Patients Kept OUT of Waiting Room (Mission Target) */}
        <div className="card-effect rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-white via-purple-50/20 to-purple-50/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4 text-purple-600" />
              <span>Crowding Dispersed</span>
            </span>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full border border-purple-200">
              Priority Goal
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-purple-700 font-mono tracking-tight">
              {remotePatientsCount}
            </span>
            <span className="text-slate-600 text-sm font-medium">low-urgency patients</span>
          </div>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Preserving waiting room capacity by directing non-urgents to Remote Queue & Telehealth.
          </p>

          <div className="mt-3 text-[11px] font-medium text-purple-700 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Zero Hallway Congestion Enforced</span>
          </div>
        </div>

        {/* Emergency Direct-to-Bed Bypass */}
        <div className="card-effect rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Direct Bed Rapid Bypass</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Direct Entry
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
              {emergencyDirectBedCount}
            </span>
            <span className="text-slate-500 text-sm">cases routed direct</span>
          </div>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Severe emergency & trauma cases routed directly to resuscitation beds without lobby transit.
          </p>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Active Triage Beds:</span>
            <span className="font-mono text-purple-800 font-semibold">
              {hospitalCapacity.triageBedsOccupied} / {hospitalCapacity.totalTriageBeds}
            </span>
          </div>
        </div>

        {/* Arrival Staggering Controller */}
        <div className="card-effect rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Arrival Dispersion</span>
              </span>
              <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Staggered Slots
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">15m – 60m</div>
            <p className="text-xs text-slate-600 mt-1">
              Dynamic time windows flatten arrival spikes across the day.
            </p>
          </div>

          <div className="pt-3 border-t border-purple-100 flex gap-2">
            <button
              onClick={onTriggerSurge}
              className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-medium border border-purple-200 transition flex items-center justify-center space-x-1 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Surge Sim</span>
            </button>
            <button
              onClick={onOpenNewCheckIn}
              className="py-1.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              + Intake
            </button>
          </div>
        </div>
      </div>

      {/* Traffic Bottleneck & Floor Zones Overview */}
      <div className="card-effect rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-purple-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Hospital Bottleneck & Dispersal Zones</span>
            </h3>
            <p className="text-xs text-slate-500">
              Live traffic routing away from central bottlenecks into distributed care streams
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
            <span className="text-slate-600 font-medium">Firestore Real-time Stream Active</span>
          </div>
        </div>

        {/* 4 Clean Zones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
          {/* ZONE 1: Direct Resuscitation Beds */}
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 hover:bg-purple-50/40 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                <Bed className="w-4 h-4 text-purple-600" />
                <span>Zone 1: Direct Beds</span>
              </span>
              <span className="text-[10px] font-medium text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                High Acuity
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {hospitalCapacity.triageBedsOccupied} / {hospitalCapacity.totalTriageBeds} Beds
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Direct red bay escort, bypassing main reception.
            </p>
            <div className="mt-3 pt-2 border-t border-purple-100 text-[10px] text-purple-700 font-medium">
              Strategy: Direct Bed Entry
            </div>
          </div>

          {/* ZONE 2: Physical Main Waiting Room */}
          <div className="p-4 rounded-xl border border-purple-100 bg-white hover:bg-purple-50/20 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Zone 2: Main Lobby</span>
              </span>
              <span className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Physical Waiting
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {waitingRoomCurrent} / {waitingRoomMax} Seats ({waitingRoomPercent}%)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Protected by AI rule: Non-urgents are held remotely.
            </p>
            <div className="mt-3 pt-2 border-t border-purple-100 text-[10px] text-slate-600 font-medium">
              Policy: Low-Urgency Blocked
            </div>
          </div>

          {/* ZONE 3: Secondary Courtyard / Annex Pavilion */}
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 hover:bg-purple-50/40 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Zone 3: Secondary Annex</span>
              </span>
              <span className="text-[10px] font-medium text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                Urgent Care
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {hospitalCapacity.secondaryZoneOccupancy} / 15 Patients
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Covered pavilion & minor annex to dilute corridor density.
            </p>
            <div className="mt-3 pt-2 border-t border-purple-100 text-[10px] text-purple-700 font-medium">
              Strategy: Secondary Zone
            </div>
          </div>

          {/* ZONE 4: Remote Home & Virtual Telehealth */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50/70 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-900 flex items-center space-x-1.5">
                <Home className="w-4 h-4 text-purple-700" />
                <span>Zone 4: Remote Queue</span>
              </span>
              <span className="text-[10px] font-medium text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                Cloud Virtual
              </span>
            </div>
            <div className="text-xl font-bold text-purple-900 font-mono">
              {remotePatientsCount} Patients Active
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Zero physical hospital footprint until appointment slot.
            </p>
            <div className="mt-3 pt-2 border-t border-purple-200 text-[10px] text-purple-800 font-medium">
              Strategy: Wait at Home / Telehealth
            </div>
          </div>
        </div>
      </div>

      {/* Patient Triage Queue Table */}
      <div className="card-effect rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-purple-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Real-Time Patient Triage Queue</span>
            </h3>
            <p className="text-xs text-slate-500">
              Arrival windows, remote queue tokens, and congestion mitigation actions
            </p>
          </div>

          {/* Clean Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient or symptom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-purple-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-400 shadow-sm"
              />
            </div>

            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="bg-white border border-purple-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-400 shadow-sm"
            >
              <option value="all">All Urgencies</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Non-Urgent">Non-Urgent</option>
            </select>

            <select
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
              className="bg-white border border-purple-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-purple-400 shadow-sm"
            >
              <option value="all">All Strategies</option>
              <option value="Report Directly to Triage Bed">Direct to Bed</option>
              <option value="Wait in Secondary Zone">Secondary Zone</option>
              <option value="Wait at Home">Wait at Home</option>
              <option value="Divert to Telehealth">Telehealth</option>
            </select>
          </div>
        </div>

        {/* Patients Table with clean rows */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-100 text-slate-500 font-mono uppercase text-[11px]">
                <th className="pb-3 px-3">Token & Patient</th>
                <th className="pb-3 px-3">Urgency & Symptoms</th>
                <th className="pb-3 px-3">Congestion Wait Strategy</th>
                <th className="pb-3 px-3">Staggered Arrival Window</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No matching patient records found in queue.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-purple-50/40 transition group cursor-pointer"
                    onClick={() => onSelectPatient(patient)}
                  >
                    {/* Patient & Token */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
                          {patient.queueToken}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-purple-800 transition">
                            {patient.patientName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Age {patient.age} {patient.phone ? `• ${patient.phone}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Symptoms & Urgency */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            patient.triage_urgency === 'Emergency'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : patient.triage_urgency === 'Urgent'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {patient.triage_urgency}
                        </span>
                        {patient.vitals?.painScale !== undefined && (
                          <span className="text-[10px] text-slate-400">
                            Pain: {patient.vitals.painScale}/10
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-1">{patient.symptoms}</p>
                    </td>

                    {/* Wait Strategy */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                        {patient.wait_strategy === 'Report Directly to Triage Bed' ? (
                          <span className="text-slate-900 font-semibold flex items-center space-x-1">
                            <Bed className="w-3.5 h-3.5 text-purple-600" />
                            <span>Direct Bed Entry</span>
                          </span>
                        ) : patient.wait_strategy === 'Divert to Telehealth' ? (
                          <span className="text-purple-800 flex items-center space-x-1">
                            <Video className="w-3.5 h-3.5 text-purple-600" />
                            <span>Telehealth Hub</span>
                          </span>
                        ) : patient.wait_strategy === 'Wait at Home' ? (
                          <span className="text-purple-900 font-semibold flex items-center space-x-1">
                            <Home className="w-3.5 h-3.5 text-purple-600" />
                            <span>Remote / Home Queue</span>
                          </span>
                        ) : (
                          <span className="text-slate-700 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-purple-600" />
                            <span>Secondary Zone</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{patient.assignedBedOrZone}</div>
                    </td>

                    {/* Recommended Arrival Window */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-800 text-xs font-semibold">
                        {patient.recommended_arrival_time}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {patient.congestion_mitigation_action}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      <span className="capitalize font-mono text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {patient.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onOpenJsonInspector(patient)}
                          className="p-1.5 bg-white hover:bg-purple-50 text-purple-700 rounded-lg border border-purple-200 transition shadow-sm"
                          title="Inspect AI Triage JSON"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                        </button>

                        {patient.status === 'waiting_remote' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'en_route')}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-md text-[11px] font-medium transition shadow-sm"
                          >
                            Call In
                          </button>
                        )}

                        {patient.status === 'en_route' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'arrived')}
                            className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-md text-[11px] font-medium border border-purple-300 transition"
                          >
                            Mark Arrived
                          </button>
                        )}

                        {patient.status === 'arrived' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'in_bed')}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-md text-[11px] font-medium transition shadow-sm"
                          >
                            Admit
                          </button>
                        )}

                        {patient.status === 'in_bed' && (
                          <button
                            onClick={() => handleStatusChange(patient.id, 'completed')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium border border-slate-300 transition"
                          >
                            Discharge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
