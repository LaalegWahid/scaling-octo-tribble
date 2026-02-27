'use client';

import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { StepProps } from '../types';
import WizardCard from './WizardCard';

interface Props extends StepProps {
  // No additional props needed
}

const feedbackOptions = [
  { emoji: '😤', label: 'Frustrated', value: 1, color: 'from-red-500/20 to-red-600/10' },
  { emoji: '😕', label: 'Confused', value: 2, color: 'from-orange-500/20 to-orange-600/10' },
  { emoji: '😐', label: 'Neutral', value: 3, color: 'from-yellow-500/20 to-yellow-600/10' },
  { emoji: '😊', label: 'Satisfied', value: 4, color: 'from-green-500/20 to-green-600/10' },
  { emoji: '🤩', label: 'Amazing', value: 5, color: 'from-purple-500/20 to-purple-600/10' },
];

export default function UserFeedback({ onNext, data, currentStep = 3, onStepClick }: Props) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const submitArrow = useAnimation();

  const handleSubmit = () => {
    if (selectedRating) {
      console.log('Feedback received:', { rating: selectedRating, feedback: comment });
      onNext({
        rating: selectedRating,
        comment: comment,
      });
    }
  };

  const handleSkip = () => {
    console.log('Feedback skipped');
    onNext({});
  };

  const activeRating = hoveredRating ?? selectedRating;

  return (
    <WizardCard currentStep={currentStep} totalSteps={4} onStepClick={onStepClick}>
      <div className="space-y-6">
        {/* Creative header message */}
        <header className="space-y-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Share Your Experience
          </h2>
          <p className="text-sm text-foreground/60">
            Your feedback shapes our future
          </p>
        </header>

        {/* Emoji Selector */}
            <div className="space-y-4">
              {/* Desktop: Single row */}
              <div className="hidden sm:flex justify-between items-center gap-2 md:gap-4">
                {feedbackOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setSelectedRating(option.value)}
                    onMouseEnter={() => setHoveredRating(option.value)}
                    onMouseLeave={() => setHoveredRating(null)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`relative flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-2xl border transition-all duration-150 flex-1 aspect-square ${
                      selectedRating === option.value
                        ? `border-white/40 bg-linear-to-br ${option.color} shadow-[0_0_20px_rgba(255,255,255,0.15)]`
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                    }`}
                  >
                    {selectedRating === option.value && (
                      <motion.div
                        layoutId="selected-glow"
                        className="absolute inset-0 rounded-2xl bg-white/5"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                    <span className="text-3xl md:text-4xl relative z-10">{option.emoji}</span>
                    <span className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider relative z-10 transition-colors ${
                      selectedRating === option.value ? 'text-white' : 'text-foreground/60'
                    }`}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Mobile: Grid layout (3 top, 2 bottom) */}
              <div className="sm:hidden grid grid-cols-6 gap-3">
                {/* Top row - 3 items (each spans 2 columns) */}
                {feedbackOptions.slice(0, 3).map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setSelectedRating(option.value)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-150 aspect-square col-span-2 ${
                      selectedRating === option.value
                        ? `border-white/40 bg-linear-to-br ${option.color} shadow-[0_0_20px_rgba(255,255,255,0.15)]`
                        : 'border-white/10 bg-white/5 active:border-white/20 active:bg-white/8'
                    }`}
                  >
                    {selectedRating === option.value && (
                      <motion.div
                        layoutId="selected-glow-mobile"
                        className="absolute inset-0 rounded-xl bg-white/5"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                    <span className="text-3xl relative z-10">{option.emoji}</span>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider relative z-10 transition-colors ${
                      selectedRating === option.value ? 'text-white' : 'text-foreground/60'
                    }`}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}

                {/* Bottom row - 2 items (each spans 2 columns with 1 column gap on each side) */}
                <div className="col-span-1"></div>
                {feedbackOptions.slice(3, 5).map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setSelectedRating(option.value)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-150 aspect-square col-span-2 ${
                      selectedRating === option.value
                        ? `border-white/40 bg-linear-to-br ${option.color} shadow-[0_0_20px_rgba(255,255,255,0.15)]`
                        : 'border-white/10 bg-white/5 active:border-white/20 active:bg-white/8'
                    }`}
                  >
                    {selectedRating === option.value && (
                      <motion.div
                        layoutId="selected-glow-mobile"
                        className="absolute inset-0 rounded-xl bg-white/5"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                    <span className="text-3xl relative z-10">{option.emoji}</span>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider relative z-10 transition-colors ${
                      selectedRating === option.value ? 'text-white' : 'text-foreground/60'
                    }`}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
                <div className="col-span-1"></div>
              </div>

              {/* Dynamic feedback message */}
              <div className="min-h-7 flex items-center">
                <motion.p
                  key={activeRating}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: activeRating ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-foreground/70 italic"
                >
                  {activeRating === 1 && "We're sorry to hear that. Let us know how to improve."}
                  {activeRating === 2 && "Help us understand what confused you."}
                  {activeRating === 3 && "Tell us what would make it better."}
                  {activeRating === 4 && "Glad you're satisfied! What did you like?"}
                  {activeRating === 5 && "Wow, thank you! Share what made it amazing."}
                  {!activeRating && "\u00A0"}
                </motion.p>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Comment Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-4">
                Additional Comments <span className="text-foreground/40">(Optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts, suggestions, or concerns..."
                className="w-full min-h-30 px-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-white placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-foreground/40">
                  {comment.length}/500 characters
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={!selectedRating}
              onHoverStart={() => selectedRating && submitArrow.start({ x: 3, transition: { duration: 0.15 } })}
              onHoverEnd={() => selectedRating && submitArrow.start({ x: 0, transition: { duration: 0.15 } })}
              className={`
                relative w-full inline-flex items-center justify-center overflow-hidden
                rounded-full border border-white/30 bg-white/20
                text-white
                px-8 py-3 text-sm font-medium
                transition-[box-shadow,transform] duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20
                ${selectedRating
                  ? 'hover:shadow-md hover:bg-white/30 active:translate-y-px cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
            >
              <span className="whitespace-nowrap">{selectedRating ? 'Submit Feedback' : 'Select a Rating First'}</span>
              {selectedRating && (
                <motion.span
                  aria-hidden
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                  animate={submitArrow}
                  initial={{ x: 0, opacity: 1 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <polyline points="14 6 20 12 14 18" />
                  </svg>
                </motion.span>
              )}
            </motion.button>

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="w-full py-3 text-sm text-foreground/60 hover:text-white transition-colors"
            >
              Ignore Feedback for Now
            </button>

            {/* Privacy Note */}

          </div>
        </WizardCard>
      );
    }
