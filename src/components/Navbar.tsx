import React from 'react';
import {
  Activity,
  Flame,
  Layers,
  Smartphone,
  Sparkles,
  LogIn,
  LogOut,
  Plus,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { HospitalCapacity } from '../types';
import { auth, googleProvider } from '../firebase/config';
import { signInWithPopup, signOut } from 'firebase/auth';

interface NavbarProps {
  currentView: 'flutter_mobile' | 'hospital_command';
  onChangeView: (view: 'flutter_mobile' | 'hospital_command') => void;
  hospitalCapacity: HospitalCapacity;
  onOpenSimulator: () => void;
  onOpenFlutterFireHub: () => void;
  onOpenNewCheckIn: () => void;
  user: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  hospitalCapacity,
  onOpenSimulator,
  onOpenFlutterFireHub,
  onOpenNewCheckIn,
  user,
}) => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.warn('Google sign-in completed or cancelled:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign-out notice:', e);
    }
  };

  const occupancyRatio =
    hospitalCapacity.waitingRoomOccupancy / Math.max(1, hospitalCapacity.waitingRoomMaxCapacity);
  const isCrowded = occupancyRatio >= 0.75;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100/80 shadow-[0_2px_12px_-2px_rgba(139,92,246,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Hospital Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200/70 shadow-sm">
            <Activity className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-base tracking-tight leading-tight">
                Smart Hospital Congestion Control AI
              </span>
              <span className="hidden sm:inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">
                Firestore Realtime
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Intelligent arrival dispersion & bottleneck mitigation
            </p>
          </div>
        </div>

        {/* View Switcher: Segmented Control */}
        <div className="flex items-center space-x-1 bg-purple-50/70 p-1 rounded-xl border border-purple-100">
          <button
            onClick={() => onChangeView('flutter_mobile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              currentView === 'flutter_mobile'
                ? 'bg-white text-purple-900 shadow-sm border border-purple-200/70 font-semibold'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
            <span>Patient App</span>
          </button>
          <button
            onClick={() => onChangeView('hospital_command')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
              currentView === 'hospital_command'
                ? 'bg-white text-purple-900 shadow-sm border border-purple-200/70 font-semibold'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Command Center</span>
          </button>
        </div>

        {/* Right Actions & Auth */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Waiting Room Occupancy Pill */}
          <div
            className={`hidden md:flex items-center space-x-2 px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
              isCrowded
                ? 'bg-purple-100/60 text-purple-900 border-purple-300'
                : 'bg-purple-50/60 text-purple-800 border-purple-200/70'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCrowded ? 'bg-purple-600 animate-pulse' : 'bg-purple-500'
              }`}
            ></span>
            <span>
              Lobby: {hospitalCapacity.waitingRoomOccupancy}/{hospitalCapacity.waitingRoomMaxCapacity} seats
            </span>
          </div>

          {/* Surge Simulator Button */}
          <button
            onClick={onOpenSimulator}
            className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 rounded-xl text-xs font-medium border border-purple-200/80 transition shadow-sm hover:shadow flex items-center space-x-1.5"
            title="Simulate congestion influx"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden lg:inline">Surge Simulator</span>
          </button>

          {/* FlutterFire & Hosting Hub */}
          <button
            onClick={onOpenFlutterFireHub}
            className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 rounded-xl text-xs font-medium border border-purple-200/80 transition shadow-sm hover:shadow flex items-center space-x-1.5"
            title="Inspect FlutterFire & Firebase Hosting configurations"
          >
            <Flame className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden lg:inline">Hosting & FlutterFire</span>
          </button>

          {/* New Patient Intake Button */}
          <button
            onClick={onOpenNewCheckIn}
            className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-xl text-xs shadow-sm hover:shadow-md transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Intake</span>
          </button>

          {/* Staff Auth */}
          {user ? (
            <div className="flex items-center space-x-1.5 pl-1 border-l border-purple-100">
              <div
                className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 border border-purple-300 flex items-center justify-center text-xs font-semibold shadow-sm"
                title={user.email}
              >
                {user.email?.charAt(0).toUpperCase() || 'S'}
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-slate-700 rounded-xl text-xs font-medium border border-purple-200/80 transition shadow-sm flex items-center space-x-1.5"
              title="Hospital Staff Google Sign-In"
            >
              <LogIn className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Staff Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
