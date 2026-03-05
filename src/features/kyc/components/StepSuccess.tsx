'use client';

import { motion, useAnimation, AnimatePresence, Variants } from 'framer-motion';
import WizardCard from './WizardCard';
import { Download, Check, Copy, Share2, RotateCw } from 'lucide-react';
import { useState } from 'react';

interface StepSuccessProps {
  proofHash: string;
  successUrl?: string;
}

type ActionState = 'idle' | 'success';

export default function StepSuccess({ proofHash, successUrl }: StepSuccessProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [copyState, setCopyState] = useState<ActionState>('idle');
  const [shareState, setShareState] = useState<ActionState>('idle');

  const maskedHash = proofHash.length > 6
    ? `${proofHash.substring(0, 10)}...${proofHash.substring(proofHash.length - 6)}`
    : proofHash;

  // ── Actions ────────────────────────────────────────────────────────────────

  const triggerDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([proofHash], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "zkpass_proof.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownload = () => {
    triggerDownload();
    setShowConfirmation(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proofHash);
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Fallback for browsers that block clipboard without interaction
      const ta = document.createElement('textarea');
      ta.value = proofHash;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'zKYC Proof Hash',
          text: `My zKYC verification proof hash: ${proofHash}`,
        });
        setShareState('success');
        setTimeout(() => setShareState('idle'), 2000);
      } catch {
        // User cancelled share — do nothing
      }
    } else {
      // Fallback: copy to clipboard with a note
      await handleCopy();
    }
  };

  const handleContinue = () => {
        if (successUrl) window.location.href = successUrl;

console.log('User confirmed ');};

  const glowVariant: Variants = {
    pulse: {
      backgroundColor: [
        "rgba(255, 255, 255, 0.05)",
        "rgba(255, 255, 255, 0.25)",
        "rgba(255, 255, 255, 0.05)"
      ],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
  };

  // ── Action button config ───────────────────────────────────────────────────

  const actions = [
    {
      id: 'copy',
      label: copyState === 'success' ? 'Copied!' : 'Copy',
      icon: copyState === 'success' ? Check : Copy,
      onClick: handleCopy,
      active: copyState === 'success',
    },
    {
      id: 'download',
      label: 'Download',
      icon: Download,
      onClick: handleDownload,
      active: false,
    },
    {
      id: 'share',
      label: shareState === 'success' ? 'Shared!' : 'Share',
      icon: shareState === 'success' ? Check : Share2,
      onClick: handleShare,
      active: shareState === 'success',
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <WizardCard currentStep={4} totalSteps={4}>
      <div className="min-h-[300px] flex items-center">
        <AnimatePresence mode="wait">

          {!showConfirmation ? (
            // ── STATE 1: SUCCESS + ACTIONS ───────────────────────────────────
            <motion.div
              key="success-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-6 px-4 sm:pl-8 sm:pr-4 py-8 text-left"
            >
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <motion.div
                  variants={glowVariant}
                  animate="pulse"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden"
                >
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="space-y-5 flex-1 w-full">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Identity Verified
                  </h2>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    Your Zero-Knowledge proof has been generated successfully.
                  </p>
                </div>

                {/* Hash display */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-foreground/40 uppercase tracking-wider font-bold ml-1">
                    Proof Hash
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full">
                    <code className="text-xs text-white/80 font-mono tracking-wide break-all select-none">
                      {maskedHash}
                    </code>
                  </div>
                </div>

                {/* Three action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {actions.map(({ id, label, icon: Icon, onClick, active }) => (
                    <motion.button
                      key={id}
                      onClick={onClick}
                      whileTap={{ scale: 0.96 }}
                      className={`
                        flex flex-col items-center justify-center gap-2 rounded-2xl border py-4 px-2
                        text-xs font-medium transition-all duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20
                        ${active
                          ? 'border-white/30 bg-white/15 text-white'
                          : 'border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/25'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                      <span>{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

          ) : (
            // ── STATE 2: DOWNLOADED CONFIRMATION ────────────────────────────
            <motion.div
              key="confirm-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-6 px-4 sm:pl-8 sm:pr-4 py-8 text-left"
            >
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <motion.div
                  variants={glowVariant}
                  animate="pulse"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden"
                >
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
                  <Download className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="space-y-5 flex-1 w-full">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Download Started
                  </h2>
                  <p className="text-foreground/60 text-sm leading-relaxed max-w-sm">
                    Your proof file is downloading. Keep it safe — you&apos;ll need it to verify your identity in the future.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
                  <button
                    onClick={triggerDownload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/20"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Download again
                  </button>

                  <motion.button
                    onClick={handleContinue}
                    whileTap={{ scale: 0.98 }}
                    className="
                      relative inline-flex items-center justify-center overflow-hidden
                      rounded-full border border-white/30 bg-white/20
                      text-white w-full sm:w-auto
                      pl-6 pr-12 py-2.5 text-sm font-medium
                      transition-[box-shadow,background] duration-200
                      hover:shadow-md hover:bg-white/30 active:translate-y-[1px]
                      focus:outline-none
                    "
                  >
                    <span className="whitespace-nowrap mr-2">I have the file</span>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <polyline points="14 6 20 12 14 18" />
                      </svg>
                    </span>
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