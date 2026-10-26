class PatientModel {
  final String id;
  final String patientName;
  final String phone;
  final int age;
  final String symptoms;
  final String triageUrgency; // 'Emergency' | 'Urgent' | 'Non-Urgent'
  final String waitStrategy; // 'Wait at Home' | 'Divert to Telehealth' | 'Report Directly to Triage Bed' | 'Wait in Secondary Zone'
  final String recommendedArrivalTime;
  final String congestionMitigationAction;
  final String queueTokenMessage;
  final String status;
  final String assignedBedOrZone;
  final String queueToken;
  final int estimatedWaitMinutes;
  final DateTime createdAt;

  PatientModel({
    required this.id,
    required this.patientName,
    required this.phone,
    required this.age,
    required this.symptoms,
    required this.triageUrgency,
    required this.waitStrategy,
    required this.recommendedArrivalTime,
    required this.congestionMitigationAction,
    required this.queueTokenMessage,
    required this.status,
    required this.assignedBedOrZone,
    required this.queueToken,
    required this.estimatedWaitMinutes,
    required this.createdAt,
  });

  factory PatientModel.fromFirestore(Map<String, dynamic> data, String docId) {
    return PatientModel(
      id: docId,
      patientName: data['patientName'] ?? 'Anonymous',
      phone: data['phone'] ?? '',
      age: data['age'] ?? 30,
      symptoms: data['symptoms'] ?? '',
      triageUrgency: data['triage_urgency'] ?? 'Non-Urgent',
      waitStrategy: data['wait_strategy'] ?? 'Wait at Home',
      recommendedArrivalTime: data['recommended_arrival_time'] ?? '',
      congestionMitigationAction: data['congestion_mitigation_action'] ?? '',
      queueTokenMessage: data['queue_token_message'] ?? '',
      status: data['status'] ?? 'registered',
      assignedBedOrZone: data['assignedBedOrZone'] ?? 'Remote Queue',
      queueToken: data['queueToken'] ?? 'Q-001',
      estimatedWaitMinutes: data['estimatedWaitMinutes'] ?? 45,
      createdAt: data['createdAt'] != null
          ? DateTime.tryParse(data['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'patientName': patientName,
      'phone': phone,
      'age': age,
      'symptoms': symptoms,
      'triage_urgency': triageUrgency,
      'wait_strategy': waitStrategy,
      'recommended_arrival_time': recommendedArrivalTime,
      'congestion_mitigation_action': congestionMitigationAction,
      'queue_token_message': queueTokenMessage,
      'status': status,
      'assignedBedOrZone': assignedBedOrZone,
      'queueToken': queueToken,
      'estimatedWaitMinutes': estimatedWaitMinutes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }
}
