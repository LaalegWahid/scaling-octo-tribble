'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Components
import StepInfo from './components/StepInfo';
import StepSelfie from './components/StepSelfie';
import StepLiveness from './components/StepLiveness';
import StepReview from './components/StepReview';
import StepPending from './components/StepPending';
import StepSuccess from './components/StepSuccess';
import StepWallet from './components/StepWallet';
import StepSigning from './components/StepSigning';
import UserFeedback from './components/UserFeedback';

// Types & Actions
import { KycWizardState, KycStatus, SdkClientProps, StepProps } from './types';
import { submitKycAction } from './actions/submitFormAction';
import { verifyTokenAction } from '@/features/kyc/actions/verifyTokenAction';
import { useCameraStream } from './lib/useCameraStream';

export default function KycWizardOrchestrator({
  initialStatus,
  userId,
  tokenId,
  successUrl,
  failureUrl,
  initialProof,
  externalUserId,
  environment,
}: SdkClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<KycWizardState>({});
  const [status, setStatus] = useState<KycStatus>(initialStatus);
  const [isUploading, setIsUploading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // ← new
  const [proofHash, setProofHash] = useState<string | null>(
    initialProof || null
  );

  const { openCamera, closeCamera, cameraStream } = useCameraStream();

  const [ocrFailed, setOcrFailed] = useState(false);

  useEffect(() => {
   // StepSelfie
      openCamera('user').catch(() => { });
    
  }, [currentStep]);

const steps: FC<StepProps>[] = [StepInfo, StepSelfie,StepLiveness, StepReview ];
  const ActiveStepComponent = steps[currentStep];

  const handleRequestCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    await openCamera(facingMode);
  }, [openCamera]);

  const handleReleaseCamera = useCallback(() => {
    closeCamera();
  }, [closeCamera]);
  // ── Step navigation ────────────────────────────────────────────────────────

  const handleStepNext = (stepData: Partial<KycWizardState>) => {
    const updatedData = { ...wizardData, ...stepData };
    setWizardData(updatedData);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleInitialSubmit(userId, tokenId, updatedData);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

const handleInitialSubmit = async (
  userId: string,
  tokenId: string,
  finalData: KycWizardState
) => {
  setIsUploading(true);
  setErrorMessage(null);
  try {
    if (!finalData.documentFront) throw new Error('Missing passport photo.');
    if (!finalData.selfieBase64) throw new Error('Missing selfie photo.');
    if (!finalData.email) throw new Error('Missing email.');
    if (!environment) throw new Error('Missing environment configuration.');

    const result = await submitKycAction(
      userId, tokenId, environment, {
        userData: {
          type: 'PERSON',
          firstName: '',
          lastName: '',
          email: finalData.email,
          dob: '',
          external_applicant_id: tokenId,
        },
        document: {
          type: 'passport',
          front: finalData.documentFront,
          back: undefined,
          expiracyDate: '',
        },
        selfie: finalData.selfieBase64,
        feedback: {
          comment: finalData.comment,
          rating: finalData.rating,
        },
        walletAddress: finalData.walletAddress,
        walletSignature: finalData.walletSignature,
      }
    );

    // ← Now we check the typed result, no try/catch needed for error routing
    if (!result.ok) {
      if (result.errorCode === 'OCR_FAILED') {
        setOcrFailed(true);
        setCurrentStep(2); // back to StepInfo
        return;
      }
      setErrorMessage(result.message || 'An unexpected error occurred.');
          setStatus('Success');

      return;
    }

    setProofHash(result.proofHash);
    setStatus('Success');

  } catch (err: any) {
    // Only truly unexpected client-side errors land here
    console.error('Submission error:', err);
    setErrorMessage(err?.message.details[0] || 'An unexpected error occurred. Please try again.');
  } finally {
    setIsUploading(false);
  }
};
  // ── Refresh ────────────────────────────────────────────────────────────────
  // --- 3. Refresh Status ---
  const handleRefreshStatus = async () => {
    setIsChecking(true);
    try {
      const result = await verifyTokenAction(tokenId);
      if (result.status === 'Success') {
        setProofHash(result.proof);
        setStatus('Success');
      } 
    } catch (e) {
      console.error('Refresh failed', e);
    } finally {
      setIsChecking(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isUploading) {
    return (
      <div className="flex items-start justify-center min-h-screen px-2 py-10 sm:px-6 sm:py-16">
        <div className="w-full max-w-full sm:max-w-2xl flex flex-col gap-4">

          {/* Step indicator */}
          <div className="relative rounded-2xl border border-white/12 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl px-4 py-4 sm:px-8 sm:py-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 bg-linear-to-br from-white/20 to-white/10 border-white/30 text-white">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {index < 3 && (
                    <div className="w-12 sm:w-16 h-1 rounded-full bg-linear-to-r from-white/25 to-white/15" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs sm:text-sm text-foreground/60 mt-3 sm:mt-4">
              powered by <span className="font-bold text-white">zKYC</span>
            </p>
          </div>

          {/* Content card */}
          <div className="relative rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.25)]">
            <div className="w-full flex flex-col sm:flex-row items-center sm:items-start gap-6 py-6 sm:py-8 px-4 sm:pl-8 sm:pr-4 text-left">

              {/* Spinner icon */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-0 border-t-2 border-white/50 rounded-full animate-spin" />
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Text */}
              <div className="space-y-4 flex-1 w-full text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Submitting Your Verification
                </h2>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  Your biometric data is being securely transmitted and verified.{' '}
                  <br className="hidden sm:block" />
                  Please keep this window open — this may take up to a minute.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 w-full">
                  <p className="text-foreground/60 text-xs font-medium">
                    Estimated time: <span className="font-bold text-white">15 – 60 seconds</span>
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'Pending') {
    return <StepPending onRefresh={handleRefreshStatus} isChecking={isChecking} />;
  }

  if (status === 'Success') {
    return (
      <StepSuccess
        proofHash={proofHash || "0x_MOCK_FALLBACK_PROOF"}
        successUrl={successUrl}
      />
    );
  }

  // Error state — shown for both submission errors and webhook rejections
  // if (status === 'Error' || errorMessage) {
  //   return (
  //     <div className="flex items-start justify-center min-h-screen px-2 py-10 sm:px-6 sm:py-16">
  //       <div className="w-full max-w-full sm:max-w-2xl flex flex-col gap-4">

  //         {/* Step indicator — all steps shown as errored */}
  //         <div className="relative rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl px-4 py-4 sm:px-8 sm:py-5">
  //           <div className="flex items-center justify-center gap-2">
  //             <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
  //               <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  //                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  //               </svg>
  //             </div>
  //           </div>
  //           <p className="text-center text-xs text-red-400/70 mt-3">
  //             powered by <span className="font-bold text-red-400">zKYC</span>
  //           </p>
  //         </div>

  //         {/* Error card */}
  //         <motion.div
  //           initial={{ opacity: 0, y: 12 }}
  //           animate={{ opacity: 1, y: 0 }}
  //           transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  //           className="relative rounded-2xl border border-red-500/20 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
  //         >
  //           <div className="space-y-6">

  //             {/* Icon + heading */}
  //             <div className="flex flex-col items-center gap-4 py-4 text-center">
  //               <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
  //                 <svg className="w-9 h-9 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
  //                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
  //                 </svg>
  //               </div>
  //               <div>
  //                 <h2 className="text-xl font-bold text-white">Submission Failed</h2>
  //                 <p className="text-sm text-white/50 mt-1 max-w-sm">
  //                                     {errorMessage || 'Something went wrong during submission.'}

  //                 </p>
  //               </div>
  //             </div>

  //             <hr className="border-white/10" />

  //             {/* Actions */}
  //             <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

  //               {/* Try again — go back to review step */}
  //               <button
  //                 onClick={() => {
  //                   setErrorMessage(null);
  //                   setCurrentStep(steps.length - 1); // back to StepReview
  //                 }}
  //                 className="w-full sm:w-auto text-sm text-white/40 hover:text-white transition-colors px-4 py-2"
  //               >
  //                 ← Go back and retry
  //               </button>

  //               {/* If failureUrl is set, offer redirect */}
  //               {failureUrl && (
  //                 <motion.a
  //                   href={failureUrl}
  //                   whileTap={{ scale: 0.98 }}
  //                   className="
  //                     relative inline-flex items-center justify-center overflow-hidden
  //                     rounded-full border border-white/30 bg-white/10
  //                     text-white/70
  //                     px-6 py-2.5 text-sm font-medium
  //                     transition-[box-shadow,background] duration-200
  //                     hover:bg-white/20 hover:text-white
  //                   "
  //                 >
  //                   Return to application
  //                 </motion.a>
  //               )}
  //             </div>

  //           </div>
  //         </motion.div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <div className="flex-1 flex flex-col bg-transparent">
        <ActiveStepComponent
          onNext={handleStepNext}
          data={wizardData}
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
          tokenId={tokenId}
          successUrl={successUrl}
          ocrFailed={ocrFailed}
          onOcrErrorDismiss={() => setOcrFailed(false)}
          cameraStream={cameraStream}
          onRequestCamera={handleRequestCamera}
          onReleaseCamera={handleReleaseCamera}
        />
      </div>
    </div>
  );
}