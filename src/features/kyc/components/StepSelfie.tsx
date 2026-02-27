'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { StepProps } from '../types';
import WizardCard from './WizardCard';

export default function StepSelfie({
  onNext,
  currentStep = 1,
  onStepClick,
  cameraStream,
}: StepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confirmArrow = useAnimation();
  const takePhotoArrow = useAnimation();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request front camera on mount, release on unmount


  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  
  useEffect(() => {
  if (videoRef.current && cameraStream && !capturedImage) {
    videoRef.current.srcObject = cameraStream;
  }
}, [cameraStream, capturedImage]);

// Confirm — no camera calls at all
const handleConfirm = () => {
  if (!capturedImage) return;
  onNext({ selfieBase64: capturedImage });
};

  if (error) return (
    <WizardCard currentStep={currentStep} totalSteps={4}>
      <div className="p-6 text-red-500 font-medium">{error}</div>
    </WizardCard>
  );

  return (
    <WizardCard currentStep={currentStep} totalSteps={4} onStepClick={onStepClick}>
      <div className="space-y-6 text-center">
        <header className="space-y-1 flex items-center justify-center min-h-5">
          <div>
            <h2 className="text-xl font-bold text-white">Selfie Verification</h2>
            <p className="text-sm text-foreground/60 mt-1">Position your face in the center of the frame.</p>
          </div>
        </header>

        <div className="relative aspect-square max-w-75 mx-auto overflow-hidden rounded-full border-4 border-white/10 bg-black shadow-inner">
          {!capturedImage ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 border-20 border-black/20 pointer-events-none rounded-full" />
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
          {!capturedImage ? (
            <motion.button type="button" onClick={capturePhoto}
              onHoverStart={() => takePhotoArrow.start({ x: 3, transition: { duration: 0.15 } })}
              onHoverEnd={() => takePhotoArrow.start({ x: 0, transition: { duration: 0.15 } })}
              className="relative w-full inline-flex items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 text-white px-8 py-3 text-sm font-medium transition-[box-shadow,transform] duration-200 hover:shadow-md hover:bg-white/30 active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
            >
              <span className="whitespace-nowrap">Take Photo</span>
              <motion.span aria-hidden className="absolute right-5 top-1/2 -translate-y-1/2" animate={takePhotoArrow} initial={{ x: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" />
                </svg>
              </motion.span>
            </motion.button>
          ) : (
            <>
              <motion.button type="button" onClick={handleConfirm}
                onHoverStart={() => confirmArrow.start({ x: 3, transition: { duration: 0.15 } })}
                onHoverEnd={() => confirmArrow.start({ x: 0, transition: { duration: 0.15 } })}
                className="relative w-full inline-flex items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 text-white px-8 py-3 text-sm font-medium transition-[box-shadow,transform] duration-200 hover:shadow-md hover:bg-white/30 active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
              >
                <span className="whitespace-nowrap">Confirm & Continue</span>
                <motion.span aria-hidden className="absolute right-5 top-1/2 -translate-y-1/2" animate={confirmArrow} initial={{ x: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" />
                  </svg>
                </motion.span>
              </motion.button>
              <button type="button" onClick={() => setCapturedImage(null)} className="text-sm text-foreground/50 hover:text-foreground font-medium transition-colors">
                Retake Photo
              </button>
            </>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </WizardCard>
  );
}