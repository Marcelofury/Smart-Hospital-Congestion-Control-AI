enum UserRole {
  patientGuest,
  patientRegistered,
  triageNurse,
  clinician,
  chargeNurse,
  hospitalAdmin,
  systemAdmin,
}

class UserProfile {
  final String uid;
  final String? email;
  final String? displayName;
  final String? photoURL;
  final UserRole role;
  final String? department;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool active;

  UserProfile({
    required this.uid,
    this.email,
    this.displayName,
    this.photoURL,
    required this.role,
    this.department,
    required this.createdAt,
    required this.updatedAt,
    required this.active,
  });

  factory UserProfile.fromFirestore(Map<String, dynamic> data) {
    return UserProfile(
      uid: data['uid'] ?? '',
      email: data['email'],
      displayName: data['displayName'],
      photoURL: data['photoURL'],
      role: roleFromString(data['role'] ?? 'patient_guest'),
      department: data['department'],
      createdAt: data['createdAt'] != null
          ? DateTime.tryParse(data['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: data['updatedAt'] != null
          ? DateTime.tryParse(data['updatedAt']) ?? DateTime.now()
          : DateTime.now(),
      active: data['active'] ?? true,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'photoURL': photoURL,
      'role': roleToString(role),
      'department': department,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'active': active,
    };
  }

  static UserRole roleFromString(String role) {
    switch (role) {
      case 'patient_registered':
        return UserRole.patientRegistered;
      case 'triage_nurse':
        return UserRole.triageNurse;
      case 'clinician':
        return UserRole.clinician;
      case 'charge_nurse':
        return UserRole.chargeNurse;
      case 'hospital_admin':
        return UserRole.hospitalAdmin;
      case 'system_admin':
        return UserRole.systemAdmin;
      default:
        return UserRole.patientGuest;
    }
  }

  static String roleToString(UserRole role) {
    switch (role) {
      case UserRole.patientRegistered:
        return 'patient_registered';
      case UserRole.triageNurse:
        return 'triage_nurse';
      case UserRole.clinician:
        return 'clinician';
      case UserRole.chargeNurse:
        return 'charge_nurse';
      case UserRole.hospitalAdmin:
        return 'hospital_admin';
      case UserRole.systemAdmin:
        return 'system_admin';
      default:
        return 'patient_guest';
    }
  }
}

class RBAC {
  static const Map<UserRole, int> _roleHierarchy = {
    UserRole.patientGuest: 0,
    UserRole.patientRegistered: 1,
    UserRole.triageNurse: 10,
    UserRole.clinician: 15,
    UserRole.chargeNurse: 20,
    UserRole.hospitalAdmin: 30,
    UserRole.systemAdmin: 40,
  };

  static bool hasPermission(UserRole? role, String permission) {
    if (role == null) return false;
    switch (permission) {
      case 'viewAllPatients':
        return _hasAnyRole(role, [UserRole.triageNurse, UserRole.clinician, UserRole.chargeNurse, UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'updatePatientStatus':
        return _hasAnyRole(role, [UserRole.triageNurse, UserRole.clinician, UserRole.chargeNurse, UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'overrideTriage':
        return _hasAnyRole(role, [UserRole.triageNurse, UserRole.chargeNurse, UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'assignBeds':
        return _hasAnyRole(role, [UserRole.triageNurse, UserRole.chargeNurse, UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'manageCapacity':
        return _hasAnyRole(role, [UserRole.chargeNurse, UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'accessSimulator':
        return _hasAnyRole(role, [UserRole.chargeNurse, UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'accessCommandDashboard':
        return _hasAnyRole(role, [UserRole.triageNurse, UserRole.clinician, UserRole.chargeNurse, UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'manageUsers':
        return _hasAnyRole(role, [UserRole.hospitalAdmin, UserRole.systemAdmin]);
      case 'manageSystem':
        return role == UserRole.systemAdmin;
      default:
        return false;
    }
  }

  static bool _hasAnyRole(UserRole role, List<UserRole> allowedRoles) {
    return allowedRoles.contains(role);
  }

  static bool hasRoleLevel(UserRole? role, UserRole minimumRole) {
    if (role == null) return false;
    return (_roleHierarchy[role] ?? 0) >= (_roleHierarchy[minimumRole] ?? 0);
  }

  static bool isStaff(UserRole? role) {
    if (role == null) return false;
    return role != UserRole.patientGuest && role != UserRole.patientRegistered;
  }
}
