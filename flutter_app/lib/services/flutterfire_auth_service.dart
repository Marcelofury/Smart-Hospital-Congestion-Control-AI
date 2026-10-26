import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_model.dart';

class FlutterFireAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  Future<UserProfile?> getUserProfile() async {
    final user = _auth.currentUser;
    if (user == null) return null;

    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists && doc.data() != null) {
        return UserProfile.fromFirestore(doc.data()!);
      }
      // Create profile if doesn't exist
      return await createUserProfile(user);
    } catch (e) {
      print('Error getting user profile: ');
      return null;
    }
  }

  Stream<UserProfile?> getUserProfileStream() {
    final user = _auth.currentUser;
    if (user == null) return Stream.value(null);

    return _firestore.collection('users').doc(user.uid).snapshots().map((doc) {
      if (doc.exists && doc.data() != null) {
        return UserProfile.fromFirestore(doc.data()!);
      }
      return null;
    });
  }

  Future<UserProfile> createUserProfile(User user, {UserRole? role}) async {
    UserRole userRole = role ?? _getDefaultRoleForEmail(user.email);
    final now = DateTime.now();
    
    final profile = UserProfile(
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: userRole,
      createdAt: now,
      updatedAt: now,
      active: true,
    );

    await _firestore.collection('users').doc(user.uid).set(profile.toFirestore());
    return profile;
  }

  UserRole _getDefaultRoleForEmail(String? email) {
    if (email == null) return UserRole.patientGuest;
    if (email.endsWith('@hospital.org')) {
      return UserRole.triageNurse;
    }
    return UserRole.patientRegistered;
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
