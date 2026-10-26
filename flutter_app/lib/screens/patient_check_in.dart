import 'package:flutter/material.dart';
import '../models/patient_model.dart';
import '../services/flutterfire_triage_service.dart';
import '../services/flutterfire_auth_service.dart';
import 'hospital_queue.dart';

class PatientHomeScreen extends StatelessWidget {
  const PatientHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Check-In'),
        backgroundColor: const Color(0xFF0F172A),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await FlutterFireAuthService().signOut();
            },
          ),
        ],
      ),
      body: const PatientCheckInScreen(),
    );
  }
}

class PatientCheckInScreen extends StatefulWidget {
  const PatientCheckInScreen({super.key});

  @override
  State<PatientCheckInScreen> createState() => _PatientCheckInScreenState();
}

class _PatientCheckInScreenState extends State<PatientCheckInScreen> {
  final _service = FlutterFireTriageService();
  final _nameController = TextEditingController(text: 'Taylor Reed');
  final _phoneController = TextEditingController(text: '+1 (555) 304-9982');
  final _ageController = TextEditingController(text: '32');
  final _symptomsController = TextEditingController();
  bool _isLoading = false;

  void _submit() async {
    if (_symptomsController.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final patient = await _service.submitCheckInAndTriage(
        patientName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        age: int.tryParse(_ageController.text) ?? 30,
        symptoms: _symptomsController.text.trim(),
        apiBaseUrl: 'https://smart-hospital-congestion-control-ai.onrender.com', // Uses backend triage endpoint
      );

      if (!mounted) return;
      Navigator.pushNamed(context, '/queue-pass', arguments: patient);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            color: const Color(0xFF1E293B),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Row(
                children: const [
                  Icon(Icons.shield_outlined, color: Colors.tealAccent),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'AI Congestion Rule: Non-urgent patients wait at home or via telehealth to prevent waiting room crowding.',
                      style: TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Patient Name', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _ageController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Age', border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _symptomsController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Describe Symptoms',
              hintText: 'e.g. chest pain, ankle sprain, skin rash, high fever...',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _submit,
            icon: _isLoading ? const CircularProgressIndicator() : const Icon(Icons.local_hospital),
            label: Text(_isLoading ? 'AI Analyzing Bottlenecks...' : 'Submit & Receive Queue Token'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ],
      ),
    );
  }
}

class DigitalQueuePassScreen extends StatelessWidget {
  final PatientModel patient;
  const DigitalQueuePassScreen({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    final isEmergency = patient.triageUrgency == 'Emergency';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Digital Boarding Pass'),
        backgroundColor: const Color(0xFF0F172A),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Card(
              color: isEmergency ? const Color(0xFF450A0A) : const Color(0xFF1E293B),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Text('TOKEN: ${patient.queueToken}',
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.tealAccent)),
                    const SizedBox(height: 8),
                    Text(patient.patientName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Chip(
                      label: Text(patient.triageUrgency),
                      backgroundColor: isEmergency ? Colors.red : Colors.teal,
                    ),
                    const Divider(),
                    Text('Wait Strategy: ${patient.waitStrategy}',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Arrival Time: ${patient.recommendedArrivalTime}',
                        style: const TextStyle(color: Colors.amberAccent)),
                    const SizedBox(height: 8),
                    Text(patient.congestionMitigationAction,
                        style: const TextStyle(fontSize: 12, color: Colors.white70),
                        textAlign: TextAlign.center),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              color: const Color(0xFF1E1B2E),
              child: ListTile(
                leading: const Icon(Icons.sms, color: Color(0xFFC084FC)),
                title: const Text('SMS Update Dispatched',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                subtitle: Text(patient.queueTokenMessage, style: const TextStyle(fontSize: 11)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
