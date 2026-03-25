class Suggestion {
  final String tone;
  final String text;
  final int characterCount;

  const Suggestion({
    required this.tone,
    required this.text,
    required this.characterCount,
  });

  factory Suggestion.fromJson(Map<String, dynamic> json) => Suggestion(
        tone: json['tone'] as String,
        text: json['text'] as String,
        characterCount: json['characterCount'] as int,
      );
}
