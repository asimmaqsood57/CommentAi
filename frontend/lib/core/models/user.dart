class UserModel {
  final String id;
  final String email;
  final String name;
  final String plan;
  final int generationsToday;
  final int? generationsLimit;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.plan,
    required this.generationsToday,
    this.generationsLimit,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String,
        plan: json['plan'] as String,
        generationsToday: json['generationsToday'] as int,
        generationsLimit: json['generationsLimit'] as int?,
      );

  bool get isFree => plan == 'FREE';
  bool get isPro => plan == 'PRO' || plan == 'CREATOR' || plan == 'TEAM';
  bool get isAtLimit =>
      generationsLimit != null && generationsToday >= generationsLimit!;
}
