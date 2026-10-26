import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/flutterfire_auth_service.dart';
import 'auth_screen.dart';
import 'hospital_queue.dart';
import 'capacity_screen.dart';
import 'user_management_screen.dart';

class StaffDashboardScreen extends StatefulWidget {
  const StaffDashboardScreen({super.key});

  @override
  State<StaffDashboardScreen> createState() => _StaffDashboardScreenState();
}

class _StaffDashboardScreenState extends State<StaffDashboardScreen> {
  Future<void> _signOut() async {
    await FlutterFireAuthService().signOut();
    if (mounted) Navigator.pushReplacementNamed(context, '/auth');
  }

  Widget _tile(BuildContext context, IconData icon, String title, String subtitle, bool enabled, VoidCallback onTap) {
    return Card(
      color: const Color(0xFF1E293B),
      child: ListTile(
        leading: Icon(icon, color: enabled ? Colors.tealAccent : Colors.white38),
        title: Text(title,
            style: TextStyle(fontWeight: FontWeight.bold, color: enabled ? Colors.white : Colors.white38)),
        subtitle: Text(subtitle,
            style: TextStyle(color: enabled ? Colors.white70 : Colors.white38)),
        trailing: Icon(Icons.chevron_right, color: enabled ? Colors.tealAccent : Colors.white38),
        onTap: enabled ? onTap : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<UserProfile?>(
      stream: FlutterFireAuthService().getUserProfileStream(),
      builder: (context, snapshot) {
        final profile = snapshot.data;
        final role = profile?.role ?? UserRole.patientGuest;
        if (profile == null || !profile.active) {
          return AuthScreen();
        }
        return Scaffold(
          backgroundColor: const Color(0xFF0F172A),
          appBar: AppBar(
            title: const Text('Staff Command Center'),
            backgroundColor: const Color(0xFF7C3AED),
            centerTitle: true,
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Chip(
                  label: Text(role.toString().replaceFirst('UserRole.', ''), style: const TextStyle(fontSize: 11)),
                  backgroundColor: Colors.teal.withOpacity(0.2),
                ),
              ),
              IconButton(icon: const Icon(Icons.logout, color: Colors.white), onPressed: _signOut),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Role-Based Access',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.tealAccent)),
              const SizedBox(height: 8),
              Text('Signed in as ${profile.displayName ?? profile.email ?? role.toString()}',
                  style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 20),
              _tile(context, Icons.list_alt, 'Live Patient Queue',
                  'View and update patient statuses', RBAC.hasPermission(role, 'viewAllPatients'), () {
                Navigator.pushNamed(context, '/hospital-queue');
              }),
              _tile(context, Icons.heat_pump, 'Manage Hospital Capacity',
                  'Adjust waiting room and triage bed occupancy', RBAC.hasPermission(role, 'manageCapacity'), () {
                Navigator.pushNamed(context, '/capacity');
              }),
              _tile(context, Icons.people, 'User Management',
                  'Create and manage staff user accounts', RBAC.hasPermission(role, 'manageUsers'), () {
                Navigator.pushNamed(context, '/user-management');
              }),
              _tile(context, Icons.admin_panel_settings, 'System Administration',
                  'Full system configuration access', RBAC.hasPermission(role, 'manageSystem'), () {
                Navigator.pushNamed(context, '/user-management');
              }),
              const SizedBox(height: 20),
              const Text('Your Permissions',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white70)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  'viewAllPatients', 'updatePatientStatus', 'overrideTriage', 'assignBeds',
                  'manageCapacity', 'accessSimulator', 'accessCommandDashboard', 'manageUsers', 'manageSystem'
                ].map((perm) {
                  final has = RBAC.hasPermission(role, perm);
                  return Chip(
                    label: Text(perm, style: TextStyle(fontSize: 10, color: has ? Colors.white : Colors.white38)),
                    backgroundColor: has ? Colors.teal.withOpacity(0.2) : Colors.white10,
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}
