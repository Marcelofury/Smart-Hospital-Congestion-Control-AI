import React, { useState } from 'react';
import { X, Flame, Copy, Check, Terminal, Code2, Cloud, Layers, Smartphone } from 'lucide-react';

interface FlutterFireHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FLUTTER_FILES: Record<string, { label: string; language: string; content: string }> = {
  'firebase_options.dart': {
    label: 'lib/firebase_options.dart',
    language: 'dart',
    content: `// File generated for FlutterFire integration
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android: return android;
      case TargetPlatform.iOS: return ios;
      default: return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBqig-VbFkiFcUvwdQAk98J8d5X_kaPdJE',
    appId: '1:866129014808:web:507a7b3feae57f3351536d',
    messagingSenderId: '866129014808',
    projectId: 'gen-lang-client-0027463707',
    authDomain: 'gen-lang-client-0027463707.firebaseapp.com',
    storageBucket: 'gen-lang-client-0027463707.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBqig-VbFkiFcUvwdQAk98J8d5X_kaPdJE',
    appId: '1:866129014808:android:507a7b3feae57f3351536d',
    messagingSenderId: '866129014808',
    projectId: 'gen-lang-client-0027463707',
    storageBucket: 'gen-lang-client-0027463707.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBqig-VbFkiFcUvwdQAk98J8d5X_kaPdJE',
    appId: '1:866129014808:ios:507a7b3feae57f3351536d',
    messagingSenderId: '866129014808',
    projectId: 'gen-lang-client-0027463707',
    storageBucket: 'gen-lang-client-0027463707.firebasestorage.app',
    iosBundleId: 'com.smarthospital.congestioncontrol',
  );
}`,
  },
  'flutterfire_service.dart': {
    label: 'lib/services/flutterfire_triage_service.dart',
    language: 'dart',
    content: `import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import '../models/patient_model.dart';

class FlutterFireTriageService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Real-time Firestore stream of patient queue
  Stream<List<PatientModel>> getPatientQueueStream() {
    return _firestore
        .collection('patients')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => PatientModel.fromFirestore(doc.data(), doc.id)).toList();
    });
  }

  // Submit triage check-in and write directly to Cloud Firestore
  Future<PatientModel> submitCheckInAndTriage({
    required String patientName,
    required String phone,
    required int age,
    required String symptoms,
    required String apiBaseUrl,
  }) async {
    final response = await http.post(
      Uri.parse('$apiBaseUrl/api/triage'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'patientName': patientName,
        'age': age,
        'phone': phone,
        'symptoms': symptoms,
      }),
    );

    final data = jsonDecode(response.body);
    final docRef = _firestore.collection('patients').doc();
    final patient = PatientModel(
      id: docRef.id,
      patientName: patientName,
      phone: phone,
      age: age,
      symptoms: symptoms,
      triageUrgency: data['triage_urgency'],
      waitStrategy: data['wait_strategy'],
      recommendedArrivalTime: data['recommended_arrival_time'],
      congestionMitigationAction: data['congestion_mitigation_action'],
      queueTokenMessage: data['queue_token_message'],
      status: data['wait_strategy'] == 'Report Directly to Triage Bed' ? 'in_bed' : 'waiting_remote',
      assignedBedOrZone: data['wait_strategy'] == 'Report Directly to Triage Bed' ? 'Direct Bed ER-01' : 'Remote Queue',
      queueToken: 'TK-\${DateTime.now().millisecond}',
      estimatedWaitMinutes: data['triage_urgency'] == 'Emergency' ? 0 : 45,
      createdAt: DateTime.now(),
    );

    await docRef.set(patient.toFirestore());
    return patient;
  }
}`,
  },
  'firebase.json': {
    label: 'firebase.json (Firebase Hosting Config)',
    language: 'json',
    content: `{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}`,
  },
  'pubspec.yaml': {
    label: 'pubspec.yaml (FlutterFire Dependencies)',
    language: 'yaml',
    content: `name: smart_hospital_congestion_control
description: "Smart Hospital Congestion Control AI with FlutterFire and Firestore."
version: 1.0.0+1

environment:
  sdk: ">=3.2.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.1.0
  cloud_firestore: ^5.0.1
  firebase_auth: ^5.1.0
  http: ^1.2.1

flutter:
  uses-material-design: true`,
  },
};

export const FlutterFireHubModal: React.FC<FlutterFireHubModalProps> = ({ isOpen, onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('firebase_options.dart');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentFile = FLUTTER_FILES[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-purple-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-purple-50/70 px-6 py-4 flex items-center justify-between border-b border-purple-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl border border-purple-200">
              <Flame className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">FlutterFire & Firebase Hosting Hub</h3>
                <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200 font-semibold">
                  Hosting Ready
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connected Project: <span className="text-purple-700 font-mono font-medium">gen-lang-client-0027463707</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-purple-100/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Architecture Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 flex items-center space-x-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Flutter & FlutterFire</div>
                <div className="text-[11px] text-slate-500">cloud_firestore 5.0.1</div>
              </div>
            </div>

            <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 flex items-center space-x-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-sm">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Cloud Firestore DB</div>
                <div className="text-[11px] text-purple-700 font-medium">onSnapshot Active</div>
              </div>
            </div>

            <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 flex items-center space-x-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-white text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-sm">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Firebase Hosting</div>
                <div className="text-[11px] text-slate-500">firebase.json Configured</div>
              </div>
            </div>
          </div>

          {/* Quick CLI Commands */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono text-purple-300 flex items-center space-x-1.5 font-semibold">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Deploy to Firebase Hosting</span>
              </span>
            </div>
            <pre className="text-xs font-mono text-purple-200 overflow-x-auto leading-relaxed p-2 bg-slate-950 rounded-lg">
              <code>{`# 1. Build application\nnpm run build   # Or for Flutter: flutter build web\n\n# 2. Deploy to Firebase Hosting & Firestore Rules\nfirebase deploy --only hosting,firestore`}</code>
            </pre>
          </div>

          {/* File Picker & Code Viewer */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.keys(FLUTTER_FILES).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveFile(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    activeFile === key
                      ? 'bg-purple-700 text-white font-semibold shadow-sm'
                      : 'bg-purple-50 text-slate-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute right-3 top-3 z-10 flex items-center space-x-2">
                <span className="text-[11px] font-mono text-slate-400">{currentFile.label}</span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded border border-slate-600 flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="p-4 pt-10 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-purple-200 overflow-x-auto max-h-72 leading-relaxed shadow-inner">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-purple-50/40 px-6 py-3 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500">
          <span>Configured in /flutter_app/ and /firebase.json</span>
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
