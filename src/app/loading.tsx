"use client"

import BlurText from '../shared/components/ui/blurText';

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <BlurText
        text="Powered by zKYC"
        delay={400}
        stepDuration={0.6}
        className="text-2xl font-medium text-white"
      />
    </div>
  );
}