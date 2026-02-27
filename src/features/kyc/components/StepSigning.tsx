'use client';

import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { PropsWithChildren } from 'react';
import WizardCard from './WizardCard';
import { StepProps } from '../types';

const WalletProvider = ({ children }: PropsWithChildren) => (
  <AptosWalletAdapterProvider
    autoConnect={true}
    dappConfig={{
      network: Network.TESTNET,
      aptosApiKeys: { testnet: process.env.APTOS_API_KEY_TESTNET },
    }}
    onError={(err) => console.error('Wallet error', err)}
  >
    {children}
  </AptosWalletAdapterProvider>
);

export default function StepSigning({ onNext, currentStep = 1, onStepClick, data }: StepProps) {
  return (
    <WalletProvider>
      <StepSigningInner
        onNext={onNext}
        currentStep={currentStep}
        onStepClick={onStepClick}
        data={data}
      />
    </WalletProvider>
  );
}

type SignPhase = 'idle' | 'signing' | 'done' | 'error';

function StepSigningInner({ onNext, currentStep, onStepClick }: StepProps) {
  const { account, signMessage, connected } = useWallet();
  const continueArrow = useAnimation();

  const [phase, setPhase] = useState<SignPhase>('idle');
  const [statusText, setStatusText] = useState(
    'Sign a message with your Aptos wallet to authorize your KYC submission.'
  );
  const [signedAddress, setSignedAddress] = useState<string | null>(null);

  const address = account?.address
    ? typeof account.address === 'string'
      ? account.address
      : account.address.toString()
    : null;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const handleSign = async () => {
    if (!connected || !address) return;

    setPhase('signing');
    setStatusText('Waiting for your wallet signature...');

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = Math.random().toString(36).substring(2, 15);

      const messageText = [
        'zKYC Submission Authorization',
        '',
        'I authorize this KYC verification submission and confirm',
        'I am the owner of this Aptos wallet.',
        '',
        `Wallet: ${address}`,
        `Timestamp: ${timestamp}`,
        `Nonce: ${nonce}`,
      ].join('\n');

      const signatureResponse = await signMessage({ message: messageText, nonce });
      if (!signatureResponse) throw new Error('Signature was cancelled.');

      const publicKey = Array.isArray(account?.publicKey)
        ? account.publicKey[0]
        : account?.publicKey || '';

      // Just store in state — no DB call here
      const payload = {
        wallet_address: address,
        signature: signatureResponse.signature,
        public_key: publicKey,
        full_message: signatureResponse.fullMessage || messageText,
        timestamp,
        nonce,
      };

      setSignedAddress(address);
      setPhase('done');
      setStatusText('Wallet authorized! You can now proceed with your KYC.');

      // Store payload in wizardData for submitKycAction to use later
      // Don't call onNext yet — wait for the Continue button
      // so the user sees the success state
      // We store it temporarily in a ref-like pattern via state
      setPendingPayload(payload);
    } catch (err: any) {
      console.error('Signing error:', err);
      setPhase('error');
      setStatusText(
        err?.message?.toLowerCase().includes('cancel')
          ? 'Signature was cancelled. Please try again.'
          : err?.message || 'Something went wrong. Please try again.'
      );
    }
  };

  // Hold the payload until user clicks Continue
  const [pendingPayload, setPendingPayload] = useState<object | null>(null);

  const handleContinue = () => {
    onNext({
      walletAddress: signedAddress ?? undefined,
      walletSignature: pendingPayload ?? undefined,
    });
  };

  const handleRetry = () => {
    setPhase('idle');
    setPendingPayload(null);
    setStatusText('Sign a message with your Aptos wallet to authorize your KYC submission.');
  };

  const phaseIcon: Record<SignPhase, React.ReactNode> = {
    idle: (
      <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      </svg>
    ),
    signing: (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full"
      />
    ),
    done: (
      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
      </svg>
    ),
  };

  if(!currentStep) return

  return (
    <WizardCard currentStep={currentStep} totalSteps={4} onStepClick={onStepClick}>
      <div className="space-y-8">

        <header className="space-y-1">
          <h2 className="text-xl font-bold text-white">Authorize Submission</h2>
          <p className="text-sm text-foreground/60">{statusText}</p>
        </header>

        <div className="flex flex-col items-center gap-4 py-4">
          <motion.div
            key={phase}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center border-2
              transition-colors duration-500
              ${phase === 'done'
                ? 'border-white/40 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                : phase === 'error'
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-white/10 bg-white/5'}
            `}
          >
            {phaseIcon[phase]}
          </motion.div>

          {shortAddress && (
            <code className="text-xs text-white/40 font-mono">{shortAddress}</code>
          )}

          {phase === 'done' && signedAddress && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-center"
            >
              <p className="text-xs text-white/50 mb-1">Authorized as</p>
              <code className="text-xs text-white/80 font-mono">
                {signedAddress.slice(0, 10)}...{signedAddress.slice(-8)}
              </code>
            </motion.div>
          )}
        </div>

        {(phase === 'idle' || phase === 'error') && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              What this does
            </p>
            <p className="text-xs text-white/50 leading-relaxed">
              Proves you own this Aptos wallet before submitting your KYC documents.
              No tokens are transferred or permissions granted.
            </p>
          </div>
        )}

        <hr className="border-white/10" />

        <div className="flex items-center justify-between">
          {phase === 'error' && (
            <button
              onClick={handleRetry}
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              Try again
            </button>
          )}

          <div className="ml-auto">
            {phase !== 'done' ? (
              <motion.button
                type="button"
                disabled={phase === 'signing' || !connected}
                onClick={handleSign}
                onHoverStart={() =>
                  phase === 'idle' && connected &&
                  continueArrow.start({ x: 3, transition: { duration: 0.15 } })
                }
                onHoverEnd={() => continueArrow.start({ x: 0, transition: { duration: 0.15 } })}
                className={`
                  relative inline-flex items-center justify-start overflow-hidden
                  rounded-full border border-white/30 bg-white/20 text-white
                  pl-6 pr-12 py-2.5 text-sm font-medium
                  transition-[box-shadow,transform] duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                  ${phase === 'idle' && connected
                    ? 'hover:shadow-md hover:bg-white/30 active:translate-y-px cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'}
                `}
              >
                <span className="whitespace-nowrap">
                  {phase === 'signing' ? 'Waiting for wallet...' : 'Sign & Authorize'}
                </span>
                <motion.span
                  aria-hidden
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  animate={continueArrow}
                  initial={{ x: 0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <polyline points="14 6 20 12 14 18" />
                  </svg>
                </motion.span>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleContinue}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onHoverStart={() =>
                  continueArrow.start({ x: 3, transition: { duration: 0.15 } })
                }
                onHoverEnd={() => continueArrow.start({ x: 0, transition: { duration: 0.15 } })}
                className="
                  relative inline-flex items-center justify-start overflow-hidden
                  rounded-full border border-white/30 bg-white/20 text-white
                  pl-6 pr-12 py-2.5 text-sm font-medium
                  transition-[box-shadow,transform] duration-200
                  hover:shadow-md hover:bg-white/30 active:translate-y-px cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                "
              >
                <span className="whitespace-nowrap">Continue</span>
                <motion.span
                  aria-hidden
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  animate={continueArrow}
                  initial={{ x: 0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <polyline points="14 6 20 12 14 18" />
                  </svg>
                </motion.span>
              </motion.button>
            )}
          </div>
        </div>

      </div>
    </WizardCard>
  );
}