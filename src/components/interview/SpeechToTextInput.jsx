import { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaCheck, FaTimes, FaRedo } from 'react-icons/fa';
import VoiceVisualizer from './VoiceVisualizer';
import './SpeechToTextInput.css';

export default function SpeechToTextInput({ onSubmit, disabled, analyser, interviewerSpeaking }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart + ' ';
        } else {
          interim += transcriptPart;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      setIsRecording(false);
      isRecordingRef.current = false;
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting recognition:', e);
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error('Error cleaning up recognition:', e);
        }
      }
    };
  }, []);

  const startRecording = () => {
    if (disabled || interviewerSpeaking) return;
    
    setTranscript('');
    setInterimTranscript('');
    setShowConfirmation(false);
    setIsRecording(true);
    isRecordingRef.current = true;
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (e) {
      console.error('Error starting recognition:', e);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setInterimTranscript('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    setTimeout(() => {
      if (transcript.trim()) {
        setShowConfirmation(true);
      }
    }, 300);
  };

  const handleConfirm = () => {
    if (transcript.trim()) {
      onSubmit(transcript.trim());
      setTranscript('');
      setShowConfirmation(false);
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setInterimTranscript('');
    setShowConfirmation(false);
    startRecording();
  };

  const handleCancel = () => {
    setTranscript('');
    setInterimTranscript('');
    setShowConfirmation(false);
  };

  const handleManualEdit = (e) => {
    setTranscript(e.target.value);
  };

  return (
    <div className="speech-to-text-input">
      {!showConfirmation ? (
        <>
          {/* <VoiceVisualizer analyser={analyser} isRecording={isRecording} /> */}
          
          {interviewerSpeaking ? (
            <div className="interviewer-speaking-notice">
              <div className="speaking-animation">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <p className="notice-text">Interviewer is speaking... Please wait</p>
            </div>
          ) : (
            <>
              {!isRecording && (
                <div className="ready-to-speak-prompt">
                  <p className="prompt-text">✓ Ready to answer? Click below to start</p>
                </div>
              )}
              
              <div className="recording-controls">
                {!isRecording ? (
                  <button 
                    className="btn btn-primary btn-record"
                    onClick={startRecording}
                    disabled={disabled}
                  >
                    <FaMicrophone /> Start Speaking
                  </button>
                ) : (
                  <button 
                    className="btn btn-danger btn-record recording"
                    onClick={stopRecording}
                  >
                    <FaStop /> Stop & Review
                  </button>
                )}
              </div>
            </>
          )}

          {isRecording && (
            <div className="recording-status">
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                <span>Recording...</span>
              </div>
              <p className="recording-hint">Speak clearly and click "Stop & Review" when finished</p>
            </div>
          )}

          {(transcript || interimTranscript) && (
            <div className="transcript-preview">
              <label>Your Answer (Live):</label>
              <div className="transcript-text">
                {transcript}
                {interimTranscript && (
                  <span className="interim-text">{interimTranscript}</span>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="confirmation-panel">
          <h3>Review Your Answer</h3>
          <p className="confirmation-hint">Please review your answer below. You can edit it before submitting.</p>
          
          <textarea
            className="transcript-editor"
            value={transcript}
            onChange={handleManualEdit}
            rows={6}
            placeholder="Your answer will appear here..."
          />

          <div className="confirmation-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              <FaTimes /> Cancel
            </button>
            <button 
              className="btn btn-warning"
              onClick={handleRetry}
            >
              <FaRedo /> Record Again
            </button>
            <button 
              className="btn btn-success"
              onClick={handleConfirm}
              disabled={!transcript.trim()}
            >
              <FaCheck /> Confirm & Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
