package com.eatechnologies.comment_ai

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {

    private val CHANNEL = "com.eatechnologies.comment_ai/screenshot"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {

                    "isAccessibilityEnabled" -> {
                        result.success(CommentAiAccessibilityService.instance != null)
                    }

                    "openAccessibilitySettings" -> {
                        startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                        result.success(null)
                    }

                    "captureScreen" -> {
                        val service = CommentAiAccessibilityService.instance
                        if (service == null) {
                            result.error("NOT_ENABLED", "Accessibility service not enabled", null)
                            return@setMethodCallHandler
                        }
                        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                            result.error("API_TOO_LOW", "Requires Android 9+", null)
                            return@setMethodCallHandler
                        }
                        service.captureScreen(cacheDir) { path ->
                            runOnUiThread { result.success(path) }
                        }
                    }

                    "bringToFront" -> {
                        val intent = packageManager
                            .getLaunchIntentForPackage(packageName)!!
                            .apply {
                                addFlags(
                                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                                )
                            }
                        startActivity(intent)
                        result.success(null)
                    }

                    "runOcr" -> {
                        val path = call.argument<String>("path")
                        if (path == null) {
                            result.success("")
                            return@setMethodCallHandler
                        }
                        try {
                            val image = InputImage.fromFilePath(this, Uri.fromFile(File(path)))
                            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                            recognizer.process(image)
                                .addOnSuccessListener { visionText -> result.success(visionText.text) }
                                .addOnFailureListener { result.success("") }
                        } catch (e: Exception) {
                            result.success("")
                        }
                    }

                    else -> result.notImplemented()
                }
            }
    }
}
