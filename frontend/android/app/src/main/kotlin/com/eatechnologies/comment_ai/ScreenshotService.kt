package com.eatechnologies.comment_ai

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import java.io.File
import java.io.FileOutputStream

class ScreenshotService : Service() {

    companion object {
        const val ACTION_START   = "ACTION_START"
        const val ACTION_CAPTURE = "ACTION_CAPTURE"
        const val ACTION_STOP    = "ACTION_STOP"

        const val EXTRA_RESULT_CODE = "RESULT_CODE"
        const val EXTRA_DATA        = "DATA"

        private const val CHANNEL_ID      = "commentai_screenshot_channel"
        private const val NOTIFICATION_ID = 2001

        /** Set by MainActivity so capture() can return the path asynchronously. */
        var captureCallback: ((String?) -> Unit)? = null

        var instance: ScreenshotService? = null
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private val handler = Handler(Looper.getMainLooper())

    // ---------- lifecycle ----------

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val code = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
                val data: Intent? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(EXTRA_DATA, Intent::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(EXTRA_DATA)
                }
                if (code != Activity.RESULT_CANCELED && data != null) {
                    setupProjection(code, data)
                }
            }
            ACTION_CAPTURE -> captureScreen()
            ACTION_STOP    -> stopSelf()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        virtualDisplay?.release()
        mediaProjection?.stop()
        imageReader?.close()
        instance = null
        super.onDestroy()
    }

    // ---------- projection setup ----------

    private fun setupProjection(resultCode: Int, data: Intent) {
        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = manager.getMediaProjection(resultCode, data)

        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        (getSystemService(Context.WINDOW_SERVICE) as WindowManager)
            .defaultDisplay.getMetrics(metrics)

        imageReader = ImageReader.newInstance(
            metrics.widthPixels, metrics.heightPixels,
            PixelFormat.RGBA_8888, 2
        )

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "CommentAI",
            metrics.widthPixels,
            metrics.heightPixels,
            metrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface, null, null
        )
    }

    // ---------- capture ----------

    fun captureScreen() {
        // Wait 300 ms so the overlay settles before we capture
        handler.postDelayed({
            val image: Image? = imageReader?.acquireLatestImage()
            if (image == null) {
                captureCallback?.invoke(null)
                captureCallback = null
                return@postDelayed
            }

            try {
                val plane      = image.planes[0]
                val rowStride  = plane.rowStride
                val pixelStride = plane.pixelStride
                val rowPadding  = rowStride - pixelStride * image.width

                val bitmap = Bitmap.createBitmap(
                    image.width + rowPadding / pixelStride,
                    image.height,
                    Bitmap.Config.ARGB_8888
                )
                bitmap.copyPixelsFromBuffer(plane.buffer)
                image.close()

                // Crop to exact screen dimensions
                val cropped = Bitmap.createBitmap(bitmap, 0, 0, image.width, image.height)
                bitmap.recycle()

                // Save to cache dir and return the path
                val file = File(cacheDir, "commentai_screenshot_${System.currentTimeMillis()}.jpg")
                FileOutputStream(file).use { out ->
                    cropped.compress(Bitmap.CompressFormat.JPEG, 90, out)
                }
                cropped.recycle()

                captureCallback?.invoke(file.absolutePath)
            } catch (e: Exception) {
                captureCallback?.invoke(null)
            } finally {
                captureCallback = null
            }
        }, 300)
    }

    // ---------- notification ----------

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "CommentAI Overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Active while the floating bubble is shown" }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CommentAI is active")
            .setContentText("Tap the bubble on any social media app to generate comments")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .build()
}
