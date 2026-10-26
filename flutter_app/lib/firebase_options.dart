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
}
