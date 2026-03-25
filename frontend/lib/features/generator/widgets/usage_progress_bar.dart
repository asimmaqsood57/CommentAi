import 'package:flutter/material.dart';
import 'package:comment_ai/core/models/user.dart';

class UsageProgressBar extends StatelessWidget {
  final UserModel user;

  const UsageProgressBar({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    if (!user.isFree || user.generationsLimit == null) return const SizedBox.shrink();

    final used = user.generationsToday;
    final limit = user.generationsLimit!;
    final progress = (used / limit).clamp(0.0, 1.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$used / $limit generations today', style: Theme.of(context).textTheme.bodySmall),
            if (used >= limit)
              const Text('Limit reached', style: TextStyle(color: Colors.red, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: Colors.grey[200],
          color: progress >= 1.0 ? Colors.red : Theme.of(context).colorScheme.primary,
        ),
      ],
    );
  }
}
