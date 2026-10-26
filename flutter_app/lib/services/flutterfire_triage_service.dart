import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import '../models/patient_model.dart';

class FlutterFireTriageService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Real-time Firestore Stream of patient triage queue
  Stream<List<PatientModel>> getPatientQueueStream() {
    return _firestore
        .collection('patients')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return PatientModel.fromFirestore(doc.data(), doc.id);
      }).toList();
    });
  }

  // Real-time stream of hospital congestion capacity
  Stream<DocumentSnapshot<Map<String, dynamic>>> getHospitalCapacityStream() {
    return _firestore.collection('hospital_capacity').doc('main').snapshots();
  }

  // Submit patient check-in to Congestion Control AI API and store in Firestore
  Future<PatientModel> submitCheckInAndTriage({
    required String patientName,
    required String phone,
    required int age,
    required String symptoms,
    required String apiBaseUrl,
  }) async {
    // 1. Call Gemini AI Smart Congestion Control endpoint
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

    if (response.statusCode != 200) {
      throw Exception('Failed to obtain AI triage: ${response.body}');
    }

    final data = jsonDecode(response.body);

    final String urgency = data['triage_urgency'] ?? 'Non-Urgent';
    final String strategy = data['wait_strategy'] ?? 'Wait at Home';
    final String arrivalWindow = data['recommended_arrival_time'] ?? '';
    final String mitigation = data['congestion_mitigation_action'] ?? '';
    final String smsMsg = data['queue_token_message'] ?? '';

    final tokenPrefix = urgency == 'Emergency' ? 'EM' : urgency == 'Urgent' ? 'UR' : 'NO';
    final queueToken = '$tokenPrefix-${(100 + (DateTime.now().millisecond % 900))}';

    String initialStatus = 'registered';
    String assignedZone = 'Home / Remote Queue';

    if (strategy == 'Report Directly to Triage Bed') {
      initialStatus = 'in_bed';
      assignedZone = 'Direct Resuscitation Bed ER-01';
    } else if (strategy == 'Divert to Telehealth') {
      initialStatus = 'diverted_telehealth';
      assignedZone = 'Virtual Telehealth Hub';
    } else if (strategy == 'Wait in Secondary Zone') {
      initialStatus = 'arrived';
      assignedZone = 'Minor Trauma Annex Wing B';
    } else {
      initialStatus = 'waiting_remote';
      assignedZone = 'Digital Remote Queue / Home';
    }

    final docRef = _firestore.collection('patients').doc();
    final patient = PatientModel(
      id: docRef.id,
      patientName: patientName,
      phone: phone,
      age: age,
      symptoms: symptoms,
      triageUrgency: urgency,
      waitStrategy: strategy,
      recommendedArrivalTime: arrivalWindow,
      congestionMitigationAction: mitigation,
      queueTokenMessage: smsMsg,
      status: initialStatus,
      assignedBedOrZone: assignedZone,
      queueToken: queueToken,
      estimatedWaitMinutes: urgency == 'Emergency' ? 0 : 45,
      createdAt: DateTime.now(),
    );

    // Save directly to Firestore via FlutterFire
    await docRef.set(patient.toFirestore());

    return patient;
  }

  // Update status (e.g. en_route, arrived, completed)
  Future<void> updatePatientStatus(String patientId, String newStatus) async {
    await _firestore.collection('patients').doc(patientId).update({
      'status': newStatus,
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }
}
