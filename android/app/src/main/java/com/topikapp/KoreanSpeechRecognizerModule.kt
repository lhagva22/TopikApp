package com.topikapp

import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class KoreanSpeechRecognizerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), RecognitionListener, LifecycleEventListener {

    private var recognizer: SpeechRecognizer? = null
    private var activePromise: Promise? = null

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String = "KoreanSpeechRecognizer"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactContext))
    }

    @ReactMethod
    fun start(promise: Promise) {
        reactContext.runOnUiQueueThread {
            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                promise.reject("RECOGNIZER_UNAVAILABLE", "Speech recognition is unavailable on this device.")
                return@runOnUiQueueThread
            }

            activePromise?.reject("RECOGNIZER_REPLACED", "A newer recognition request was started.")
            activePromise = promise

            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext).also {
                    it.setRecognitionListener(this)
                }
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "ko-KR")
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
                putExtra(RecognizerIntent.EXTRA_PROMPT, "한국어 단어를 읽어 주세요")
            }

            recognizer?.startListening(intent)
        }
    }

    @ReactMethod
    fun cancel(promise: Promise) {
        reactContext.runOnUiQueueThread {
            recognizer?.cancel()
            activePromise?.reject("RECOGNIZER_CANCELLED", "Speech recognition was cancelled.")
            activePromise = null
            promise.resolve(null)
        }
    }

    override fun onResults(results: Bundle?) {
        val matches = results
            ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            .orEmpty()

        val output = Arguments.createArray()
        matches.forEach(output::pushString)
        activePromise?.resolve(output)
        activePromise = null
    }

    override fun onError(error: Int) {
        val code = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "AUDIO_ERROR"
            SpeechRecognizer.ERROR_CLIENT -> "CLIENT_ERROR"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "PERMISSION_DENIED"
            SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "NETWORK_ERROR"
            SpeechRecognizer.ERROR_NO_MATCH -> "NO_MATCH"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RECOGNIZER_BUSY"
            SpeechRecognizer.ERROR_SERVER -> "SERVER_ERROR"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "SPEECH_TIMEOUT"
            else -> "RECOGNITION_ERROR"
        }
        activePromise?.reject(code, "Speech recognition failed with Android error $error.")
        activePromise = null
    }

    override fun onReadyForSpeech(params: Bundle?) = Unit
    override fun onBeginningOfSpeech() = Unit
    override fun onRmsChanged(rmsdB: Float) = Unit
    override fun onBufferReceived(buffer: ByteArray?) = Unit
    override fun onEndOfSpeech() = Unit
    override fun onPartialResults(partialResults: Bundle?) = Unit
    override fun onEvent(eventType: Int, params: Bundle?) = Unit

    override fun onHostResume() = Unit
    override fun onHostPause() = Unit

    override fun onHostDestroy() {
        reactContext.runOnUiQueueThread {
            activePromise = null
            recognizer?.cancel()
            recognizer?.destroy()
            recognizer = null
        }
    }
}
