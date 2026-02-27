'use client';

import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';

interface ProofVerificationProps {
  onBack: () => void;
  onVerify: (proofCode: string) => void;
  variant?: 'page' | 'modal' | 'inline';
}

export default function ProofVerification({ onBack, onVerify }: ProofVerificationProps) {
  const [proofCode, setProofCode] = useState('');
  const verifyArrow = useAnimation();
  const backArrow = useAnimation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (proofCode.trim()) {
      onVerify(proofCode);
    }
  };

  return (
    <div className="w-full"> 
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3"> 
        
        {/* HEADER */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white whitespace-nowrap">Verify Proof</h2>
            
            {/* UPDATED BACK BUTTON - Matches "I have a proof" size & style */}
            <motion.button
              type="button"
              onClick={onBack}
              onHoverStart={() => backArrow.start({ x: -3, transition: { duration: 0.15 } })}
              onHoverEnd={() => backArrow.start({ x: 0, transition: { duration: 0.15 } })}
              className="
                relative inline-flex items-center justify-start overflow-hidden
                rounded-full border border-white/20 bg-white/5
                text-white/60
                pl-12 pr-5 py-2.5 text-sm font-medium
                transition-[box-shadow,transform] duration-200
                hover:shadow-md hover:text-white/80 active:translate-y-px
                focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
              "
            >
              <motion.span
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2"
                animate={backArrow}
                initial={{ x: 0, opacity: 1 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </motion.span>
              <span className="whitespace-nowrap">Back</span>
            </motion.button>
          </div>

          <p className="text-xs text-white/50 leading-tight">
            Enter your authorized proof code below.
          </p>
        </div>

        {/* INPUT */}
        <div className="space-y-1.5 pt-2">
          <Label htmlFor="proofCode" className="text-white text-xs">Proof Code</Label>
          <Input
            id="proofCode"
            name="proofCode"
            type="text"
            placeholder="e.g. KYC-882-991"
            value={proofCode}
            onChange={(e) => setProofCode(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white py-2 text-sm w-full h-10"
            autoFocus
          />
        </div>

        {/* BUTTON - ALIGNED RIGHT */}
        <div className="pt-2 flex justify-end">
          <motion.button
            type="submit"
            onHoverStart={() => verifyArrow.start({ x: 3, transition: { duration: 0.15 } })}
            onHoverEnd={() => verifyArrow.start({ x: 0, transition: { duration: 0.15 } })}
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
            <span className="whitespace-nowrap">Verify Code</span>
            <motion.span
              aria-hidden
              className="absolute right-4 top-1/2 -translate-y-1/2"
              animate={verifyArrow}
              initial={{ x: 0, opacity: 1 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12" />
                <polyline points="14 6 20 12 14 18" />
              </svg>
            </motion.span>
          </motion.button>
        </div>

      </form>
    </div>
  );
}