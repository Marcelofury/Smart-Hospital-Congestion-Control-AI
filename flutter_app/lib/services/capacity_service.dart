import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart' show Firebase, FirebaseApp;

class CapacityModel {
  final int waitingRoomOccupancy;
  final int waitingRoomMaxCapacity;
  final int triageBedsOccupied;
  final int totalTriageBeds;
  final String congestionLevel;
  final String lastUpdated;

  CapacityModel({
    required this.waitingRoomOccupancy,
    required this.waitingRoomMaxCapacity,
    required this.triageBedsOccupied,
    required this.totalTriageBeds,
    required this.congestionLevel,
    required this.lastUpdated,
  });

  factory CapacityModel.fromFirestore(Map<String, dynamic> data) {
    return CapacityModel(
      waitingRoomOccupancy: data['waitingRoomOccupancy'] ?? 0,
      waitingRoomMaxCapacity: data['waitingRoomMaxCapacity'] ?? 25,
      triageBedsOccupied: data['triageBedsOccupied'] ?? 0,
      totalTriageBeds: data['totalTriageBeds'] ?? 10,
      congestionLevel: data['congestionLevel'] ?? 'Low',
      lastUpdated: data['lastUpdated'] ?? '',
    );
  }

  double get occupancyRatio => waitingRoomMaxCapacity > 0
      ? waitingRoomOccupancy / waitingRoomMaxCapacity
      : 0.0;

  bool get isCritical => occupancyRatio >= 0.9;
  bool get isHigh => occupancyRatio >= 0.7;
  bool get isModerate => occupancyRatio >= 0.5;
}

class CapacityService {
  final FirebaseFirestore _firestore;

  CapacityService({FirebaseApp? app})
      : _firestore = FirebaseFirestore.instanceFor(app: app ?? Firebase.app());

  Stream<CapacityModel> getCapacityStream() {
    return _firestore
        .collection('hospital_capacity')
        .doc('main')
        .snapshots()
        .map((doc) {
      if (!doc.exists || doc.data() == null) {
        return CapacityModel(
          waitingRoomOccupancy: 0,
          waitingRoomMaxCapacity: 25,
          triageBedsOccupied: 0,
          totalTriageBeds: 10,
          congestionLevel: 'Low',
          lastUpdated: '',
        );
      }
      return CapacityModel.fromFirestore(doc.data()!);
    });
  }

  Future<void> updateCapacity({
    int? waitingRoomOccupancy,
    int? waitingRoomMaxCapacity,
    int? triageBedsOccupied,
    int? totalTriageBeds,
    String? congestionLevel,
  }) async {
    final update = <String, dynamic>{
      'updatedAt': DateTime.now().toIso8601String(),
    };
    if (waitingRoomOccupancy != null) update['waitingRoomOccupancy'] = waitingRoomOccupancy;
    if (waitingRoomMaxCapacity != null) update['waitingRoomMaxCapacity'] = waitingRoomMaxCapacity;
    if (triageBedsOccupied != null) update['triageBedsOccupied'] = triageBedsOccupied;
    if (totalTriageBeds != null) update['totalTriageBeds'] = totalTriageBeds;
    if (congestionLevel != null) update['congestionLevel'] = congestionLevel;
    await _firestore.collection('hospital_capacity').doc('main').set(update, SetOptions(merge: true));
  }
}