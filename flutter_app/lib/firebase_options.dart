// File generated for FlutterFire integration
// Smart Hospital Congestion Control AI
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBipDOXsHVDnjmgXh17q-artWmkBl9K2gU',
    appId: '1:510538952274:web:b8852d9c70de6a57a1b98b',
    messagingSenderId: '510538952274',
    projectId: 'smart-hospital-congestion-ctrl',
    authDomain: 'smart-hospital-congestion-ctrl.firebaseapp.com',
    storageBucket: 'smart-hospital-congestion-ctrl.firebasestorage.app',
    measurementId: 'G-KRVNK3RL6E',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDkX9ChEAitRawOJ82P_l6ZAFf0GXvL9-g',
    appId: '1:510538952274:android:ac26d32249276d21a1b98b',
    messagingSenderId: '510538952274',
    projectId: 'smart-hospital-congestion-ctrl',
    storageBucket: 'smart-hospital-congestion-ctrl.firebasestorage.app',
  );
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBqig-VbFkiFcUvwdQAk98J8d5X_kaPdJE',
    appId: '1:866129014808:ios:507a7b3feae57f3351536d',
    messagingSenderId: '866129014808',
    projectId: 'gen-lang-client-0027463707',
    storageBucket: 'gen-lang-client-0027463707.firebasestorage.app',
    iosBundleId: 'com.smarthospital.congestioncontrol',
  );
}
