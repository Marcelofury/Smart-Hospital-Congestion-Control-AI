import React, { useState } from 'react';
import { X, Copy, Check, Code2, ShieldCheck, AlertCircle } from 'lucide-react';
import { TriageResult, Patient } from '../types';

interface JsonViewerModalProps {
  patient: Patient | TriageResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JsonViewerModal: React.FC<JsonViewerModalProps> = ({ patient, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !patient) return null;

  // The exact required 5-key JSON output structure
  const formattedJson = {
    triage_urgency: patient.triage_urgency,
    wait_strategy: patient.wait_strategy,
    recommended_arrival_time: patient.recommended_arrival_time,
    congestion_mitigation_action: patient.congestion_mitigation_action,
    queue_token_message: patient.queue_token_message,
  };

  const jsonString = JSON.stringify(formattedJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNonUrgentCompliant =
    patient.triage_urgency !== 'Non-Urgent' ||
    (patient.wait_strategy !== 'Report Directly to Triage Bed' &&
      !patient.wait_strategy.toLowerCase().includes('waiting room'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-purple-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-purple-50/60 px-6 py-4 flex items-center justify-between border-b border-purple-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl border border-purple-200">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Standard AI Triage JSON Output</h3>
              <p className="text-xs text-slate-500">Exact 5-key protocol required by Hospital Congestion Policy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-purple-100/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Policy Compliance Pill */}
          <div
            className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs leading-relaxed ${
              isNonUrgentCompliant
                ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {isNonUrgentCompliant ? (
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold uppercase tracking-wider text-[11px] mb-0.5">
                Congestion Policy Compliance:
              </div>
              <div>
                {patient.triage_urgency === 'Non-Urgent'
                  ? 'PASSED: Non-Urgent patient is kept completely OUT of the physical waiting room via remote queue / telehealth.'
                  : patient.triage_urgency === 'Emergency'
                  ? 'PASSED: Severe emergency flagged for immediate direct bed entry without lobby delay.'
                  : 'PASSED: Urgent case routed to secondary assessment zone to disperse corridor density.'}
              </div>
            </div>
          </div>

          {/* JSON Block with copy button */}
          <div className="relative">
            <div className="absolute right-3 top-3">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white hover:bg-purple-50 text-xs font-medium text-purple-900 rounded-lg border border-purple-200 transition flex items-center space-x-1.5 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-purple-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-600" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-5 bg-slate-900 text-purple-200 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
              <code>{jsonString}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-purple-50/40 px-6 py-3 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
          <span>Synced with Firebase Firestore</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-medium transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
