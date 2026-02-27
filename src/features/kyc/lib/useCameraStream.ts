import { useRef, useCallback, useState } from 'react';

export function useCameraStream() {
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const openCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    // Stop previous stream if switching modes
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraStream(null);
    }

    // Try exact first, fall back to any camera
    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });
    } catch {
      // Fallback: just ask for any camera, no constraints
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    streamRef.current = mediaStream;
    setCameraStream(mediaStream);
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraStream(null);
    }
  }, []);

  return { openCamera, closeCamera, cameraStream };
}