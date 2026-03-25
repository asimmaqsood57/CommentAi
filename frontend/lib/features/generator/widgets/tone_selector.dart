import 'package:flutter/material.dart';

const kTones = ['professional', 'witty', 'supportive', 'curious', 'contrarian'];

class ToneSelector extends StatelessWidget {
  final List<String> selected;
  final ValueChanged<List<String>> onChanged;

  const ToneSelector({super.key, required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      children: kTones.map((tone) {
        final isSelected = selected.contains(tone);
        return FilterChip(
          label: Text(tone[0].toUpperCase() + tone.substring(1)),
          selected: isSelected,
          onSelected: (val) {
            final updated = List<String>.from(selected);
            val ? updated.add(tone) : updated.remove(tone);
            onChanged(updated);
          },
        );
      }).toList(),
    );
  }
}
