import 'package:flutter/material.dart';
import '../models/patient_model.dart';
import '../services/flutterfire_triage_service.dart';
import '../models/user_model.dart';

class HospitalQueueScreen extends StatefulWidget {
  const HospitalQueueScreen({super.key});

  @override
  State<HospitalQueueScreen> createState() => _HospitalQueueScreenState();
}

class _HospitalQueueScreenState extends State<HospitalQueueScreen> {
  final _service = FlutterFireTriageService();

  Future<void> _updateStatus(String patientId, String newStatus) async {
    await _service.updatePatientStatus(patientId, newStatus);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status updated to $newStatus')),
      );
    }
  }

  void _showStatusDialog(PatientModel p) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        String newStatus = p.status;
        return AlertDialog(
          title: Text('Update Status: ${p.patientName}'),
          content: DropdownButtonFormField<String>(
            value: newStatus,
            items: const [
              'registered', 'waiting_remote', 'arrived', 'in_bed', 'diverted_telehealth', 'completed'
            ].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => newStatus = v ?? p.status,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                _updateStatus(p.id, newStatus);
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Firestore Queue Stream'),
        backgroundColor: const Color(0xFF0F172A),
        centerTitle: true,
      ),
      body: StreamBuilder<List<PatientModel>>(
        stream: _service.getPatientQueueStream(),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text('Error: ${snapshot.error}'));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final list = snapshot.data!;
          return ListView.builder(
            itemCount: list.length,
            itemBuilder: (context, i) {
              final p = list[i];
              final isEmergency = p.triageUrgency == 'Emergency';
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: isEmergency ? Colors.red : Colors.teal,
                  child: Text(p.queueToken.split('-').last),
                ),
                title: Text(p.patientName),
                subtitle: Text('${p.triageUrgency} • ${p.waitStrategy} • ${p.status}'),
                trailing: IconButton(
                  icon: const Icon(Icons.edit, color: Colors.tealAccent),
                  onPressed: () => _showStatusDialog(p),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
