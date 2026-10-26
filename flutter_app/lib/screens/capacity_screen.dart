import 'package:flutter/material.dart';
import '../services/capacity_service.dart';

class CapacityScreen extends StatefulWidget {
  const CapacityScreen({super.key});

  @override
  State<CapacityScreen> createState() => _CapacityScreenState();
}

class _CapacityScreenState extends State<CapacityScreen> {
  final _service = CapacityService();
  final _occController = TextEditingController();
  final _maxController = TextEditingController();
  final _bedsOccController = TextEditingController();
  final _bedsTotalController = TextEditingController();

  Future<void> _update() async {
    await _service.updateCapacity(
      waitingRoomOccupancy: int.tryParse(_occController.text),
      waitingRoomMaxCapacity: int.tryParse(_maxController.text),
      triageBedsOccupied: int.tryParse(_bedsOccController.text),
      totalTriageBeds: int.tryParse(_bedsTotalController.text),
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Capacity updated')));
    }
  }

  @override
  void dispose() {
    _occController.dispose();
    _maxController.dispose();
    _bedsOccController.dispose();
    _bedsTotalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hospital Capacity'),
        backgroundColor: const Color(0xFF0F172A),
        centerTitle: true,
      ),
      body: StreamBuilder(
        stream: _service.getCapacityStream(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final cap = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Live Capacity', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Card(
                color: const Color(0xFF1E293B),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      LinearProgressIndicator(
                        value: cap.occupancyRatio.clamp(0.0, 1.0),
                        color: cap.isCritical ? Colors.red : cap.isHigh ? Colors.orange : Colors.teal,
                        backgroundColor: Colors.white10,
                      ),
                      const SizedBox(height: 8),
                      Text('Occupancy: ${cap.waitingRoomOccupancy}/${cap.waitingRoomMaxCapacity} '
                          '(${ (cap.occupancyRatio * 100).toStringAsFixed(0)}%)',
                          style: const TextStyle(color: Colors.white)),
                      Text('Triage Beds: ${cap.triageBedsOccupied}/${cap.totalTriageBeds}',
                          style: const TextStyle(color: Colors.white70)),
                      Text('Congestion Level: ${cap.congestionLevel}',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: cap.isCritical ? Colors.redAccent : Colors.tealAccent)),
                      Text('Last Updated: ${cap.lastUpdated}',
                          style: const TextStyle(fontSize: 11, color: Colors.white54)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Update Capacity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _field(_occController, 'Waiting Room Occupancy')),
                  const SizedBox(width: 12),
                  Expanded(child: _field(_maxController, 'Max Capacity')),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _field(_bedsOccController, 'Triage Beds Occupied')),
                  const SizedBox(width: 12),
                  Expanded(child: _field(_bedsTotalController, 'Total Triage Beds')),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _update,
                  icon: const Icon(Icons.save),
                  label: const Text('Save Changes'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0D9488)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _field(TextEditingController c, String label) {
    return TextField(
      controller: c,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
      style: const TextStyle(color: Colors.white),
    );
  }
}
