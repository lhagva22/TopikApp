package com.topikapp

import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale
import java.util.UUID

class KoreanTtsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener, LifecycleEventListener {

    private var textToSpeech: TextToSpeech? = null
    private var isReady = false
    private var initError: String? = null
    private var pendingSpeech: PendingSpeech? = null

    private data class PendingSpeech(val text: String, val rate: Float, val promise: Promise)

    init {
        reactContext.addLifecycleEventListener(this)
        textToSpeech = TextToSpeech(reactContext.applicationContext, this)
    }

    override fun getName(): String = "KoreanTts"

    override fun onInit(status: Int) {
        val engine = textToSpeech
        if (status != TextToSpeech.SUCCESS || engine == null) {
            initError = "Android TTS engine could not be initialized."
            rejectPending(initError!!)
            return
        }

        val languageResult = engine.setLanguage(Locale.KOREAN)
        if (languageResult == TextToSpeech.LANG_MISSING_DATA ||
            languageResult == TextToSpeech.LANG_NOT_SUPPORTED
        ) {
            initError = "Korean voice data is not installed on this device."
            rejectPending(initError!!)
            return
        }

        isReady = true
        pendingSpeech?.let {
            pendingSpeech = null
            speakNow(it.text, it.rate, it.promise)
        }
    }

    @ReactMethod
    fun speak(text: String, rate: Double, promise: Promise) {
        if (text.isBlank()) {
            promise.reject("INVALID_TEXT", "Text to speak cannot be empty.")
            return
        }

        initError?.let {
            promise.reject("TTS_UNAVAILABLE", it)
            return
        }

        if (!isReady) {
            pendingSpeech?.promise?.reject("TTS_REPLACED", "Speech was replaced by a newer request.")
            pendingSpeech = PendingSpeech(text, rate.toFloat(), promise)
            return
        }

        speakNow(text, rate.toFloat(), promise)
    }

    private fun speakNow(text: String, rate: Float, promise: Promise) {
        val engine = textToSpeech
        if (engine == null) {
            promise.reject("TTS_UNAVAILABLE", "Android TTS engine is unavailable.")
            return
        }

        engine.stop()
        engine.setSpeechRate(rate.coerceIn(0.5f, 1.5f))
        val result = engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, UUID.randomUUID().toString())
        if (result == TextToSpeech.ERROR) {
            promise.reject("TTS_SPEAK_FAILED", "Android TTS could not speak this text.")
        } else {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        pendingSpeech?.promise?.reject("TTS_STOPPED", "Speech was stopped.")
        pendingSpeech = null
        textToSpeech?.stop()
        promise.resolve(null)
    }

    private fun rejectPending(message: String) {
        pendingSpeech?.promise?.reject("TTS_UNAVAILABLE", message)
        pendingSpeech = null
    }

    override fun onHostResume() = Unit

    override fun onHostPause() = Unit

    override fun onHostDestroy() {
        pendingSpeech = null
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
        isReady = false
    }
}
