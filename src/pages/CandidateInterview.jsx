import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { startInterview, sendAnswer, endInterview, uploadRecordingFile } from "../services/api";
import TypingIndicator from "../components/TypingIndicator";
import InterviewSetup from "../components/interview/InterviewSetup";
import RecordingUploadOverlay from "../components/interview/RecordingUploadOverlay";
import SpeechToTextInput from "../components/interview/SpeechToTextInput";
import { useAudioMonitor } from "../hooks/useAudioMonitor";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { FaExclamationTriangle, FaVideo, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import "./CandidateInterview.css";

export default function CandidateInterview() {
  const { state } = useLocation();
  // console.log(state)
  // console.log(state)
  // console.log(state);
  const navigate = useNavigate();

  const [setupComplete, setSetupComplete] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [timeLeft, setTimeLeft] = useState(state?.duration * 60 );
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const videoRef = useRef(null);

  // Recording refs
  const screenRecorderRef = useRef(null);
  const cameraRecorderRef = useRef(null);
  const screenChunksRef = useRef([]);
  const cameraChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const [uploadState, setUploadState] = useState(null); // null | { status, screenProgress, cameraProgress, errorMessage }

  const { speak, stop, speaking } = useTextToSpeech();

  const { noiseLevel } = useAudioMonitor(
    setupData?.analyser,
    (violation) => {
      setViolations(prev => [...prev, violation]);
      setShowViolationAlert(true);
      setTimeout(() => setShowViolationAlert(false), 3000);
    }
  );

  useEffect(() => {
    if (setupComplete && setupData?.stream && videoRef.current) {
      videoRef.current.srcObject = setupData.stream;
    }
  }, [setupComplete, setupData]);

  // Start recordings when setup is complete
  useEffect(() => {
    if (!setupComplete || !setupData?.stream) return;

    const startRecordings = async () => {
      try {
        // Camera recording from existing stream (500kbps for small file size)
        const cameraRecorder = new MediaRecorder(setupData.stream, {
          mimeType: "video/webm;codecs=vp8,opus",
          videoBitsPerSecond: 500000,
        });
        cameraRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) cameraChunksRef.current.push(e.data);
        };
        cameraRecorderRef.current = cameraRecorder;
        cameraRecorder.start(1000);
        console.log("[Recording] Camera recording started");

        // Screen recording — prefer entire monitor with system audio
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
          preferCurrentTab: false,
          selfBrowserSurface: "exclude",
          surfaceSwitching: "exclude",
          monitorTypeSurfaces: "include",
        });
        screenStreamRef.current = screenStream;

        // Screen recording at 1Mbps with VP8+Opus for video+audio
        const screenRecorder = new MediaRecorder(screenStream, {
          mimeType: "video/webm;codecs=vp8,opus",
          videoBitsPerSecond: 1000000,
          audioBitsPerSecond: 128000,
        });
        screenRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) screenChunksRef.current.push(e.data);
        };
        screenRecorderRef.current = screenRecorder;
        screenRecorder.start(1000);
        console.log("[Recording] Screen recording started");

        // If user stops screen share via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          console.log("[Recording] Screen share stopped by user");
          if (screenRecorderRef.current?.state === "recording") {
            screenRecorderRef.current.stop();
          }
        };
      } catch (err) {
        console.error("[Recording] Failed to start recordings:", err);
      }
    };

    startRecordings();
  }, [setupComplete, setupData]);

  useEffect(() => {
    if (currentQuestion && autoSpeak) {
      speak(currentQuestion);
    }
  }, [currentQuestion, autoSpeak]);


  useEffect(() => {
    if (loading) return;

    if (timeLeft <= 0) {
      alert("⏱️ Time is up! Please answer faster.");
      setViolations((v) => [...v, { type: "TIME_EXCEEDED" }]);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  // Track tab switches using visibility change
  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log("Tab is now hidden (User switched tabs)");
      setViolations((prev) => [
        ...prev,
        { type: "TAB_SWITCH", time: new Date().toISOString() }
      ]);
    } else {
      console.log("Tab is now visible (User came back)");
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, []);


  // Track tab switches
  useEffect(() => {
    const handleBlur = () => {
      setViolations((prev) => [
        ...prev,
        { type: "TAB_SWITCH", time: new Date().toISOString() }
      ]);
      console.log("Tab switch detected");
      // alert("⚠️ Please do not switch tabs during the interview.");
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const handleSetupComplete = (data) => {
    setSetupData(data);
    setSetupComplete(true);
  };

  useEffect(() => {
    if (!setupComplete) return;

    async function init() {
      setLoading(true);
      try {
        const res = await startInterview(state);
        console.log(res)
        setSessionId(res.session_id);
        setCurrentQuestion(res.question);
        setQuestionNumber(1);
        setConversationHistory([{ type: 'question', text: res.question, number: 1 }]);
      } catch (error) {
        console.error("Error starting interview:", error);
        
        if (error.message.includes("authenticated") || error.message.includes("expired")) {
          alert("Your session has expired. Please login again.");
          navigate("/login");
        } else {
          alert(`Failed to start interview: ${error.message}`);
        }
        
        // Clean up resources
        if (setupData?.stream) {
          setupData.stream.getTracks().forEach(track => track.stop());
        }
        if (setupData?.audioContext) {
          setupData.audioContext.close();
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setupComplete, state, navigate, setupData]);


  const handleSend = async (answer) => {
    if (!answer.trim() || loading) return;

    stop(); // Stop any ongoing speech
    setLoading(true);

    // Add answer to history
    setConversationHistory(prev => [
      ...prev,
      { type: 'answer', text: answer, number: questionNumber }
    ]);

    try {
      const res = await sendAnswer({
        session_id: sessionId,
        scheduledInterviewId: state?.scheduledInterviewId,
        answer: answer,
        timeRemaining : timeLeft
      });

      if (res.question) {
        setQuestionNumber(prev => prev + 1);
        setCurrentQuestion(res.question);
        setConversationHistory(prev => [
          ...prev,
          { type: 'question', text: res.question, number: questionNumber + 1 }
        ]);
      } else {
        // Interview completed
        alert("Interview completed! Proceeding to feedback.");
        finishInterview();
      }
    } catch (error) {
      console.error("Error sending answer:", error);
      
      if (error.message.includes("authenticated") || error.message.includes("expired")) {
        alert("Your session has expired. Please login again.");
        navigate("/login");
      } else {
        alert(`Failed to send answer: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const stopRecordersAndGetBlobs = () => {
    return new Promise((resolve) => {
      let screenBlob = null;
      let cameraBlob = null;
      let pending = 0;

      const checkDone = () => {
        if (pending === 0) resolve({ screenBlob, cameraBlob });
      };

      if (screenRecorderRef.current?.state === "recording") {
        pending++;
        screenRecorderRef.current.onstop = () => {
          screenBlob = new Blob(screenChunksRef.current, { type: "video/webm" });
          console.log(`[Recording] Screen blob size: ${screenBlob.size}`);
          pending--;
          checkDone();
        };
        screenRecorderRef.current.stop();
      }

      if (cameraRecorderRef.current?.state === "recording") {
        pending++;
        cameraRecorderRef.current.onstop = () => {
          cameraBlob = new Blob(cameraChunksRef.current, { type: "video/webm" });
          console.log(`[Recording] Camera blob size: ${cameraBlob.size}`);
          pending--;
          checkDone();
        };
        cameraRecorderRef.current.stop();
      }

      // Stop screen share stream tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (pending === 0) resolve({ screenBlob, cameraBlob });
    });
  };

  const finishInterview = async () => {
    if (!window.confirm("Are you sure you want to end the interview?")) {
      return;
    }

    stop(); // Stop any ongoing speech

    // Show overlay immediately
    setUploadState({ status: "uploading", progress: 0, errorMessage: null });

    try {
      // Stop recorders and get blobs while ending interview
      const [, { screenBlob, cameraBlob }] = await Promise.all([
        endInterview({
          session_id: sessionId,
          violations,
          credentialId: state?.credentialId,
          scheduledInterviewId: state?.scheduledInterviewId,
        }),
        stopRecordersAndGetBlobs(),
      ]);

      if (setupData?.stream) {
        setupData.stream.getTracks().forEach(track => track.stop());
      }
      if (setupData?.audioContext) {
        setupData.audioContext.close();
      }

      // Upload recordings to backend in parallel
      if ((screenBlob || cameraBlob) && state?.scheduledInterviewId) {
        const progressMap = { screen: 0, camera: 0 };
        const totalFiles = (screenBlob ? 1 : 0) + (cameraBlob ? 1 : 0);

        const updateProgress = (type, pct) => {
          progressMap[type] = pct;
          const avg = Object.values(progressMap).reduce((a, b) => a + b, 0) / totalFiles;
          setUploadState((prev) => ({ ...prev, progress: Math.round(avg) }));
        };

        try {
          const uploadPromises = [];

          if (screenBlob) {
            uploadPromises.push(
              uploadRecordingFile({
                scheduledInterviewId: state.scheduledInterviewId,
                type: "screen",
                blob: screenBlob,
                onProgress: (pct) => updateProgress("screen", pct),
              })
            );
          }

          if (cameraBlob) {
            uploadPromises.push(
              uploadRecordingFile({
                scheduledInterviewId: state.scheduledInterviewId,
                type: "camera",
                blob: cameraBlob,
                onProgress: (pct) => updateProgress("camera", pct),
              })
            );
          }

          setUploadState((prev) => ({ ...prev, status: "saving" }));
          await Promise.all(uploadPromises);
          console.log("[Recording] All recordings uploaded and saved");
          setUploadState((prev) => ({ ...prev, status: "done" }));

        } catch (uploadErr) {
          console.error("[Recording] Upload error:", uploadErr);
          setUploadState((prev) => ({ ...prev, status: "error", errorMessage: "Something went wrong. Your interview results are still saved." }));
        }
      } else {
        setUploadState((prev) => ({ ...prev, status: "done" }));
      }
    } catch (error) {
      console.error("Error ending interview:", error);
      if (error.message.includes("authenticated") || error.message.includes("expired")) {
        alert("Your session has expired. Please login again.");
        navigate("/login");
      } else {
        setUploadState((prev) => ({ ...prev, status: "error", errorMessage: "Something went wrong. Please try again." }));
      }
    }
  };

  const toggleAutoSpeak = () => {
    if (autoSpeak) {
      stop();
    }
    setAutoSpeak(!autoSpeak);
  };

  if (!setupComplete) {
    return <InterviewSetup onSetupComplete={handleSetupComplete} />;
  }


  return (
    <div className="interview-container">
      {uploadState && (
        <RecordingUploadOverlay
          progress={uploadState.progress}
          status={uploadState.status}
          errorMessage={uploadState.errorMessage}
          onDone={() => navigate("/dashboard")}
        />
      )}

      {showViolationAlert && (
        <div className="violation-alert">
          <FaExclamationTriangle />
          <span>Violation detected! Please maintain a quiet environment.</span>
        </div>
      )}

      <div className="interview-layout">
        <div className="interview-sidebar">
          <div className="video-monitor">
            <video ref={videoRef} autoPlay muted playsInline />
            <div className="video-label">
              <FaVideo /> Camera Feed
            </div>
          </div>

          <div className="interview-stats">
            <div className="stat-item">
              <label>Time Remaining</label>
              <div className={`stat-value ${timeLeft < 30 ? 'warning' : ''}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="stat-item">
              <label>Violations</label>
              <div className={`stat-value ${violations.length > 0 ? 'danger' : ''}`}>
                {violations.length}
              </div>
            </div>

            <div className="stat-item">
              <label>Noise Level</label>
              <div className="noise-meter">
                <div 
                  className={`noise-fill ${noiseLevel > 60 ? 'high' : ''}`}
                  style={{ width: `${noiseLevel}%` }}
                />
              </div>
              <span className="noise-text">{Math.round(noiseLevel)}%</span>
            </div>
          </div>

          {violations.length > 0 && (
            <div className="violations-list">
              <h4><FaExclamationTriangle /> Violations</h4>
              <div className="violations-scroll">
                {violations.map((v, i) => (
                  <div key={i} className="violation-item">
                    <span className="violation-type">{v.type.replace('_', ' ')}</span>
                    <span className="violation-time">
                      {new Date(v.time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="interview-main">
          <div className="interview-header">
            <div>
              <h2>AI Interview Session</h2>
              <p className="interview-info">
                {state?.role || 'Position'} - {state?.type || 'Interview Type'}
              </p>
            </div>
            <div className="header-actions">
              <button
                className={`btn ${autoSpeak ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleAutoSpeak}
                title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
              >
                {autoSpeak ? <FaVolumeUp /> : <FaVolumeMute />}
                {autoSpeak ? 'Audio On' : 'Audio Off'}
              </button>
              <button
                className="btn btn-danger"
                onClick={finishInterview}
                disabled={loading}
              >
                End Interview
              </button>
            </div>
          </div>

          <div className="question-container">
            <div className="question-display">
              <div className="question-header">
                <h3>Question {questionNumber}</h3>
                {speaking && <span className="speaking-indicator">🔊 Speaking...</span>}
              </div>
              <div className="question-text">
                {loading ? (
                  <TypingIndicator />
                ) : (
                  <p>{currentQuestion}</p>
                )}
              </div>
            </div>

            {/* {conversationHistory.length > 1 && (
              <div className="conversation-summary">
                <h4>Previous Questions</h4>
                <div className="history-scroll">
                  {conversationHistory.slice(0, -1).map((item, i) => (
                    item.type === 'question' && (
                      <div key={i} className="history-item">
                        <span className="history-number">Q{item.number}</span>
                        <span className="history-text">{item.text.substring(0, 60)}...</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )} */}
          </div>

          <div className="answer-section">
            <SpeechToTextInput
              onSubmit={handleSend}
              disabled={loading}
              analyser={setupData?.analyser}
              interviewerSpeaking={speaking}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
