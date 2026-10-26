import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'models/user_model.dart';
import 'models/patient_model.dart';
import 'services/flutterfire_auth_service.dart';
import 'screens/auth_screen.dart';
import 'screens/patient_check_in.dart';
import 'screens/hospital_queue.dart';
import 'screens/staff_dashboard.dart';
import 'screens/capacity_screen.dart';
import 'screens/user_management_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const SmartHospitalCongestionApp());
}

class SmartHospitalCongestionApp extends StatelessWidget {
  const SmartHospitalCongestionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Hospital Congestion Control',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF8B5CF6),
          brightness: Brightness.dark,
          surface: const Color(0xFF0F172A),
        ),
      ),
      home: const AuthWrapper(),
      routes: {
        '/auth': (context) => const AuthScreen(),
        '/patient-home': (context) => const PatientHomeScreen(),
        '/check-in': (context) => const PatientCheckInScreen(),
        '/hospital-queue': (context) => HospitalQueueScreen(),
        '/staff-dashboard': (context) => StaffDashboardScreen(),
        '/capacity': (context) => CapacityScreen(),
        '/user-management': (context) => UserManagementScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/queue-pass') {
          final patient = settings.arguments as PatientModel;
          return MaterialPageRoute(builder: (_) => DigitalQueuePassScreen(patient: patient));
        }
        return null;
      },
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<UserProfile?>(
      stream: FlutterFireAuthService().getUserProfileStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        final profile = snapshot.data;
        if (profile == null || !profile.active) {
          return const AuthScreen();
        }
        switch (profile.role) {
          case UserRole.patientGuest:
          case UserRole.patientRegistered:
            return const PatientHomeScreen();
          default:
            return const StaffDashboardScreen();
        }
      },
    );
  }
}
