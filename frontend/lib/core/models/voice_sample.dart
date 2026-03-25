class VoiceSample {
  final String id;
  final String content;
  final DateTime createdAt;

  const VoiceSample({
    required this.id,
    required this.content,
    required this.createdAt,
  });

  factory VoiceSample.fromJson(Map<String, dynamic> json) => VoiceSample(
        id: json['id'] as String,
        content: json['content'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
