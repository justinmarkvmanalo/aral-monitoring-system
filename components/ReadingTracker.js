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
  const [speechStatus, setSpeechStatus] = useState('Mic is ready.');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micActive, setMicActive] = useState(false);

  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recordingStartRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const recordingFlagRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioAnimRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));

    return () => {
      recordingFlagRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      stopAudioLevelMeter();
    };
  }, []);

  function startTimer() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
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
    if (audioAnimRef.current) {
      cancelAnimationFrame(audioAnimRef.current);
      audioAnimRef.current = null;
    }
    setAudioLevel(0);
    setMicActive(false);
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    } catch (_) { }
    audioContextRef.current = null;
    analyserRef.current = null;
    audioDataRef.current = null;
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }

  function startAudioLevelMeter() {
    stopAudioLevelMeter();
    try {
      const stream = navigator.mediaDevices.getUserMedia({ audio: true });
      stream.then((s) => {
        audioStreamRef.current = s;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(s);
        audioSourceRef.current = source;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        audioDataRef.current = data;

        function tick() {
          if (!analyserRef.current || !audioDataRef.current) return;
          analyserRef.current.getByteFrequencyData(audioDataRef.current);
          const avg = Array.from(audioDataRef.current).reduce((a, b) => a + b, 0) / audioDataRef.current.length;
          const level = Math.min(100, Math.round((avg / 255) * 100));
          setAudioLevel(level);
          setMicActive(level > 2);
          audioAnimRef.current = requestAnimationFrame(tick);
        }

        tick();
      }).catch(() => {
        setMicActive(false);
      });
    } catch (_) { }
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechStatus('Speech recognition is only available in supported Chrome or Edge browsers.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fil-PH';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      recordingFlagRef.current = true;
      setSpeechStatus('Recording in progress.');
      startTimer();
      startAudioLevelMeter();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalized = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalized += `${chunk} `;
        } else {
          interim += chunk;
        }
      }

      if (finalized) {
        setTranscript((current) => `${current}${current ? ' ' : ''}${finalized.trim()}`.trim());
      }
      setLiveTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setSpeechStatus(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (recordingFlagRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    setIsRecording(false);
    recordingFlagRef.current = false;
    setLiveTranscript('');
    stopTimer();

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    stopAudioLevelMeter();

    const elapsed = Math.max(1, Math.round(elapsedSecondsRef.current));
    setSpeechStatus(`Recording paused at ${formatTimer(elapsed)}.`);
  }

  function toggleRecording() {
    if (!speechSupported) {
      setSpeechStatus('Speech recognition is only available in supported Chrome or Edge browsers.');
      return;
    }

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
    recordingFlagRef.current = false;
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
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button type="button" className="button-secondary" onClick={resetVoiceSession}>
          Reset
        </button>
      </div>

      <div className="voice-status">
        <span className={`pill ${speechSupported ? 'green' : 'amber'}`}>
          {speechSupported ? 'Mic Supported' : 'Mic Limited'}
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
