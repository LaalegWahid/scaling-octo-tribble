'use client';

interface WizardCardProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onStepClick?: (step: number) => void;
  hideStepIndicator?: boolean;
}

export default function WizardCard({ currentStep, totalSteps, children, onStepClick, hideStepIndicator }: WizardCardProps) {
  return (
    // UPDATED: 'items-start' prevents vertical centering jumps. 'py-10' adds top spacing.
    <div className="flex items-start justify-center min-h-screen px-2 py-10 sm:px-6 sm:py-16 bg-transparent">
      
      <div className="w-full max-w-full sm:max-w-2xl flex flex-col gap-4">
        {/* Step Indicator - Separate Card */}
        {!hideStepIndicator && (
          <div className="relative rounded-2xl border border-white/12 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-xl px-4 py-4 sm:px-8 sm:py-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <div
                    onClick={() => index < currentStep && onStepClick?.(index)}
                    className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300 ${
                      index < currentStep 
                        ? 'bg-linear-to-br from-white/20 to-white/10 border-white/30 text-white shadow-[0_0_2px_rgba(255,255,255,0.3)] cursor-pointer hover:scale-105 hover:shadow-[0_0_4px_rgba(255,255,255,0.5)]' 
                        : index === currentStep 
                        ? 'bg-linear-to-br from-white/25 to-white/15 border-white/40 text-white shadow-[0_0_3px_rgba(255,255,255,0.4)] scale-110' 
                        : 'bg-white/5 border-white/20 text-white/40 cursor-not-allowed'
                    }`}>
                    {index < currentStep ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold">{index + 1}</span>
                    )}
                    {/* Pulse effect for current step */}
                    {index === currentStep && (
                      <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-10" />
                    )}
                  </div>
                  {index < totalSteps - 1 && (
                    <div className={`w-12 sm:w-16 h-1 rounded-full transition-all duration-500 ${
                      index < currentStep 
                        ? 'bg-linear-to-r from-white/25 to-white/15 shadow-[0_0_2px_rgba(255,255,255,0.2)]' 
                        : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs sm:text-sm text-foreground/60 mt-3 sm:mt-4">powered by <span className="font-bold text-white">zKYC</span></p>
          </div>
        )}

        {/* Content Area - Separate Card */}
        <div className="relative rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.25)] overflow-hidden">
          <div key={currentStep} className="animate-slide-in-right">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}