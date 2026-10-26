import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

class UserManagementScreen extends StatelessWidget {
  UserManagementScreen({super.key});

  final _firestore = FirebaseFirestore.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        backgroundColor: const Color(0xFF0F172A),
        centerTitle: true,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _firestore.collection('users').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final docs = snapshot.data!.docs;
          return ListView.builder(
            itemCount: docs.length,
            itemBuilder: (context, i) {
              final doc = docs[i];
              final data = doc.data() as Map<String, dynamic>;
              final role = UserProfile.roleFromString(data['role'] ?? 'patient_guest');
              final email = data['email'] ?? 'unknown';
              final active = data['active'] ?? true;
              UserRole? newRole;
              return Card(
                color: const Color(0xFF1E293B),
                child: ListTile(
                  leading: CircleAvatar(child: Text(email.isNotEmpty ? email[0].toUpperCase() : '?')),
                  title: Text(email, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${role.toString().replaceFirst('UserRole.', '')} • ${active ? 'Active' : 'Inactive'}'),
                  trailing: SizedBox(
                    width: 150,
                    child: DropdownButtonFormField<UserRole>(
                      value: role,
                      decoration: const InputDecoration(
                        labelText: 'Role',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: UserRole.values.map((r) {
                        return DropdownMenuItem(value: r, child: Text(r.toString().replaceFirst('UserRole.', '')));
                      }).toList(),
                      onChanged: (v) => newRole = v,
                    ),
                  ),
                  onTap: () async {
                    if (newRole != null && newRole != role) {
                      await _firestore.collection('users').doc(doc.id).update({
                        'role': UserProfile.roleToString(newRole!),
                        'updatedAt': DateTime.now().toIso8601String(),
                      });
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Role updated to ${newRole.toString().replaceFirst('UserRole.', '')}')),
                        );
                      }
                    }
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
