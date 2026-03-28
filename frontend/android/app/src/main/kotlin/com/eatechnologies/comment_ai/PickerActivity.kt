package com.eatechnologies.comment_ai

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

/**
 * Transparent activity launched by MainApplication via FileObserver.
 * Opens the image gallery, runs ML Kit OCR, and writes the result to
 * {cacheDir}/pick_result so the overlay engine can poll for it.
 */
class PickerActivity : Activity() {

    companion object {
        private const val REQUEST_PICK = 1
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        startActivityForResult(Intent.createChooser(intent, "Select Image"), REQUEST_PICK)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_PICK && resultCode == RESULT_OK) {
            val uri = data?.data
            if (uri != null) {
                runOcrAndWriteResult(uri)
                return
            }
        }
        // Cancelled or error
        writeResult("")
        finish()
    }

    private fun runOcrAndWriteResult(uri: Uri) {
        try {
            val image = InputImage.fromFilePath(this, uri)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    writeResult(visionText.text)
                    finish()
                }
                .addOnFailureListener {
                    writeResult("")
                    finish()
                }
        } catch (e: Exception) {
            writeResult("")
            finish()
        }
    }

    private fun writeResult(text: String) {
        try {
            File(cacheDir, "pick_result").writeText(text)
        } catch (_: Exception) {}
    }
}
