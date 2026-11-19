import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_core_platform_interface/test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_hospital_congestion_control/screens/patient_check_in.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    setupFirebaseCoreMocks();
    await Firebase.initializeApp();
  });

  testWidgets('patient check-in form renders and requires symptoms',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: PatientCheckInScreen()),
      ),
    );

    expect(find.byType(TextField), findsNWidgets(4));
    expect(find.text('Patient Name'), findsOneWidget);
    expect(find.text('Age'), findsOneWidget);
    expect(find.text('Phone'), findsOneWidget);
    expect(find.text('Describe Symptoms'), findsOneWidget);
    expect(find.byIcon(Icons.local_hospital), findsOneWidget);
    expect(find.text('Submit & Receive Queue Token'), findsOneWidget);

    final submit = find.byType(ElevatedButton);
    expect(submit, findsOneWidget);
    await tester.tap(submit);
    await tester.pump();

    expect(find.text('Check-In Failed'), findsNothing);
  });
}
