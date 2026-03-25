import 'package:flutter/material.dart';
import 'package:comment_ai/core/api/api_client.dart';
import 'package:comment_ai/core/models/voice_sample.dart';

class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key});

  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> {
  List<VoiceSample> _samples = [];
  bool _loading = true;
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.instance.get('/voice-samples');
      setState(() {
        _samples = (data as List).map((s) => VoiceSample.fromJson(s)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _add() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    try {
      final data = await ApiClient.instance.post('/voice-samples', {'content': text});
      setState(() {
        _samples.insert(0, VoiceSample.fromJson(data));
        _controller.clear();
      });
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.error)));
      }
    }
  }

  Future<void> _delete(VoiceSample sample) async {
    await ApiClient.instance.delete('/voice-samples/${sample.id}');
    setState(() => _samples.remove(sample));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Voice'),
        actions: [
          if (_samples.isNotEmpty)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Chip(label: Text('Voice Trained')),
            ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Paste a comment you\'ve written...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _add,
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _samples.isEmpty
                    ? const Center(child: Text('No voice samples yet.\nAdd examples of your writing style.', textAlign: TextAlign.center))
                    : ListView.builder(
                        itemCount: _samples.length,
                        itemBuilder: (ctx, i) {
                          final sample = _samples[i];
                          return ListTile(
                            title: Text(sample.content, maxLines: 2, overflow: TextOverflow.ellipsis),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: () => _delete(sample),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
