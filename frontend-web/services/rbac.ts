import { UserRole, UserProfile } from '../types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  patient_guest: 0,
  patient_registered: 1,
  triage_nurse: 10,
  clinician: 15,
  charge_nurse: 20,
  hospital_admin: 30,
  system_admin: 40,
};

export const ROLE_PERMISSIONS = {
  canSubmitTriage: ['patient_guest', 'patient_registered'],
  canViewOwnRecords: ['patient_guest', 'patient_registered'],
  canViewAllPatients: ['triage_nurse', 'clinician', 'charge_nurse', 'hospital_admin', 'system_admin'],
  canUpdatePatientStatus: ['triage_nurse', 'clinician', 'charge_nurse', 'hospital_admin', 'system_admin'],
  canOverrideTriage: ['triage_nurse', 'charge_nurse', 'hospital_admin', 'system_admin'],
  canAssignBeds: ['triage_nurse', 'charge_nurse', 'hospital_admin', 'system_admin'],
  canManageCapacity: ['charge_nurse', 'hospital_admin', 'system_admin'],
  canAccessSimulator: ['charge_nurse', 'hospital_admin', 'system_admin'],
  canViewAnalytics: ['charge_nurse', 'hospital_admin', 'system_admin'],
  canManageUsers: ['hospital_admin', 'system_admin'],
  canManageSystem: ['system_admin'],
  canAccessCommandDashboard: ['triage_nurse', 'clinician', 'charge_nurse', 'hospital_admin', 'system_admin'],
} as const;

export function hasPermission(userRole: UserRole | undefined, permission: keyof typeof ROLE_PERMISSIONS): boolean {
  if (!userRole) return false;
  const allowedRoles = ROLE_PERMISSIONS[permission];
  return (allowedRoles as readonly UserRole[]).includes(userRole);
}

export function hasRoleLevel(userRole: UserRole | undefined, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

export function getDefaultRoleForEmail(email?: string | null): UserRole {
  if (!email) return 'patient_guest';
  if (email.endsWith('@hospital.org')) {
    return 'triage_nurse';
  }
  return 'patient_registered';
}

export function isStaffRole(role: UserRole): boolean {
  return role !== 'patient_guest' && role !== 'patient_registered';
}
