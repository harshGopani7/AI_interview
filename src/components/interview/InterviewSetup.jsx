import { useState, useEffect, useRef } from "react";
import { FaVideo, FaVolumeUp, FaCheck, FaExclamationTriangle, FaPlay, FaMicrophone } from "react-icons/fa";
import "./InterviewSetup.css";

const STEP_LABELS = ["Camera", "Select Camera", "Speakers", "Final Test"];

export default function InterviewSetup({ onSetupComplete }) {
    const [step, setStep] = useState(1);
    const [devices, setDevices] = useState({ cameras: [], speakers: [] });
    const [selectedCamera, setSelectedCamera] = useState("");
    const [selectedSpeaker, setSelectedSpeaker] = useState("");
    const [audioLevel, setAudioLevel] = useState(0);
    const [stream, setStream] = useState(null);
    const [isTestingAudio, setIsTestingAudio] = useState(false);

    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Initial Device Fetch
    useEffect(() => {
        const getDevices = async () => {
            const list = await navigator.mediaDevices.enumerateDevices();
            setDevices({
                cameras: list.filter(d => d.kind === 'videoinput'),
                speakers: list.filter(d => d.kind === 'audiooutput')
            });
        };
        getDevices();
    }, []);

    // Step 4 Video Attachment
    useEffect(() => {
        if (step === 4 && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [step, stream]);

    const requestCameraPermission = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            const list = await navigator.mediaDevices.enumerateDevices();
            const cameras = list.filter(d => d.kind === 'videoinput');
            setDevices(prev => ({ ...prev, cameras }));
            if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
            setStep(2);
        } catch (err) {
            alert("Camera access is required.");
        }
    };

    const requestSpeakerPermission = async () => {
        const list = await navigator.mediaDevices.enumerateDevices();
        const speakers = list.filter(d => d.kind === 'audiooutput');
        setDevices(prev => ({ ...prev, speakers }));
        if (speakers.length > 0) setSelectedSpeaker(speakers[0].deviceId);
        setStep(3);
    };

    const startDeviceTest = () => {
        setStep(4);
    };

    const playSpeakerTest = async () => {
        if (!audioRef.current) return;

        try {
            setIsTestingAudio(true);
            if (audioRef.current.setSinkId) {
                await audioRef.current.setSinkId(selectedSpeaker);
            }

            audioRef.current.currentTime = 0;
            audioRef.current.play();
            simulateVolumeMeter();
        } catch (err) {
            console.error("Speaker test failed", err);
        }
    };

    // Since we can't "record" the speaker, we simulate the meter 
    // to show the user that audio is actually being sent to the device.
    const simulateVolumeMeter = () => {
        let val = 0;
        const interval = setInterval(() => {
            val = Math.random() * 30 + 70;
            setAudioLevel(val);
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            setAudioLevel(0);
            setIsTestingAudio(false);
        }, 3000);
    };

    const completeSetup = () => {
        onSetupComplete({ stream, selectedCamera, selectedSpeaker });
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="setup-step">
                        <div className="setup-icon-wrapper">
                            <div className="setup-icon-circle">
                                <FaVideo size={28} />
                            </div>
                        </div>
                        <h2 className="setup-step-title">Enable Camera Access</h2>
                        <p className="setup-step-desc">
                            We need access to your camera to conduct the interview. Your video will be recorded for review.
                        </p>
                        <button className="setup-btn setup-btn-primary" onClick={requestCameraPermission}>
                            <FaVideo /> Allow Camera
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="setup-step">
                        <div className="setup-icon-wrapper">
                            <div className="setup-icon-circle success">
                                <FaCheck size={28} />
                            </div>
                        </div>
                        <h2 className="setup-step-title">Select Your Camera</h2>
                        <p className="setup-step-desc">
                            Camera access granted. Choose which camera you'd like to use for the interview.
                        </p>
                        <div className="setup-field">
                            <label className="setup-field-label">Camera Device</label>
                            <select className="setup-select" value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)}>
                                {devices.cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
                            </select>
                        </div>
                        <button className="setup-btn setup-btn-primary" onClick={requestSpeakerPermission}>
                            Continue <span className="setup-btn-arrow">→</span>
                        </button>
                    </div>
                );
            case 3:
                return (
                    <div className="setup-step">
                        <div className="setup-icon-wrapper">
                            <div className="setup-icon-circle">
                                <FaVolumeUp size={28} />
                            </div>
                        </div>
                        <h2 className="setup-step-title">Select Your Speakers</h2>
                        <p className="setup-step-desc">
                            Choose the audio output device you'll use to hear the interviewer's questions.
                        </p>
                        <div className="setup-field">
                            <label className="setup-field-label">Speaker Device</label>
                            <select className="setup-select" value={selectedSpeaker} onChange={e => setSelectedSpeaker(e.target.value)}>
                                {devices.speakers.map(s => <option key={s.deviceId} value={s.deviceId}>{s.label || 'Default Speaker'}</option>)}
                            </select>
                        </div>
                        <button className="setup-btn setup-btn-primary" onClick={startDeviceTest}>
                            Test Devices <span className="setup-btn-arrow">→</span>
                        </button>
                    </div>
                );
            case 4:
                return (
                    <div className="setup-step">
                        <h2 className="setup-step-title">Final Device Check</h2>

                        <div className="setup-test-grid">
                            <div className="setup-video-card">
                                <div className="setup-video-preview">
                                    <video ref={videoRef} autoPlay muted playsInline />
                                    <div className="setup-video-badge">
                                        <span className="setup-live-dot" /> Live
                                    </div>
                                </div>
                            </div>
                            <div className="setup-audio-card">

                                <button
                                    className={`setup-btn ${isTestingAudio ? 'setup-btn-testing' : 'setup-btn-secondary'}`}
                                    onClick={playSpeakerTest}
                                    disabled={isTestingAudio}
                                >
                                    <FaPlay size={12} /> {isTestingAudio ? "Playing..." : "Play Test Sound"}
                                </button>
                                <div className="setup-audio-meter">
                                    <div
                                        className={`setup-audio-fill ${audioLevel >= 70 ? 'good' : 'low'}`}
                                        style={{ width: `${audioLevel}%` }}
                                    />
                                </div>
                                <span className="setup-audio-level">{Math.round(audioLevel)}%</span>
                                <audio ref={audioRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
                            </div>
                        </div>
                        <button className="setup-btn setup-btn-start" onClick={completeSetup}>
                            Start Interview <span className="setup-btn-arrow">→</span>
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="interview-setup-overlay">
            <div className="setup-card">
                <div className="setup-header">
                    <h1 className="setup-brand">Interview Setup</h1>
                    <p className="setup-brand-sub">Configure your devices before we begin</p>
                </div>

                <div className="setup-stepper">
                    {STEP_LABELS.map((label, idx) => {
                        const i = idx + 1;
                        return (
                            <div key={i} className={`step-item ${step > i ? 'completed' : ''} ${step === i ? 'active' : ''}`}>
                                <div className="step-circle">
                                    {step > i ? <FaCheck size={12} /> : i}
                                </div>
                                <span className="step-label">{label}</span>
                                {i < 4 && <div className="step-connector" />}
                            </div>
                        );
                    })}
                </div>

                <div className="setup-content">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
}