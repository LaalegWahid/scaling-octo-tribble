'use client';

import { motion, useAnimation, AnimatePresence, Variants } from 'framer-motion';
import WizardCard from './WizardCard';
import { Download, Check, ArrowRight, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { KycDecryptedResult } from '../types';

interface StepSuccessProps {
  proofHash: string;
  successUrl?: string;
  result?: KycDecryptedResult | null;
}

export default function StepSuccess({ proofHash, successUrl }: StepSuccessProps) {
  const downloadArrow = useAnimation();
  const confirmArrow = useAnimation(); 
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Masking Logic
  const maskedHash = proofHash.length > 6 
    ? `${proofHash.substring(0, 10)}...${proofHash.substring(proofHash.length - 6)}` 
    : proofHash;

  const triggerDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([proofHash], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "zkpass_proof.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleInitialClick = () => {
    triggerDownload();
    setShowConfirmation(true);
  };

  const handleContinue = () => {
    if (successUrl) {
      window.location.href = successUrl;
    }
  };

  const handleRetryDownload = () => {
    triggerDownload();
  };

  // FIX: Changed from boxShadow (outer) to backgroundColor (inner pulse)
  const glowVariant: Variants = {
    pulse: {
      backgroundColor: [
        "rgba(255, 255, 255, 0.05)", // Start (matches bg-white/5)
        "rgba(255, 255, 255, 0.25)", // Middle (brighter inner glow)
        "rgba(255, 255, 255, 0.05)"  // End
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <WizardCard currentStep={4} totalSteps={4}>
      <div className="min-h-[300px] flex items-center">
      <AnimatePresence mode="wait">
        {!showConfirmation ? (
          // STATE 1: SUCCESS DISPLAY (Initial)
          <motion.div 
            key="success-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-row items-start gap-8 pl-8 py-8 text-left"
          >
            {/* LEFT: Success Icon with Animated Inner Glow */}
            <div className="relative flex-shrink-0">
              <motion.div 
                variants={glowVariant}
                animate="pulse"
                // Removed static bg-white/5 as it's controlled by the animation now
                className="w-24 h-24 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden"
              >
                 <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
                 <Check className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
              </motion.div>
            </div>

            {/* RIGHT: Content */}
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Identity Verified
                </h2>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  Your Zero-Knowledge proof has been generated successfully.
                </p>
              </div>

              <div className="w-full space-y-2 pt-1">
                 <label className="text-[10px] text-foreground/50 uppercase tracking-wider font-bold ml-1">
                   Proof Hash
                 </label>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-full">
                   <code className="text-xs text-white/90 font-mono tracking-wide break-all line-clamp-1 select-none">
                     {maskedHash}
                   </code>
                 </div>
              </div>

              {/* BUTTON */}
              <div className="pt-2 flex justify-end">
                <motion.button
                  onClick={handleInitialClick}
                  onHoverStart={() => downloadArrow.start({ y: 3, transition: { duration: 0.15 } })}
                  onHoverEnd={() => downloadArrow.start({ y: 0, transition: { duration: 0.15 } })}
                  whileTap={{ scale: 0.98 }}
                  className="
                    relative inline-flex items-center justify-center overflow-hidden
                    rounded-full border border-white/30 bg-white/20
                    text-white
                    pl-6 pr-12 py-3 text-sm font-medium
                    transition-[box-shadow,transform] duration-200
                    hover:shadow-md hover:bg-white/30 active:translate-y-[1px]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                  "
                >
                  <span className="whitespace-nowrap mr-2">Download Full Proof</span>
                  <motion.span
                    aria-hidden
                    className="absolute right-5 top-1/2 -translate-y-1/2"
                    animate={downloadArrow}
                    initial={{ y: 0, opacity: 1 }}
                  >
                    <Download className="w-4 h-4" />
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          // STATE 2: CONFIRMATION DISPLAY
          <motion.div 
            key="confirm-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-row items-start gap-8 pl-8 py-8 text-left"
          >
             {/* LEFT: Download Icon with Animated Inner Glow */}
             <div className="relative flex-shrink-0">
               <motion.div 
                 variants={glowVariant}
                 animate="pulse"
                 // Removed static bg-white/5
                 className="w-24 h-24 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden"
               >
                   <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
                   <Download className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
               </motion.div>
             </div>

             {/* RIGHT: Content */}
             <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Download Started
                  </h2>
                  <p className="text-foreground/60 text-sm leading-relaxed max-w-sm">
                     Your proof file is downloading. Once you have it, you can continue to the application.
                  </p>
                </div>
                
                <div className="h-4" />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                      onClick={handleRetryDownload}
                      className="px-4 py-3 rounded-full text-sm font-medium text-white/50 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <RotateCw className="w-3 h-3" />
                    Download Again
                  </button>

                  <motion.button
                      onClick={handleContinue}
                      onHoverStart={() => confirmArrow.start({ x: 3, transition: { duration: 0.15 } })}
                      onHoverEnd={() => confirmArrow.start({ x: 0, transition: { duration: 0.15 } })}
                      whileTap={{ scale: 0.98 }}
                      className="
                        relative inline-flex items-center justify-center overflow-hidden
                        rounded-full border border-white/30 bg-white/20
                        text-white
                        pl-6 pr-12 py-3 text-sm font-medium
                        transition-[box-shadow,transform] duration-200
                        hover:shadow-md hover:bg-white/30 active:translate-y-[1px]
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                      "
                  >
                    <span className="whitespace-nowrap mr-2">I have the file</span>
                    <motion.span
                        aria-hidden
                        className="absolute right-5 top-1/2 -translate-y-1/2"
                        animate={confirmArrow}
                        initial={{ x: 0, opacity: 1 }}
                    >
                        <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </motion.button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </WizardCard>
  );
}