import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:comment_ai/core/api/api_client.dart';
import 'package:comment_ai/core/models/draft.dart';

class DraftsScreen extends StatefulWidget {
  const DraftsScreen({super.key});

  @override
  State<DraftsScreen> createState() => _DraftsScreenState();
}

class _DraftsScreenState extends State<DraftsScreen> {
  List<Draft> _drafts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.instance.get('/drafts');
      setState(() {
        _drafts = (data as List).map((d) => Draft.fromJson(d)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _delete(Draft draft) async {
    await ApiClient.instance.delete('/drafts/${draft.id}');
    setState(() => _drafts.remove(draft));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved Drafts')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _drafts.isEmpty
              ? const Center(child: Text('No drafts saved yet.'))
              : ListView.builder(
                  itemCount: _drafts.length,
                  itemBuilder: (ctx, i) {
                    final draft = _drafts[i];
                    return Dismissible(
                      key: Key(draft.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        color: Colors.red,
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 16),
                        child: const Icon(Icons.delete, color: Colors.white),
                      ),
                      onDismissed: (_) => _delete(draft),
                      child: ListTile(
                        title: Text(draft.title),
                        subtitle: Text(draft.platform, style: const TextStyle(fontSize: 12)),
                        trailing: IconButton(
                          icon: const Icon(Icons.copy),
                          onPressed: () async {
                            await Clipboard.setData(ClipboardData(text: draft.content));
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Copied! Go paste it.')),
                              );
                            }
                          },
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
