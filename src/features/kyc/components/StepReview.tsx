'use client';

import { motion, useAnimation } from 'framer-motion';
import { StepProps } from '../types';

export default function StepReview({ data, onNext }: StepProps) {
  const submitArrow = useAnimation();
  const totalSteps = 4;
  
  return (
    <div className="flex items-center justify-center min-h-screen px-2 py-3 sm:px-4 sm:py-6 bg-transparent">
      <div className="w-full max-w-full sm:max-w-2xl">
        {/* Completed step indicator */}
        <div className="relative rounded-2xl border border-white/12 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl px-4 py-4 sm:px-8 sm:py-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] mb-4">
          <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 bg-linear-to-br from-white/20 to-white/10 border-white/30 text-white shadow-[0_0_2px_rgba(255,255,255,0.3)]">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {index < totalSteps - 1 && (
                  <div className="w-12 sm:w-16 h-1 rounded-full bg-linear-to-r from-white/25 to-white/15 shadow-[0_0_2px_rgba(255,255,255,0.2)]" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs sm:text-sm text-foreground/60 mt-3 sm:mt-4">powered by <span className="font-bold text-white">zKYC</span></p>
        </div>

        <div className="relative rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
          <div className="space-y-6">
            <header className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Review Application
              </h2>
              <p className="text-sm text-foreground/60">
                Final verification of biometric data
              </p>
            </header>

          {/* 1. Personal Information - UPDATED STYLES */}
          <div className="my-12" />
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                {/* Label: White & Bold */}
                <p className="text-xs text-white uppercase tracking-wide font-bold">Legal Name</p>
                {/* Info: Light (Normal weight) & Grey-to-White */}
                <p className="text-base text-white/80 font-normal">{data.firstName} {data.lastName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white uppercase tracking-wide font-bold">Date of Birth</p>
                <p className="text-base text-white/80 font-normal">{data.dob}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white uppercase tracking-wide font-bold">Email Address</p>
                <p className="text-base text-white/80 font-normal">{data.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white uppercase tracking-wide font-bold">ID Document</p>
                <p className="text-base text-white/80 font-normal">{data.documentType?.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* 2. Visual Evidence Grid */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Biometric Evidence
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Document Front */}
              <div className="space-y-2">
                <div className="aspect-3/4 rounded-2xl bg-black border border-white/10 overflow-hidden relative group shadow-lg">
                  <img src={data.documentFront} alt="Doc Front" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" />
                </div>
              </div>

              {/* Document Back (If applicable) */}
              {data.documentBack && (
                <div className="space-y-2">
                  <div className="aspect-3/4 rounded-2xl bg-black border border-white/10 overflow-hidden relative group shadow-lg">
                    <img src={data.documentBack} alt="Doc Back" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                </div>
              )}

              {/* Selfie DNA */}
              <div className="space-y-2">
                <div className="aspect-3/4 rounded-2xl bg-black border border-accent/30 overflow-hidden relative group shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)] transition-all duration-500 hover:border-accent">
                  <img src={data.selfieBase64} alt="Selfie" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Liveness Check Confirmation Badge */}
          <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Identity Match Confirmed</p>
              <p className="text-xs text-foreground/60">3D Liveness & Biometric Verification Passed</p>
            </div>
          </div>

          {/* 4. Final Action */}
          <div className="flex justify-end pt-4">
            <motion.button
              onClick={() => onNext({})}
              onHoverStart={() => submitArrow.start({ x: 3, transition: { duration: 0.15 } })}
              onHoverEnd={() => submitArrow.start({ x: 0, transition: { duration: 0.15 } })}
              className="
                relative inline-flex items-center justify-start overflow-hidden
                rounded-full border border-white/30 bg-white/20
                text-white
                pl-6 pr-12 py-2.5 text-sm font-medium
                transition-[box-shadow,transform] duration-200
                hover:shadow-md hover:bg-white/30 active:translate-y-px
                focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
              "
            >
              <span className="whitespace-nowrap">Confirm & Submit</span>
              <motion.span
                aria-hidden
                className="absolute right-4 top-1/2 -translate-y-1/2"
                animate={submitArrow}
                initial={{ x: 0, opacity: 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <polyline points="14 6 20 12 14 18" />
                </svg>
              </motion.span>
            </motion.button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}