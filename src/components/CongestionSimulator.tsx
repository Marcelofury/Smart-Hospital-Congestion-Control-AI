import React, { useState } from 'react';
import { X, Flame, AlertTriangle, Users, Play, RefreshCw, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { Patient, HospitalCapacity } from '../types';
import { requestAiTriage, savePatientRecord, updateCapacity } from '../services/triageApi';

interface CongestionSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalCapacity: HospitalCapacity;
  onPatientsGenerated: (newPatients: Patient[]) => void;
}

export const CongestionSimulator: React.FC<CongestionSimulatorProps> = ({
  isOpen,
  onClose,
  hospitalCapacity,
  onPatientsGenerated,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  if (!isOpen) return null;

  const runSimulation = async (scenario: 'surge' | 'flu' | 'bottleneck') => {
    setIsRunning(true);
    setSimulationLog([]);

    const log = (msg: string) => {
      setSimulationLog((prev) => [...prev, msg]);
    };

    try {
      if (scenario === 'surge') {
        log('SIMULATION: Highway multi-vehicle collision reported by EMS dispatch.');
        log('Waiting room occupancy rising to 23 / 25 seats (92% - Bottleneck threshold).');

        // Adjust capacity
        await updateCapacity({
          ...hospitalCapacity,
          waitingRoomOccupancy: 23,
          congestionLevel: 'Critical',
          lastUpdated: new Date().toISOString(),
        });

        const surgeCases = [
          {
            name: 'Carlos Mendez (Driver)',
            age: 45,
            symptoms: 'Blunt chest trauma against steering column, acute dyspnea, cyanosis, hypotensive.',
            vitals: { heartRate: 132, bpSystolic: 88, bpDiastolic: 54, o2Sat: 87, painScale: 10 },
          },
          {
            name: 'Emily Watson (Passenger)',
            age: 29,
            symptoms: 'Deep forehead scalp laceration with active bleeding, no loss of consciousness.',
            vitals: { heartRate: 98, bpSystolic: 126, bpDiastolic: 82, o2Sat: 98, painScale: 7 },
          },
          {
            name: 'Liam Chen (Commuter)',
            age: 38,
            symptoms: 'Mild cervical strain / whiplash, neck stiffness, ambulating normally.',
            vitals: { heartRate: 76, bpSystolic: 120, bpDiastolic: 78, o2Sat: 99, painScale: 3 },
          },
        ];

        const generated: Patient[] = [];
        for (const item of surgeCases) {
          log(`Processing AI Triage for ${item.name}...`);
          const result = await requestAiTriage({
            patientName: item.name,
            age: item.age,
            symptoms: item.symptoms,
            vitals: item.vitals,
            hospitalCapacity: { ...hospitalCapacity, waitingRoomOccupancy: 23 },
          });

          log(`${item.name} -> Urgency: ${result.triage_urgency} | Strategy: ${result.wait_strategy}`);

          const tokenPrefix =
            result.triage_urgency === 'Emergency' ? 'EM' : result.triage_urgency === 'Urgent' ? 'UR' : 'NO';
          const queueToken = `${tokenPrefix}-${Math.floor(100 + Math.random() * 900)}`;

          const newP: Patient = {
            id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            patientName: item.name,
            phone: '+1 (555) 492-8811',
            age: item.age,
            symptoms: item.symptoms,
            triage_urgency: result.triage_urgency,
            wait_strategy: result.wait_strategy,
            recommended_arrival_time: result.recommended_arrival_time,
            congestion_mitigation_action: result.congestion_mitigation_action,
            queue_token_message: result.queue_token_message,
            status:
              result.wait_strategy === 'Report Directly to Triage Bed'
                ? 'in_bed'
                : result.wait_strategy === 'Wait in Secondary Zone'
                ? 'arrived'
                : 'waiting_remote',
            assignedBedOrZone:
              result.assigned_bed_or_zone ||
              (result.triage_urgency === 'Emergency'
                ? 'Direct Bed ER-03'
                : result.wait_strategy === 'Wait in Secondary Zone'
                ? 'Minor Trauma Annex Wing B'
                : 'Digital Remote Queue / Home'),
            queueToken,
            estimatedWaitMinutes: result.estimated_wait_minutes ?? 30,
            vitals: item.vitals,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await savePatientRecord(newP);
          generated.push(newP);
        }

        onPatientsGenerated(generated);
        log('Simulation complete! Critical patient bypassed lobby; non-urgent dispersed to remote queue.');
      } else if (scenario === 'flu') {
        log('SIMULATION: Monday morning flu & prescription rush (Non-Urgent Surge).');
        log('Mission: Keep 100% of non-urgent patients OUT of physical waiting room.');

        const fluCases = [
          { name: 'Chloe Bennett', age: 24, symptoms: 'Mild sore throat, 99.4F low grade fever, runny nose for 1 day.' },
          { name: 'David Kumar', age: 52, symptoms: 'Routine cholesterol medication refill request, asymptomatic.' },
          { name: 'Grace Miller', age: 31, symptoms: 'Seasonal allergic conjunctivitis and mild rhinitis.' },
        ];

        const generated: Patient[] = [];
        for (const item of fluCases) {
          log(`Triage evaluating ${item.name}...`);
          const result = await requestAiTriage({
            patientName: item.name,
            age: item.age,
            symptoms: item.symptoms,
            hospitalCapacity,
          });

          log(`${item.name} -> Strategy: ${result.wait_strategy} | Window: ${result.recommended_arrival_time}`);

          const queueToken = `NO-${Math.floor(100 + Math.random() * 900)}`;
          const newP: Patient = {
            id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            patientName: item.name,
            phone: '+1 (555) 773-1029',
            age: item.age,
            symptoms: item.symptoms,
            triage_urgency: result.triage_urgency,
            wait_strategy: result.wait_strategy,
            recommended_arrival_time: result.recommended_arrival_time,
            congestion_mitigation_action: result.congestion_mitigation_action,
            queue_token_message: result.queue_token_message,
            status: result.wait_strategy === 'Divert to Telehealth' ? 'diverted_telehealth' : 'waiting_remote',
            assignedBedOrZone:
              result.wait_strategy === 'Divert to Telehealth' ? 'Virtual Telehealth Hub' : 'Home / Remote Queue',
            queueToken,
            estimatedWaitMinutes: result.estimated_wait_minutes ?? 45,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await savePatientRecord(newP);
          generated.push(newP);
        }
        onPatientsGenerated(generated);
        log('Zero lobby footprint! All non-urgent patients diverted to telehealth and staggered home arrivals.');
      } else {
        // Reset to normal baseline
        log('Resetting hospital waiting room to safe baseline (14 / 25 seats).');
        await updateCapacity({
          ...hospitalCapacity,
          waitingRoomOccupancy: 14,
          congestionLevel: 'Moderate',
          lastUpdated: new Date().toISOString(),
        });
        log('Hospital congestion normalized.');
      }
    } catch (e) {
      log(`Simulation error: ${e}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-purple-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-purple-50/60 px-6 py-4 flex items-center justify-between border-b border-purple-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl border border-purple-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Congestion Stress Simulator</h3>
              <p className="text-xs text-slate-500">Test arrival dispersion algorithms against hospital bottlenecks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-purple-100/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Scenario 1 */}
            <button
              onClick={() => runSimulation('surge')}
              disabled={isRunning}
              className="p-4 rounded-xl border border-purple-200 bg-white hover:bg-purple-50/50 text-left transition flex flex-col justify-between group shadow-sm hover:shadow"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>Trauma Collision Influx</span>
                </span>
                <p className="text-[11px] text-slate-600">
                  Multiple critical & urgent patients arrive. Tests direct-to-bed bypass and secondary annex routing.
                </p>
              </div>
              <div className="mt-3 text-xs font-semibold text-purple-700 flex items-center space-x-1">
                <span>Run Scenario</span>
                <Play className="w-3 h-3 group-hover:translate-x-1 transition text-purple-600" />
              </div>
            </button>

            {/* Scenario 2 */}
            <button
              onClick={() => runSimulation('flu')}
              disabled={isRunning}
              className="p-4 rounded-xl border border-purple-200 bg-white hover:bg-purple-50/50 text-left transition flex flex-col justify-between group shadow-sm hover:shadow"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5 mb-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Flu / Minor Illness Wave</span>
                </span>
                <p className="text-[11px] text-slate-600">
                  Tests the core rule: 100% of non-urgent patients diverted to Telehealth or staggered home queue.
                </p>
              </div>
              <div className="mt-3 text-xs font-semibold text-purple-700 flex items-center space-x-1">
                <span>Run Scenario</span>
                <Play className="w-3 h-3 group-hover:translate-x-1 transition text-purple-600" />
              </div>
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={() => runSimulation('bottleneck')}
            disabled={isRunning}
            className="w-full py-2 bg-purple-50/50 hover:bg-purple-50 text-slate-700 rounded-xl text-xs font-medium border border-purple-200 transition shadow-sm"
          >
            Reset Hospital Capacity to Baseline (14 seats)
          </button>

          {/* Log Console */}
          {simulationLog.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-1 text-xs font-mono max-h-48 overflow-y-auto text-purple-200 shadow-inner">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-sans font-semibold">
                Live Simulation Output:
              </div>
              {simulationLog.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-purple-50/40 px-6 py-3 border-t border-purple-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
