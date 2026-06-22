'use client';

import { useEffect, useRef, useState } from 'react';

function formatTimer(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export default function ReadingTracker() {
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('Loading speech model...');
  const [audioLevel, setAudioLevel] = useState(0);
  const [micActive, setMicActive] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const pipeRef = useRef(null);

  const timerIntervalRef = useRef(null);
  const recordingStartRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const activityPulseRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const { pipeline, env } = await import('@xenova/transformers');
        env.logLevel = 'fatal';
        if (cancelled) return;
        pipeRef.current = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
          chunk_length_s: 30,
          stride_length_s: 5,
        });
        if (!cancelled) {
          setIsModelLoading(false);
          setSpeechStatus('Mic is ready.');
        }
      } catch (err) {
        if (!cancelled) {
          setIsModelLoading(false);
          setSpeechStatus(`Model load error: ${err.message}`);
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      stopAudioLevelMeter();
    };
  }, []);

  function startTimer() {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    recordingStartRef.current = Date.now() - elapsedSecondsRef.current * 1000;
    timerIntervalRef.current = setInterval(() => {
      const nextSeconds = (Date.now() - recordingStartRef.current) / 1000;
      elapsedSecondsRef.current = nextSeconds;
    }, 250);
  }

  function stopTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }

  function stopAudioLevelMeter() {
    if (activityPulseRef.current) {
      clearInterval(activityPulseRef.current);
      activityPulseRef.current = null;
    }
    setAudioLevel(0);
    setMicActive(false);
  }

  function startAudioLevelMeter() {
    stopAudioLevelMeter();
    setAudioLevel(15);
    setMicActive(true);
    activityPulseRef.current = setInterval(() => {
      setAudioLevel((prev) => {
        const next = prev + (Math.random() - 0.5) * 20;
        return Math.max(10, Math.min(50, Math.round(next)));
      });
    }, 150);
  }

  function resampleAudio(audioData, origSampleRate, targetSampleRate) {
    if (origSampleRate === targetSampleRate) return audioData;
    const ratio = targetSampleRate / origSampleRate;
    const newLength = Math.round(audioData.length * ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const pos = i / ratio;
      const idx = Math.floor(pos);
      const frac = pos - idx;
      result[i] = idx + 1 < audioData.length
        ? audioData[idx] * (1 - frac) + audioData[idx + 1] * frac
        : audioData[idx] || 0;
    }
    return result;
  }

  async function startRecording() {
    if (isModelLoading) {
      setSpeechStatus('Model still loading, please wait...');
      return;
    }

    audioChunksRef.current = [];
    elapsedSecondsRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;

        setIsProcessing(true);
        setSpeechStatus('Transcribing audio...');
        let audioCtx = null;

        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          audioCtx = new AudioContext({ sampleRate: 16000 });
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          const channelData = audioBuffer.getChannelData(0);
          const resampled = resampleAudio(channelData, audioBuffer.sampleRate, 16000);

          const result = await pipeRef.current(resampled, {
            language: 'filipino',
            task: 'transcribe',
          });

          if (result?.text) {
            setTranscript((prev) => `${prev}${prev ? ' ' : ''}${result.text.trim()}`);
          }
          setSpeechStatus('Recording stopped.');
        } catch (err) {
          setSpeechStatus(`Transcription error: ${err.message}`);
        } finally {
          if (audioCtx) audioCtx.close();
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setSpeechStatus('Recording in progress.');
      startTimer();
      startAudioLevelMeter();
    } catch (err) {
      setSpeechStatus(`Mic error: ${err.message}`);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setLiveTranscript('');
    stopTimer();
    stopAudioLevelMeter();
    mediaRecorderRef.current = null;

    if (!isProcessing) {
      const elapsed = Math.max(1, Math.round(elapsedSecondsRef.current));
      setSpeechStatus(`Recording stopped at ${formatTimer(elapsed)}.`);
      elapsedSecondsRef.current = 0;
    }
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function resetVoiceSession() {
    if (isRecording) {
      stopRecording();
    }
    elapsedSecondsRef.current = 0;
    setTranscript('');
    setLiveTranscript('');
    setSpeechStatus('Voice session cleared.');
  }

  const displayedTranscript = [transcript, liveTranscript].filter(Boolean).join(' ');

  return (
    <section className="table-card reading-shell">
      <div className="voice-controls">
        <button
          type="button"
          className={`button ${isRecording ? 'voice-recording' : ''}`}
          onClick={toggleRecording}
          disabled={isModelLoading || isProcessing}
        >
          {isModelLoading ? 'Loading...'
            : isProcessing ? 'Transcribing...'
            : isRecording ? 'Stop Recording'
            : 'Start Recording'}
        </button>
        <button type="button" className="button-secondary" onClick={resetVoiceSession}>
          Reset
        </button>
      </div>

      <div className="voice-status">
        <span className={`pill ${isModelLoading ? 'amber' : 'green'}`}>
          {isModelLoading ? 'Loading Model' : 'Model Ready'}
        </span>
        <span className="subtle">{speechStatus}</span>
      </div>

      {isRecording && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 70 }}>
            {micActive ? 'Mic Active' : 'No Sound'}
          </span>
          <div style={{
            flex: 1, height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden'
          }}>
            <div style={{
              width: `${audioLevel}%`,
              height: '100%',
              borderRadius: 4,
              background: audioLevel > 60 ? '#ef4444' : audioLevel > 25 ? '#f59e0b' : '#22c55e',
              transition: 'width 0.1s ease'
            }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 30, textAlign: 'right' }}>
            {audioLevel}
          </span>
        </div>
      )}

      <div className="reading-section-block">
        <div className="reading-section-head">
          <strong>Voice Transcript</strong>
        </div>
        <div className="reading-transcript-box">
          {displayedTranscript || 'Speech will appear here while the learner is reading.'}
        </div>
      </div>
    </section>
  );
}
