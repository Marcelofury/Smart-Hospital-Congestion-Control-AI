import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  Flame,
  Home,
  Layers,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Sparkles,
  TrendingDown,
  Users,
  Video,
  Split
} from 'lucide-react';
import { Patient, HospitalCapacity, TriageResult } from './types';
import {
  INITIAL_CAPACITY,
  SEED_PATIENTS,
  savePatientRecord,
  updatePatientStatus,
  updateCapacity,
} from './services/triageApi';
import {
  testConnection,
  subscribeToPatients,
  subscribeToHospitalCapacity,
  auth,
} from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { FlutterMobileView } from './components/FlutterMobileView';
import { HospitalCommandDashboard } from './components/HospitalCommandDashboard';
import { JsonViewerModal } from './components/JsonViewerModal';
import { CongestionSimulator } from './components/CongestionSimulator';
import { FlutterFireHubModal } from './components/FlutterFireHubModal';
import { UserProfile } from './types';
import { subscribeToUserProfile, upsertUserProfile } from './firebase/config';
import { hasPermission } from './services/rbac';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(SEED_PATIENTS);
  const [hospitalCapacity, setHospitalCapacity] = useState<HospitalCapacity>(INITIAL_CAPACITY);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(SEED_PATIENTS[2]); // Default to Marcus Chen (Wait at Home)
  const [currentView, setCurrentView] = useState<'flutter_mobile' | 'hospital_command'>('hospital_command');
  const [isDualView, setIsDualView] = useState<boolean>(false);
  const [jsonModalPatient, setJsonModalPatient] = useState<Patient | TriageResult | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isFlutterFireHubOpen, setIsFlutterFireHubOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

  // Initial connection test & auth listener
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Create/update user profile with RBAC
        try {
          await upsertUserProfile(
            currentUser.uid,
            currentUser.email,
            currentUser.displayName,
            currentUser.photoURL
          );
        } catch (err) {
          console.warn('Failed to upsert user profile:', err);
        }
      } else {
        setUserProfile(null);
      }
    });

    // Subscribe to user profile for RBAC
    let unsubUserProfile: (() => void) | undefined;
    if (user?.uid) {
      unsubUserProfile = subscribeToUserProfile(user.uid, (profile) => {
        setUserProfile(profile);
      });
    }

    // Real-time Firestore subscription for patients
    const unsubPatients = subscribeToPatients(
      (remotePatients) => {
        if (remotePatients.length > 0) {
          setPatients(remotePatients);
          if (currentPatient) {
            const found = remotePatients.find((p) => p.id === currentPatient.id);
            if (found) setCurrentPatient(found);
          }
        } else {
          // If Firestore is empty, seed it with initial clinical data
          SEED_PATIENTS.forEach((p) => savePatientRecord(p));
        }
      },
      (err) => console.warn('Using local patient state fallback:', err)
    );

    // Real-time Firestore subscription for hospital capacity
    const unsubCapacity = subscribeToHospitalCapacity(
      (capacity) => {
        if (capacity) {
          setHospitalCapacity(capacity);
        }
      },
      (err) => console.warn('Using local capacity state fallback:', err)
    );

    return () => {
      unsubAuth();
      if (unsubUserProfile) unsubUserProfile();
      unsubPatients();
      unsubCapacity();
    };
  }, []);

  const handlePatientCreated = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev.filter((p) => p.id !== newPatient.id)]);
    setCurrentPatient(newPatient);
  };

  const handleOpenJsonInspector = (data: Patient | TriageResult) => {
    setJsonModalPatient(data);
    setIsJsonModalOpen(true);
  };

  const handlePatientsFromSurge = (newPatients: Patient[]) => {
    setPatients((prev) => [...newPatients, ...prev]);
    if (newPatients.length > 0) {
      setCurrentPatient(newPatients[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f8fc] text-slate-800 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          setIsDualView(false);
        }}
        hospitalCapacity={hospitalCapacity}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenFlutterFireHub={() => setIsFlutterFireHubOpen(true)}
        onOpenNewCheckIn={() => {
          setCurrentView('flutter_mobile');
          setIsDualView(false);
        }}
        user={user}
        userProfile={userProfile}
      />

      {/* Subheader Banner: Policy Mandate in Light Purple */}
      <div className="bg-purple-50/70 border-b border-purple-100 py-2.5 px-4 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span className="font-semibold text-purple-900">Congestion Mitigation Directive:</span>
            <span>
              Low-urgency patients are prioritized for remote queues or telehealth to eliminate waiting room crowding.
              Severe emergencies bypass directly into resuscitation beds.
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsDualView(!isDualView)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition flex items-center space-x-1 ${
                isDualView
                  ? 'bg-purple-700 border-purple-700 text-white shadow-sm'
                  : 'bg-white border-purple-200 text-slate-700 hover:text-purple-900 shadow-sm'
              }`}
              title="Split-screen dual view"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{isDualView ? 'Standard View' : 'Dual Screen Mode'}</span>
            </button>

            <button
              onClick={() => {
                if (currentPatient) handleOpenJsonInspector(currentPatient);
                else if (patients.length > 0) handleOpenJsonInspector(patients[0]);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white border border-purple-200 text-purple-800 hover:bg-purple-50 transition flex items-center space-x-1 shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Inspect JSON Output</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* DUAL SCREEN VIEW */}
        {isDualView ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 flex justify-center">
              <FlutterMobileView
                currentPatient={currentPatient}
                hospitalCapacity={hospitalCapacity}
                onPatientCreated={handlePatientCreated}
                onOpenJsonInspector={handleOpenJsonInspector}
              />
            </div>
            <div className="lg:col-span-7">
              <HospitalCommandDashboard
                patients={patients}
                hospitalCapacity={hospitalCapacity}
                onSelectPatient={(p) => {
                  setCurrentPatient(p);
                }}
                onOpenJsonInspector={handleOpenJsonInspector}
                onTriggerSurge={() => setIsSimulatorOpen(true)}
                onOpenNewCheckIn={() => {
                  setCurrentView('flutter_mobile');
                  setIsDualView(false);
                }}
              />
            </div>
          </div>
        ) : (
          /* SINGLE VIEW */
          <div>
            {currentView === 'flutter_mobile' ? (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-md mb-3 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-slate-800">Patient Remote Intake & Queue Token</span>
                  </div>
                  <button
                    onClick={() => setCurrentView('hospital_command')}
                    className="text-purple-700 hover:text-purple-900 font-medium flex items-center space-x-1"
                  >
                    <span>View Command Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <FlutterMobileView
                  currentPatient={currentPatient}
                  hospitalCapacity={hospitalCapacity}
                  onPatientCreated={handlePatientCreated}
                  onOpenJsonInspector={handleOpenJsonInspector}
                />
              </div>
            ) : (
              <HospitalCommandDashboard
                patients={patients}
                hospitalCapacity={hospitalCapacity}
                onSelectPatient={(p) => {
                  setCurrentPatient(p);
                }}
                onOpenJsonInspector={handleOpenJsonInspector}
                onTriggerSurge={() => setIsSimulatorOpen(true)}
                onOpenNewCheckIn={() => {
                  setCurrentView('flutter_mobile');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-purple-100 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            <span>Cloud Firestore Real-Time Sync Connected • Firebase Hosting Ready</span>
          </div>
          <div>Smart Hospital Congestion Control AI • Professional Healthcare Operations</div>
        </div>
      </footer>

      {/* Modals */}
      <JsonViewerModal
        isOpen={isJsonModalOpen}
        patient={jsonModalPatient}
        onClose={() => setIsJsonModalOpen(false)}
      />

      <CongestionSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        hospitalCapacity={hospitalCapacity}
        onPatientsGenerated={handlePatientsFromSurge}
      />

      <FlutterFireHubModal
        isOpen={isFlutterFireHubOpen}
        onClose={() => setIsFlutterFireHubOpen(false)}
      />
    </div>
  );
}
