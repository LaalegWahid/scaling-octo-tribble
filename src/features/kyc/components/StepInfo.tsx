'use client';

import { useRef, useState, useEffect } from 'react';
import { StepProps } from '../types';
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { MouseEvent } from "react";
import WizardCard from './WizardCard';
import ProofVerification from './ProofVerification';
import { verifyProofAction } from '../actions/verifyProofAction';

export default function StepInfo({
  onNext,
  data,
  currentStep = 0,
  onStepClick,
  successUrl,
  ocrFailed,
  onOcrErrorDismiss,
  cameraStream,
}: StepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showProofForm, setShowProofForm] = useState(false);

  const arrow = useAnimation();
  const captureArrow = useAnimation();
  const confirmArrow = useAnimation();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const effectiveStep = showProofForm ? 4 : currentStep;

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCapturedImage(canvas.toDataURL('image/jpeg', 0.92));
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
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    onNext({ documentType: 'passport', documentFront: capturedImage, email });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Stream is still open, just re-attach
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  };

  const handleProofClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowProofForm(true);
  };

  const handleProofVerify = async (proofCode: string) => {
    const result = await verifyProofAction(proofCode);
    if (result.exists === true) {
      window.location.href = successUrl || "";
    }
  };

  return (
    <WizardCard currentStep={effectiveStep} totalSteps={4} onStepClick={onStepClick}>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!showProofForm ? (
            <motion.div
              key="capture-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <header className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Passport Scan</h2>
                  <p className="text-sm text-white/50 mt-0.5">Point your camera at the photo page of your passport.</p>
                </div>
                <motion.button
                  onClick={handleProofClick}
                  onHoverStart={() => arrow.start({ x: 3, transition: { duration: 0.15 } })}
                  onHoverEnd={() => arrow.start({ x: 0, transition: { duration: 0.15 } })}
                  className="relative inline-flex items-center justify-start overflow-hidden shrink-0 rounded-full border border-white/20 bg-white/5 text-white/60 pl-5 pr-12 py-2.5 text-sm font-medium transition-[box-shadow,transform] duration-200 hover:shadow-md hover:text-white/80 active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  <span className="whitespace-nowrap">I have a proof</span>
                  <motion.span aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2" animate={arrow} initial={{ x: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" />
                    </svg>
                  </motion.span>
                </motion.button>
              </header>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
                {emailError && (
                  <p className="text-xs text-red-400">{emailError}</p>
                )}
              </div>

              <AnimatePresence>
                {ocrFailed && (
                  <motion.div key="ocr-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-red-300">Document scan failed</p>
                      <p className="mt-0.5 text-red-300/70">We couldn&apos;t read your passport. Please retake in good lighting with no glare or obstruction.</p>
                    </div>
                    <button type="button" onClick={onOcrErrorDismiss} aria-label="Dismiss" className="mt-0.5 shrink-0 text-red-400/60 hover:text-red-300 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {cameraError ? (
                <div className="flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-400">{cameraError}</div>
              ) : (
                <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black aspect-[4/3]">
                  {!capturedImage ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={capturedImage} alt="Captured passport" className="w-full h-full object-cover" />
                  )}
                  {!capturedImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-[85%] h-[65%] rounded-xl border-2 border-white/40 border-dashed" />
                    </div>
                  )}
                </div>
              )}

              {!capturedImage && !cameraError && (
                <p className="text-center text-xs text-white/30">Align the passport photo page within the guide — ensure text is sharp and readable.</p>
              )}

              {!cameraError && (
                <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                  {!capturedImage ? (
                    <motion.button type="button" onClick={capturePhoto}
                      onHoverStart={() => captureArrow.start({ x: 3, transition: { duration: 0.15 } })}
                      onHoverEnd={() => captureArrow.start({ x: 0, transition: { duration: 0.15 } })}
                      className="relative w-full inline-flex items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 text-white px-8 py-3 text-sm font-medium transition-[box-shadow,transform] duration-200 hover:shadow-md hover:bg-white/30 active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                      <span className="whitespace-nowrap">Capture Passport</span>
                      <motion.span aria-hidden className="absolute right-5 top-1/2 -translate-y-1/2" animate={captureArrow} initial={{ x: 0 }}>
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
                        <span className="whitespace-nowrap">Looks Good — Continue</span>
                        <motion.span aria-hidden className="absolute right-5 top-1/2 -translate-y-1/2" animate={confirmArrow} initial={{ x: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" />
                          </svg>
                        </motion.span>
                      </motion.button>
                      <button type="button" onClick={handleRetake} className="text-sm text-white/40 hover:text-white transition-colors font-medium">
                        Retake
                      </button>
                    </>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          ) : (
            <motion.div key="proof-verification" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="w-full">
              <ProofVerification onBack={() => setShowProofForm(false)} onVerify={handleProofVerify} variant="inline" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WizardCard>
  );
}