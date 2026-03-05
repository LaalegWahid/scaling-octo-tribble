// features\kyc\components\StepInfo.tsx
'use client';

import { useRef, useState, useEffect, JSX } from 'react';
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { MouseEvent } from "react";
import { Camera, Upload } from 'lucide-react';
import WizardCard from './WizardCard';
import ProofVerification from './ProofVerification';
import { verifyProofAction } from '../actions/verifyProofAction';
import { StepProps } from '../types';

export default function StepInfo({
  onNext,
  data,
  currentStep = 0,
  onStepClick,
  successUrl,
  ocrFailed,
  onOcrErrorDismiss,
  cameraStream,
}: StepProps) : JSX.Element{
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select an image file.');
      return;
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setCameraError('Image is too large. Please use an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setCapturedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleModeSwitch = (mode: 'camera' | 'upload') => {
    setCapturedImage(null);
    setCameraError(null);
    setInputMode(mode);
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (videoRef.current && cameraStream && !capturedImage && inputMode === 'camera') {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, capturedImage, inputMode]);

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
    if (inputMode === 'camera' && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
    if (inputMode === 'upload' && fileInputRef.current) {
      fileInputRef.current.value = '';
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
// Replace with actual success handling}
  };
}

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
              {/* HEADER */}
              <header className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Passport Scan</h2>
                  <p className="text-sm text-white/50 mt-0.5">
                    Capture or upload the photo page of your passport.
                  </p>
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

              {/* EMAIL INPUT */}
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

              {/* OCR ERROR BANNER */}
              <AnimatePresence>
                {ocrFailed && (
                  <motion.div
                    key="ocr-banner"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm"
                  >
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-red-300">Document scan failed</p>
                      <p className="mt-0.5 text-red-300/70">
                        We couldn&apos;t read your passport. Try again in good lighting with no glare, or upload a photo instead.
                      </p>
                    </div>
                    <button type="button" onClick={onOcrErrorDismiss} aria-label="Dismiss" className="mt-0.5 shrink-0 text-red-400/60 hover:text-red-300 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MODE TOGGLE — only show when no image captured yet */}
              {!capturedImage && (
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('camera')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                      inputMode === 'camera'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                      inputMode === 'upload'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
              )}

              {/* CAMERA VIEW */}
              {inputMode === 'camera' && (
                <>
                  {cameraError ? (
                    <div className="flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-400">
                      {cameraError}
                    </div>
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
                    <p className="text-center text-xs text-white/30">
                      Align the passport photo page within the guide — ensure text is sharp and readable.
                    </p>
                  )}
                </>
              )}

              {/* UPLOAD VIEW */}
              {inputMode === 'upload' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {!capturedImage ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/8 hover:border-white/30 transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors flex items-center justify-center">
                        <Upload className="w-6 h-6 text-white/50 group-hover:text-white/80 transition-colors" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                          Click to upload passport photo
                        </p>
                        <p className="text-xs text-white/30">
                          JPG, PNG, WEBP — max 10MB
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black aspect-[4/3]">
                      <img src={capturedImage} alt="Uploaded passport" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {cameraError && (
                    <p className="text-xs text-red-400 text-center">{cameraError}</p>
                  )}
                </>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                {!capturedImage ? (
                  // Camera mode capture button — upload mode uses the drop zone click directly
                  inputMode === 'camera' && !cameraError && (
                    <motion.button
                      type="button"
                      onClick={capturePhoto}
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
                  )
                ) : (
                  <>
                    <motion.button
                      type="button"
                      onClick={handleConfirm}
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
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="text-sm text-white/40 hover:text-white transition-colors font-medium"
                    >
                      {inputMode === 'camera' ? 'Retake' : 'Choose different file'}
                    </button>
                  </>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          ) : (
            <motion.div
              key="proof-verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ProofVerification
                onBack={() => setShowProofForm(false)}
                onVerify={handleProofVerify}
                variant="inline"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WizardCard>
  );
}