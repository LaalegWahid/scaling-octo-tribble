'use client';

import { motion } from 'framer-motion';
import KycWizardOrchestrator from '@/features/kyc';
import { SdkClientProps } from '../types';

export default function SdkClientUI({
  userId,
  initialStatus,
  tokenId,
  successUrl,
  failureUrl,
  externalUserId,
  
  initialProof,
  environment,
}: SdkClientProps) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <motion.div
        key={userId}
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <KycWizardOrchestrator
          initialStatus={initialStatus}
          userId={userId}
          tokenId={tokenId}
          successUrl={successUrl}
          failureUrl={failureUrl}
          initialProof={initialProof}
          externalUserId={externalUserId}
          environment={environment}
        />
      </motion.div>
    </main>
  );
}