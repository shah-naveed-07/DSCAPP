package com.dsc.dscweb.ai

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

enum class MjVoiceState {
    Idle,
    Listening,
    Thinking,
    Speaking
}

class MjVoiceManager(private val context: Context) : TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = TextToSpeech(context, this)
    private var speechRecognizer: SpeechRecognizer? = null
    private var isTtsReady = false

    private val _voiceState = MutableStateFlow(MjVoiceState.Idle)
    val voiceState: StateFlow<MjVoiceState> = _voiceState.asStateFlow()

    private val _recognizedText = MutableStateFlow("")
    val recognizedText: StateFlow<String> = _recognizedText.asStateFlow()

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isTtsReady = true
            // Prefer Hindi or Indian English voice
            val localeHi = Locale("hi", "IN")
            val localeEnIn = Locale("en", "IN")
            val result = tts?.setLanguage(localeHi)
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(localeEnIn)
            }
            tts?.setPitch(1.0f)
            tts?.setSpeechRate(0.95f)

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    _voiceState.value = MjVoiceState.Speaking
                }

                override fun onDone(utteranceId: String?) {
                    _voiceState.value = MjVoiceState.Idle
                }

                override fun onError(utteranceId: String?) {
                    _voiceState.value = MjVoiceState.Idle
                }
            })
        }
    }

    fun speak(text: String) {
        if (!isTtsReady || text.isBlank()) return
        _voiceState.value = MjVoiceState.Speaking
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "MJ_TTS_${System.currentTimeMillis()}")
    }

    fun stopSpeaking() {
        tts?.stop()
        _voiceState.value = MjVoiceState.Idle
    }

    fun startListening(onResult: (String) -> Unit) {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            return
        }

        stopSpeaking()
        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    _voiceState.value = MjVoiceState.Listening
                }

                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {
                    _voiceState.value = MjVoiceState.Thinking
                }

                override fun onError(error: Int) {
                    _voiceState.value = MjVoiceState.Idle
                }

                override fun onResults(results: Bundle?) {
                    _voiceState.value = MjVoiceState.Idle
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val spoken = matches?.firstOrNull() ?: ""
                    if (spoken.isNotBlank()) {
                        _recognizedText.value = spoken
                        onResult(spoken)
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val text = matches?.firstOrNull() ?: ""
                    if (text.isNotBlank()) {
                        _recognizedText.value = text
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hi-IN")
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, "en-IN,hi-IN")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        try {
            speechRecognizer?.startListening(intent)
        } catch (_: Exception) {
            _voiceState.value = MjVoiceState.Idle
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) {}
        _voiceState.value = MjVoiceState.Idle
    }

    fun release() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        speechRecognizer?.destroy()
        speechRecognizer = null
    }
}
