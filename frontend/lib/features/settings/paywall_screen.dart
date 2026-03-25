import 'package:flutter/material.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key});

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  Offerings? _offerings;
  bool _loading = true;
  bool _purchasing = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final offerings = await Purchases.getOfferings();
      setState(() { _offerings = offerings; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _purchase(Package package) async {
    setState(() => _purchasing = true);
    try {
      await Purchases.purchasePackage(package);
      if (mounted) Navigator.pop(context);
    } on PurchasesErrorCode catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Purchase failed: ${e.name}')),
        );
      }
    } finally {
      if (mounted) setState(() => _purchasing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upgrade')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _offerings?.current == null
              ? const Center(child: Text('No plans available.'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    const Text('Choose a Plan', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    ..._offerings!.current!.availablePackages.map((pkg) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(pkg.storeProduct.title),
                          subtitle: Text(pkg.storeProduct.description),
                          trailing: FilledButton(
                            onPressed: _purchasing ? null : () => _purchase(pkg),
                            child: Text(pkg.storeProduct.priceString),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
    );
  }
}
