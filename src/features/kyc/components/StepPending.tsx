'use client';

import { motion, useAnimation } from 'framer-motion';
import WizardCard from './WizardCard';
import { RefreshCw, Clock } from 'lucide-react';

interface StepPendingProps {
  onRefresh: () => void;
  isChecking: boolean;
}

export default function StepPending({ onRefresh, isChecking }: StepPendingProps) {
  const refreshIconControls = useAnimation();

  return (
    <WizardCard currentStep={4} totalSteps={4}>
      {/* Symmetrical Spacing: pl-8 matches gap-8 */}
      <div className="w-full flex flex-row items-start gap-8 pl-8 py-8 text-left">
          
          {/* LEFT: Animated Clock/Spinner Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden">
               <div className="absolute inset-0 border-t-2 border-white/50 rounded-full animate-spin" />
               <Clock className="w-10 h-10 text-white/50" />
            </div>
          </div>

          {/* RIGHT: Text Content & Actions */}
          <div className="space-y-4 flex-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Verification in Progress
            </h2>
            
            {/* TEXT UPDATE: First line is slightly longer than the second, but concise. */}
            <p className="text-foreground/60 text-sm leading-relaxed">
              Your data has been successfully encrypted and securely transmitted. <br/>
              Our secure AI engine is analyzing your biometrics.
            </p>
            
            {/* Wait Time Box */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
              <p className="text-foreground/60 text-xs font-medium">
                Estimated wait time: <span className="font-bold text-white">2 to 20 minutes</span>
              </p>
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2 flex justify-end">
              <motion.button
                onClick={onRefresh}
                disabled={isChecking}
                onHoverStart={() => !isChecking && refreshIconControls.start({ rotate: 180, transition: { duration: 0.4 } })}
                onHoverEnd={() => !isChecking && refreshIconControls.start({ rotate: 0, transition: { duration: 0.4 } })}
                whileTap={{ scale: 0.98 }}
                className="
                  relative inline-flex items-center justify-center overflow-hidden
                  rounded-full border border-white/30 bg-white/20
                  text-white
                  pl-6 pr-12 py-3 text-sm font-medium
                  transition-[box-shadow,transform] duration-200
                  hover:shadow-md hover:bg-white/30 active:translate-y-[1px]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <span className="whitespace-nowrap mr-2">
                  {isChecking ? 'Checking Status...' : 'Refresh Status'}
                </span>
                
                <motion.span
                  aria-hidden
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                  animate={isChecking ? { rotate: 360 } : refreshIconControls}
                  transition={isChecking ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.4 }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.span>
              </motion.button>
            </div>
          </div>

      </div>
    </WizardCard>
  );
}