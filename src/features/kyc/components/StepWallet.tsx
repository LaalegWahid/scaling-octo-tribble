'use client';

import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { useWallet, groupAndSortWallets } from '@aptos-labs/wallet-adapter-react';
import { StepProps } from '../types';
import WizardCard from './WizardCard';
import { WalletSelector } from '@/shared/components/WalletSelector';
import { PropsWithChildren } from 'react';

const WalletProvider = ({ children }: PropsWithChildren) => (
  <AptosWalletAdapterProvider
    autoConnect={true}
    dappConfig={{
      network: Network.TESTNET,
      aptosApiKeys: { testnet: process.env.APTOS_API_KEY_TESTNET },
    }}
    onError={(error) => console.log('Wallet error', error)}
  >
    {children}
  </AptosWalletAdapterProvider>
);

export default function StepWallet(props: StepProps) {
  return (
    <WalletProvider>
      <StepWalletInner {...props} />
    </WalletProvider>
  );
}

function StepWalletInner({ onNext, currentStep = 0, onStepClick }: StepProps) {
  const { connected, account } = useWallet();
  const continueArrow = useAnimation();

  const walletAddress = account?.address
    ? typeof account.address === 'string'
      ? account.address
      : account.address.toString()
    : null;

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const handleContinue = () => {
    onNext({ walletAddress: walletAddress ?? undefined });
  };

  return (
    <WizardCard currentStep={currentStep} totalSteps={4} onStepClick={onStepClick}>
      <div className="space-y-8">
        {/* Header */}
        <header className="space-y-1">
          <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-sm text-foreground/60">
            Link your Aptos wallet to bind your KYC proof to the blockchain.
          </p>
        </header>

        {/* Wallet visual */}
        <div className="flex flex-col items-center gap-4 py-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center border-2
              transition-all duration-500
              ${connected
                ? 'border-white/40 bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                : 'border-white/10 bg-white/5'}
            `}
          >
            {connected ? (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7H5a2 2 0 010-4h14v4M21 12a2 2 0 010 4H5a2 2 0 010-4h16z" />
              </svg>
            )}
          </motion.div>

          {connected && shortAddress ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-1"
            >
              <p className="text-sm font-medium text-white">Wallet Connected</p>
              <code className="text-xs text-white/50 font-mono">{shortAddress}</code>
            </motion.div>
          ) : (
            <p className="text-sm text-white/40">No wallet connected</p>
          )}
        </div>

        {/* Wallet selector button */}
        <div className="flex justify-center">
          <WalletSelector />
        </div>

        <hr className="border-white/10" />

        {/* Continue */}
        <div className="flex justify-end">
          <motion.button
            type="button"
            disabled={!connected}
            onClick={handleContinue}
            onHoverStart={() => connected && continueArrow.start({ x: 3, transition: { duration: 0.15 } })}
            onHoverEnd={() => connected && continueArrow.start({ x: 0, transition: { duration: 0.15 } })}
            className={`
              relative inline-flex items-center justify-start overflow-hidden
              rounded-full border border-white/30 bg-white/20
              text-white
              pl-6 pr-12 py-2.5 text-sm font-medium
              transition-[box-shadow,transform] duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
              ${connected
                ? 'hover:shadow-md hover:bg-white/30 active:translate-y-px cursor-pointer'
                : 'opacity-40 cursor-not-allowed'}
            `}
          >
            <span className="whitespace-nowrap">Continue</span>
            <motion.span
              aria-hidden
              className="absolute right-4 top-1/2 -translate-y-1/2"
              animate={continueArrow}
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
    </WizardCard>
  );
}