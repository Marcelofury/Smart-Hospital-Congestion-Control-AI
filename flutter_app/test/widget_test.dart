import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_hospital_congestion_control/models/patient_model.dart';
import 'package:smart_hospital_congestion_control/screens/patient_check_in.dart';

void main() {
  testWidgets('Digital queue pass shows token and navigation controls',
      (WidgetTester tester) async {
    final patient = PatientModel(
      id: 'test-patient',
      patientName: 'Taylor Reed',
      phone: '+1 555 0100',
      age: 32,
      symptoms: 'mild sore throat',
      triageUrgency: 'Non-Urgent',
      waitStrategy: 'Divert to Telehealth',
      recommendedArrivalTime: 'Virtual Consultation in 15 minutes',
      congestionMitigationAction: 'Route patient to telehealth.',
      queueTokenMessage: 'Virtual Care consultation available now.',
      status: 'diverted_telehealth',
      assignedBedOrZone: 'Virtual Telehealth Hub',
      queueToken: 'NO-123',
      estimatedWaitMinutes: 15,
      createdAt: DateTime(2026, 1, 1),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: DigitalQueuePassScreen(patient: patient),
      ),
    );

    expect(find.text('TOKEN: NO-123'), findsOneWidget);
    expect(find.byIcon(Icons.arrow_back), findsOneWidget);
    expect(find.byIcon(Icons.logout), findsOneWidget);
    expect(find.text('Back to Home'), findsOneWidget);
  });
}
