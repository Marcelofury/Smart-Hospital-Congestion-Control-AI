import 'dart:convert';
import 'package:http/http.dart' as http;

class EvaluationResult {
  final String triageUrgency;
  final String waitStrategy;
  final String recommendedArrivalTime;
  final String congestionMitigationAction;
  final String queueTokenMessage;
  final String? clinicalSummary;
  final String? assignedBedOrZone;
  final int? estimatedWaitMinutes;

  EvaluationResult({
    required this.triageUrgency,
    required this.waitStrategy,
    required this.recommendedArrivalTime,
    required this.congestionMitigationAction,
    required this.queueTokenMessage,
    this.clinicalSummary,
    this.assignedBedOrZone,
    this.estimatedWaitMinutes,
  });

  factory EvaluationResult.fromMap(Map<String, dynamic> data) {
    return EvaluationResult(
      triageUrgency: data['triage_urgency'] ?? 'Non-Urgent',
      waitStrategy: data['wait_strategy'] ?? 'Wait at Home',
      recommendedArrivalTime: data['recommended_arrival_time'] ?? '',
      congestionMitigationAction: data['congestion_mitigation_action'] ?? '',
      queueTokenMessage: data['queue_token_message'] ?? '',
      clinicalSummary: data['clinical_summary'],
      assignedBedOrZone: data['assigned_bed_or_zone'],
      estimatedWaitMinutes: data['estimated_wait_minutes'],
    );
  }
}

class HospitalCapacityPayload {
  final int waitingRoomOccupancy;
  final int waitingRoomMaxCapacity;
  final int triageBedsOccupied;
  final int totalTriageBeds;
  final String congestionLevel;

  HospitalCapacityPayload({
    required this.waitingRoomOccupancy,
    required this.waitingRoomMaxCapacity,
    required this.triageBedsOccupied,
    required this.totalTriageBeds,
    required this.congestionLevel,
  });

  Map<String, dynamic> toMap() => {
        'waitingRoomOccupancy': waitingRoomOccupancy,
        'waitingRoomMaxCapacity': waitingRoomMaxCapacity,
        'triageBedsOccupied': triageBedsOccupied,
        'totalTriageBeds': totalTriageBeds,
        'congestionLevel': congestionLevel,
      };
}

class VitalsPayload {
  final int? heartRate;
  final int? bpSystolic;
  final int? bpDiastolic;
  final int? o2Sat;
  final int? painScale;

  VitalsPayload({
    this.heartRate,
    this.bpSystolic,
    this.bpDiastolic,
    this.o2Sat,
    this.painScale,
  });

  Map<String, dynamic> toMap() => {
        if (heartRate != null) 'heartRate': heartRate,
        if (bpSystolic != null) 'bpSystolic': bpSystolic,
        if (bpDiastolic != null) 'bpDiastolic': bpDiastolic,
        if (o2Sat != null) 'o2Sat': o2Sat,
        if (painScale != null) 'painScale': painScale,
      };
}

class ApiService {
  final String baseUrl;
  final http.Client _client;

  ApiService({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  Future<EvaluationResult> evaluateTriage({
    required String patientName,
    required int age,
    required String phone,
    required String symptoms,
    VitalsPayload? vitals,
    HospitalCapacityPayload? hospitalCapacity,
  }) async {
    final uri = Uri.parse('$baseUrl/api/triage');
    final response = await _client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'patientName': patientName,
        'age': age,
        'phone': phone,
        'symptoms': symptoms,
        if (vitals != null) 'vitals': vitals.toMap(),
        if (hospitalCapacity != null) 'hospitalCapacity': hospitalCapacity.toMap(),
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Triage API error: ${response.body}');
    }

    return EvaluationResult.fromMap(jsonDecode(response.body));
  }
}