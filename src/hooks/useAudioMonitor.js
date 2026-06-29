import { useEffect, useRef, useState } from 'react';

export function useAudioMonitor(analyser, onViolation) {
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const animationFrameRef = useRef(null);
  const violationTimeoutRef = useRef(null);
  const lastViolationRef = useRef(0);

  useEffect(() => {
    if (!analyser) return;

    setIsMonitoring(true);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const NOISE_THRESHOLD = 60; // Threshold for excessive noise
    const VIOLATION_COOLDOWN = 5000; // 5 seconds between violations
    
    const monitorNoise = () => {
      if (!analyser) return;

      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average noise level
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      
      setNoiseLevel(normalizedLevel);

      // Check for excessive noise
      if (normalizedLevel > NOISE_THRESHOLD) {
        const now = Date.now();
        
        // Only trigger violation if cooldown period has passed
        if (now - lastViolationRef.current > VIOLATION_COOLDOWN) {
          // Wait for 2 seconds of sustained high noise before triggering violation
          if (!violationTimeoutRef.current) {
            violationTimeoutRef.current = setTimeout(() => {
              analyser.getByteFrequencyData(dataArray);
              const currentAverage = dataArray.reduce((a, b) => a + b) / dataArray.length;
              const currentLevel = Math.min(100, (currentAverage / 128) * 100);
              
              if (currentLevel > NOISE_THRESHOLD) {
                lastViolationRef.current = now;
                if (onViolation) {
                  onViolation({
                    type: 'EXCESSIVE_NOISE',
                    level: Math.round(currentLevel),
                    time: new Date().toISOString()
                  });
                }
              }
              violationTimeoutRef.current = null;
            }, 2000);
          }
        }
      } else {
        // Clear timeout if noise drops below threshold
        if (violationTimeoutRef.current) {
          clearTimeout(violationTimeoutRef.current);
          violationTimeoutRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(monitorNoise);
    };

    monitorNoise();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
      setIsMonitoring(false);
    };
  }, [analyser, onViolation]);

  return { noiseLevel, isMonitoring };
}
