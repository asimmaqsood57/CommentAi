package com.eatechnologies.comment_ai

import android.app.Application
import android.content.Intent
import android.os.Build
import android.os.FileObserver
import java.io.File

class MainApplication : Application() {

    private var fileObserver: FileObserver? = null

    override fun onCreate() {
        super.onCreate()
        watchForPickRequests()
    }

    @Suppress("DEPRECATION")
    private fun watchForPickRequests() {
        val dir = cacheDir
        // FileObserver(File, mask) requires API 29; use path constructor for compat
        fileObserver = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            object : FileObserver(dir, CLOSE_WRITE) {
                override fun onEvent(event: Int, path: String?) = handleEvent(dir, path)
            }
        } else {
            object : FileObserver(dir.absolutePath, CLOSE_WRITE) {
                override fun onEvent(event: Int, path: String?) = handleEvent(dir, path)
            }
        }
        fileObserver?.startWatching()
    }

    private fun handleEvent(dir: File, path: String?) {
        if (path != "pick_request") return
        // Delete the trigger file so it doesn't re-fire
        File(dir, "pick_request").delete()
        val intent = Intent(applicationContext, PickerActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
    }
}
