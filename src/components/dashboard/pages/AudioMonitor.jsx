import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineMicrophone, HiOutlineStopCircle, HiOutlinePlayCircle } from "react-icons/hi2";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import "./AudioMonitor.css";

const AudioMonitor = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0) setSelectedDeviceId(audioInputs[0].deviceId);
      } catch (err) {
        console.error("Error accessing devices:", err);
      }
    };
    getDevices();
    return () => stopMonitoring(); // Cleanup on unmount
  }, []);

  const toggleMonitor = async () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      await startMonitoring();
    }
    setIsMonitoring(!isMonitoring);
  };

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
      });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; 
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) { sum += dataArray[i]; }
        const average = sum / bufferLength;
        setAudioLevel(Math.min((average / 128) * 100, 100));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.error("Microphone access error:", err);
    }
  };

  const stopMonitoring = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setAudioLevel(0);
  };

  return (
    <Card className="audio-monitor-card">
      <div className="monitor-header">
        <div className="icon-badge">
          <HiOutlineMicrophone />
        </div>
        <div className="header-text">
          <h4>Audio Input Settings</h4>
          <p>Check your microphone levels before starting</p>
        </div>
      </div>

      <div className="monitor-body">
        <div className="input-group-ui mb-4">
          <label className="label-ui">Select Input Device</label>
          <select 
            className="input-ui"
            value={selectedDeviceId} 
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isMonitoring}
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>

        <button 
          className={`btn-monitor-toggle ${isMonitoring ? 'is-active' : ''}`}
          onClick={toggleMonitor}
        >
          {isMonitoring ? (
            <><HiOutlineStopCircle /> Stop Test</>
          ) : (
            <><HiOutlinePlayCircle /> Test Microphone</>
          )}
        </button>

        {/* Professional Segmented Meter */}
        <div className="meter-section">
          <div className="d-flex justify-content-between mb-2">
            <span className="meter-label">Input Level</span>
            <span className="meter-percentage">{Math.round(audioLevel)}%</span>
          </div>
          
          <div className="meter-container">
            <div 
              className={`meter-fill ${audioLevel > 80 ? 'peak' : ''}`}
              style={{ width: `${audioLevel}%` }}
            />
            {/* Background Grid Lines for a technical look */}
            <div className="meter-grid">
              {[...Array(10)].map((_, i) => <div key={i} className="grid-line" />)}
            </div>
          </div>
          
          <p className="meter-hint">
            {audioLevel > 10 ? "Signal detected" : "Speak into your mic to test..."}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AudioMonitor;