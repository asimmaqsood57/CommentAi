package com.eatechnologies.comment_ai

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val CHANNEL = "com.eatechnologies.comment_ai/screenshot"
    private val MP_REQUEST_CODE = 1001

    private var pendingResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {

                    // Step 1 — request MediaProjection permission (shows system dialog)
                    "requestScreenshotPermission" -> {
                        pendingResult = result
                        val manager =
                            getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                        startActivityForResult(
                            manager.createScreenCaptureIntent(),
                            MP_REQUEST_CODE
                        )
                    }

                    // Step 2 — capture the screen (permission must already be granted)
                    "captureScreen" -> {
                        val service = ScreenshotService.instance
                        if (service == null) {
                            result.error("SERVICE_NOT_RUNNING", "Screenshot service is not active", null)
                            return@setMethodCallHandler
                        }
                        ScreenshotService.captureCallback = { path ->
                            runOnUiThread { result.success(path) }
                        }
                        service.captureScreen()
                    }

                    else -> result.notImplemented()
                }
            }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == MP_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                // Start the foreground service with the projection token
                val intent = Intent(this, ScreenshotService::class.java).apply {
                    action = ScreenshotService.ACTION_START
                    putExtra(ScreenshotService.EXTRA_RESULT_CODE, resultCode)
                    putExtra(ScreenshotService.EXTRA_DATA, data)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent)
                } else {
                    startService(intent)
                }
                pendingResult?.success(true)
            } else {
                pendingResult?.success(false)
            }
            pendingResult = null
        }
    }
}
