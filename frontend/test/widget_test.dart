import 'package:flutter_test/flutter_test.dart';

// Widget tests requiring Firebase / RevenueCat initialisation are run
// as integration tests. This file intentionally left minimal to avoid
// false failures in CI without a device.
void main() {
  test('placeholder', () => expect(true, isTrue));
}
