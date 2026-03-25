import 'package:flutter/material.dart';

const kPlatforms = ['linkedin', 'instagram', 'twitter', 'youtube', 'facebook', 'reddit'];

class PlatformSelector extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onSelect;

  const PlatformSelector({super.key, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: kPlatforms.map((p) {
          final isSelected = p == selected;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(p[0].toUpperCase() + p.substring(1)),
              selected: isSelected,
              onSelected: (_) => onSelect(p),
            ),
          );
        }).toList(),
      ),
    );
  }
}
