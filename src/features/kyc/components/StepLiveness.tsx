'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FaceLandmarker, ImageEmbedder, FilesetResolver } from '@mediapipe/tasks-vision';
import { StepProps } from '../types';
import WizardCard from './WizardCard';

//  function AIInitLoader({ status }: { status: string }) {
//     const steps = [
//       { id: 'wasm', label: 'Loading WebAssembly Runtime', icon: '⬡' },
//       { id: 'embedder', label: 'Initializing Image Embedder', icon: '◈' },
//       { id: 'landmark', label: 'Loading Face Landmarker', icon: '◎' },
//       { id: 'dna', label: 'Extracting Identity Signature', icon: '❋' },
//     ];

//     // Derive which step we're on from the status string
//     const activeIndex =
//       status.includes('Initializ') ? 0 :
//         status.includes('Embedder') ? 1 :
//           status.includes('Landmark') ? 2 :
//             status.includes('Identity') ? 3 : 0;

//     return (
//       <div className="flex flex-col items-center gap-6 py-4">
//         {/* Animated hex/orb */}
//         <div className="relative w-24 h-24 flex items-center justify-center">
//           {/* Outer spinning ring */}
//           <motion.div
//             className="absolute inset-0 rounded-full border-2 border-transparent"
//             style={{ borderTopColor: 'rgba(255,255,255,0.6)', borderRightColor: 'rgba(255,255,255,0.2)' }}
//             animate={{ rotate: 360 }}
//             transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
//           />
//           {/* Inner counter-spinning ring */}
//           <motion.div
//             className="absolute inset-2 rounded-full border-2 border-transparent"
//             style={{ borderBottomColor: 'rgba(255,255,255,0.4)', borderLeftColor: 'rgba(255,255,255,0.1)' }}
//             animate={{ rotate: -360 }}
//             transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
//           />
//           {/* Pulsing core */}
//           <motion.div
//             className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
//             animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
//             transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
//           >
//             <span className="text-white text-lg">{steps[activeIndex].icon}</span>
//           </motion.div>
//         </div>

//         {/* Step list */}
//         <div className="w-full max-w-xs space-y-2">
//           {steps.map((step, i) => {
//             const isDone = i < activeIndex;
//             const isActive = i === activeIndex;
//             const isPending = i > activeIndex;

//             return (
//               <motion.div
//                 key={step.id}
//                 initial={{ opacity: 0, x: -10 }}
//                 animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
//                 transition={{ delay: i * 0.15, duration: 0.3 }}
//                 className="flex items-center gap-3"
//               >
//                 {/* Status dot */}
//                 <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
//                   {isDone && (
//                     <motion.div
//                       initial={{ scale: 0 }}
//                       animate={{ scale: 1 }}
//                       className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center"
//                     >
//                       <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
//                         <polyline points="20 6 9 17 4 12" />
//                       </svg>
//                     </motion.div>
//                   )}
//                   {isActive && (
//                     <motion.div
//                       className="w-3 h-3 rounded-full bg-white"
//                       animate={{ opacity: [1, 0.3, 1] }}
//                       transition={{ duration: 0.8, repeat: Infinity }}
//                     />
//                   )}
//                   {isPending && (
//                     <div className="w-3 h-3 rounded-full border border-white/30" />
//                   )}
//                 </div>

//                 {/* Label */}
//                 <span className={`text-xs font-mono tracking-wide transition-colors duration-300 ${isDone ? 'text-white/50 line-through' :
//                     isActive ? 'text-white' :
//                       'text-white/20'
//                   }`}>
//                   {step.label}
//                 </span>

//                 {/* Active shimmer badge */}
//                 {isActive && (
//                   <motion.span
//                     className="ml-auto text-[9px] font-bold uppercase tracking-widest text-white/60 bg-white/10 px-2 py-0.5 rounded-full"
//                     animate={{ opacity: [0.5, 1, 0.5] }}
//                     transition={{ duration: 1, repeat: Infinity }}
//                   >
//                     loading
//                   </motion.span>
//                 )}
//               </motion.div>
//             );
//           })}
//         </div>

//         {/* Bottom hint */}
//         <p className="text-[10px] text-white/30 tracking-widest uppercase">
//           All processing is local · Zero data leaves device
//         </p>
//       </div>
//     );
//   }

export default function StepLiveness({ onNext, data, currentStep = 2, onStepClick }: StepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const embedderRef = useRef<ImageEmbedder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const continueArrow = useAnimation();
  const streamRef = useRef<MediaStream | null>(null);

  const selfieDNA = useRef<ReturnType<ImageEmbedder['embed']>['embeddings'][0] | null>(null);
  const rotationTrack = useRef({ left: false, right: false });
  const initialized = useRef(false);

  // UI State
  const [phase, setPhase] = useState<'loading' | 'matching' | 'liveness' | 'done'>('loading');
  const [status, setStatus] = useState('Initializing AI...');
  const [progress, setProgress] = useState(0);
  const [matchScore, setMatchScore] = useState(0);

  // 1. Initialize AI & Extract Selfie DNA
useEffect(() => {
  if (initialized.current) return;
  initialized.current = true;

  async function setupAI() {
    try {
      // Start camera immediately — don't wait for AI
      await startCamera();

      setStatus('Initializing WebAssembly Runtime...');
      const vision = await FilesetResolver.forVisionTasks("/wasm");

      setStatus('Embedder: Loading model weights...');
      embedderRef.current = await ImageEmbedder.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `/models/mobilenet_v3_small.tflite` },
        runningMode: "IMAGE",
      });

      setStatus('Landmark: Loading face model...');
      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { 
          modelAssetPath: `/models/face_landmarker.task`,
          delegate: "GPU" 
        },
        runningMode: "VIDEO",
      });

      if (data.selfieBase64) {
        setStatus('Identity: Extracting DNA signature...');
        const img = new Image();
        img.src = data.selfieBase64;
        await img.decode();
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 224; 
        tempCanvas.height = 224;
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, 224, 224);
          const result = embedderRef.current.embed(tempCanvas);
          
          if (result.embeddings?.[0]) {
            selfieDNA.current = result.embeddings[0];
            setPhase('matching'); // Only transition here, camera already running
          } else {
            setStatus("Selfie too blurry. Please retake.");
          }
        }
      }
    } catch (err) {
      console.error("AI Local Init Error:", err);
      setStatus('AI failed to start (Check /public/wasm files)');
    }
  }

  setupAI();
}, [data.selfieBase64]);

  // 2. Identity Matching
  useEffect(() => {
    if (phase !== 'matching') return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const embedder = embedderRef.current;

      if (video && canvas && embedder && selfieDNA.current && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const liveResult = embedder.embed(canvas);

          if (liveResult.embeddings?.[0]) {
            const sim = ImageEmbedder.cosineSimilarity(selfieDNA.current, liveResult.embeddings[0]);
            setMatchScore(sim);

            if (sim > 0.70) {
              clearInterval(interval);
              setPhase('liveness');
              setStatus('Identity Confirmed! Turn head RIGHT');
            } else {
              setStatus('Face Mismatch. Align with selfie.');
            }
          } else {
            setStatus('Face Not Detected. Adjust lighting.');
            setMatchScore(0);
          }
        } catch (e) {
          console.warn("Embedder Busy...");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // 3. Movement Loop (Landmarks)
  const livenessLoop = useCallback(() => {
    if (phase !== 'liveness' || !videoRef.current || !landmarkerRef.current) return;

    const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
    if (results?.faceLandmarks?.[0]) {
      const landmarks = results.faceLandmarks[0];
      const ratio = Math.abs(landmarks[1].x - landmarks[33].x) / Math.abs(landmarks[1].x - landmarks[263].x);

      if (ratio < 0.35 && !rotationTrack.current.left) {
        rotationTrack.current.left = true;
        handleProgress(50);
      } else if (ratio > 2.8 && !rotationTrack.current.right && rotationTrack.current.left) {
        rotationTrack.current.right = true;
        handleProgress(100);
      }
    }

    if (phase === 'liveness') {
      requestAnimationFrame(livenessLoop);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'liveness') {
      livenessLoop();
    }
  }, [phase, livenessLoop]);

  const handleProgress = (val: number) => {
    setProgress(val);
    if (val === 50) setStatus('Great! Now turn head LEFT');
    if (val === 100) {
      setPhase('done');
      setStatus('Verification Complete!');
    }
  };

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user', width: 640, height: 480 } 
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      // Don't set phase here anymore — AI might not be ready yet
    }
  } catch (e) {
    setStatus('Allow camera access');
  }
};

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleContinue = () => {
    console.log('Continue button clicked - stopping camera');
    stopCamera();
    onNext({});
  };

  // Cleanup camera when component unmounts
  useEffect(() => {
    return () => {
      console.log('StepLiveness unmounting - cleanup camera');
      stopCamera();
    };
  }, [stopCamera]);

  // Add this component above your main export
 

return (
  <WizardCard currentStep={currentStep} totalSteps={4} onStepClick={onStepClick}>
    <div className="space-y-6 text-center">
      <header className="space-y-1 text-center">
        <h2 className="text-xl font-bold text-white">Liveness Detection</h2>
        <p className="text-sm text-foreground/60 mt-1">{status}</p>
      </header>

      {/* Camera circle — always mounted */}
      <div className="relative w-64 h-64 mx-auto">
        {phase === 'matching' && matchScore > 0 && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 bg-accent text-sidebar text-[10px] font-bold px-2 py-1 rounded-full shadow-xl animate-pulse">
            MATCH: {Math.round(matchScore * 100)}%
          </div>
        )}

        <div className={`absolute inset-0 rounded-full border-4 transition-all duration-700 overflow-hidden bg-black ${
          phase === 'liveness'
            ? 'border-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]'
            : 'border-white/5'
        }`}>
          {/* Video always rendered so camera stream attaches immediately */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {/* Loading overlay sits ON TOP of the live feed */}
          {phase === 'loading' && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 p-4">
              {/* Spinning ring */}
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-transparent flex-shrink-0"
                style={{ borderTopColor: 'rgba(255,255,255,0.8)', borderRightColor: 'rgba(255,255,255,0.2)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-white text-[10px] font-mono text-center leading-relaxed">
                {status}
              </p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} width="224" height="224" className="hidden" />

        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#6b21a8', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="128" cy="128" r="124" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
          <circle
            cx="128" cy="128" r="124"
            fill="transparent"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeDasharray={779}
            strokeDashoffset={779 - (779 * progress) / 100}
            className="transition-all duration-1000"
          />
        </svg>
      </div>

      {/* Step list — shown below the circle only during loading */}

      <motion.button
        disabled={phase !== 'done'}
        onClick={handleContinue}
        onHoverStart={() => phase === 'done' && continueArrow.start({ x: 3, transition: { duration: 0.15 } })}
        onHoverEnd={() => phase === 'done' && continueArrow.start({ x: 0, transition: { duration: 0.15 } })}
        className={`
          relative w-full max-w-xs mx-auto inline-flex items-center justify-center overflow-hidden
          rounded-full border border-white/30 bg-white/20 text-white
          px-8 py-3 text-sm font-medium
          transition-[box-shadow,transform] duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
          ${phase === 'done'
            ? 'hover:shadow-md hover:bg-white/30 active:translate-y-px cursor-pointer'
            : 'opacity-50 cursor-not-allowed'}
        `}
      >
        {phase === 'done' ? (
          <>
            <span className="whitespace-nowrap">Continue</span>
            <motion.span
              aria-hidden
              className="absolute right-5 top-1/2 -translate-y-1/2"
              animate={continueArrow}
              initial={{ x: 0, opacity: 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12" />
                <polyline points="14 6 20 12 14 18" />
              </svg>
            </motion.span>
          </>
        ) : phase === 'matching'
          ? `Scanning... (${Math.round(matchScore * 100)}%)`
          : phase === 'loading'
          ? 'Initializing...'
          : `Verifying... ${progress}%`
        }
      </motion.button>
    </div>
  </WizardCard>
);
}