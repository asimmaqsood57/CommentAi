class Draft {
  final String id;
  final String title;
  final String content;
  final String platform;
  final DateTime createdAt;

  const Draft({
    required this.id,
    required this.title,
    required this.content,
    required this.platform,
    required this.createdAt,
  });

  factory Draft.fromJson(Map<String, dynamic> json) => Draft(
        id: json['id'] as String,
        title: json['title'] as String,
        content: json['content'] as String,
        platform: json['platform'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
