import { useEffect, useRef, useState } from 'react';
import './VoiceVisualizer.css';

export default function VoiceVisualizer({ analyser, isRecording }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!isRecording) {
        // Clear canvas when not recording
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setVolume(0);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedVolume = Math.min(100, (average / 128) * 100);
      setVolume(normalizedVolume);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw bars
      const barWidth = 4;
      const barGap = 2;
      const barCount = Math.floor(canvas.width / (barWidth + barGap));
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * dataArray.length);
        const value = dataArray[dataIndex];
        const barHeight = (value / 255) * (canvas.height / 2);

        // Create gradient
        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#2563eb');
        gradient.addColorStop(1, '#1d4ed8');

        ctx.fillStyle = gradient;

        // Draw top bar
        ctx.fillRect(
          i * (barWidth + barGap),
          centerY - barHeight,
          barWidth,
          barHeight
        );

        // Draw bottom bar (mirror)
        ctx.fillRect(
          i * (barWidth + barGap),
          centerY,
          barWidth,
          barHeight
        );
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isRecording]);

  return (
    <div className="voice-visualizer">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={100}
        className="visualizer-canvas"
      />
      {isRecording && (
        <div className="volume-indicator">
          <div className="volume-bar">
            <div 
              className="volume-fill" 
              style={{ width: `${volume}%` }}
            />
          </div>
          <span className="volume-text">Volume: {Math.round(volume)}%</span>
        </div>
      )}
    </div>
  );
}
