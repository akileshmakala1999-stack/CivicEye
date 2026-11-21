import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CivicEyeIntroProps {
  onComplete: () => void;
  onExitStart?: () => void;
}

/**
 * CivicEye Cinematic Logo Intro / Splash Screen
 *
 * Sequence:
 * 1. Stage 1 — Initial Appearance (0 - 650ms): Soft fade-in and scale from 96% to 100%
 * 2. Stage 2 — Logo Presence (650 - 1650ms): Centered, stable, subtle gentle breathing
 * 3. Stage 3 — Transition (1650 - 2400ms): Logo gently dissolves, overlay fades, revealing homepage
 * Total duration: ~2.4 seconds (or ~0.8s under prefers-reduced-motion)
 */
export const CivicEyeIntro: React.FC<CivicEyeIntroProps> = ({ onComplete, onExitStart }) => {
  const shouldReduceMotion = useReducedMotion();
  const [animationStage, setAnimationStage] = useState<'enter' | 'presence' | 'exit'>('enter');

  useEffect(() => {
    // Prevent background scrolling while intro is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (shouldReduceMotion) {
      // Abbreviated, motion-free timeline for users who prefer reduced motion
      const presenceTimer = setTimeout(() => {
        setAnimationStage('exit');
        onExitStart?.();
      }, 500);

      const completeTimer = setTimeout(() => {
        document.body.style.overflow = originalOverflow;
        onComplete();
      }, 800);

      return () => {
        clearTimeout(presenceTimer);
        clearTimeout(completeTimer);
        document.body.style.overflow = originalOverflow;
      };
    }

    // Standard Cinematic Timeline
    // Stage 1 -> Stage 2 at 650ms
    const presenceTimer = setTimeout(() => {
      setAnimationStage('presence');
    }, 650);

    // Stage 2 -> Stage 3 at 1650ms
    const exitTimer = setTimeout(() => {
      setAnimationStage('exit');
      onExitStart?.();
    }, 1650);

    // Stage 3 completion at 2400ms
    const completeTimer = setTimeout(() => {
      document.body.style.overflow = originalOverflow;
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(presenceTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [onComplete, onExitStart, shouldReduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: animationStage === 'exit' ? 0 : 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.3 : 0.75,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F5F5F2] select-none pointer-events-auto"
      style={{
        pointerEvents: animationStage === 'exit' ? 'none' : 'auto',
      }}
      role="presentation"
      aria-hidden="true"
    >
      {/* Centered Logo Container */}
      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.95 }
        }
        animate={
          animationStage === 'enter'
            ? { opacity: 1, scale: 1 }
            : animationStage === 'presence'
            ? shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  scale: [1, 1.018, 1],
                  transition: {
                    duration: 1.0,
                    ease: 'easeInOut',
                  },
                }
            : shouldReduceMotion
            ? { opacity: 0 }
            : {
                opacity: 0,
                scale: 1.04,
                transition: {
                  duration: 0.7,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
        }
        transition={
          animationStage === 'enter'
            ? {
                duration: shouldReduceMotion ? 0.2 : 0.65,
                ease: [0.16, 1, 0.3, 1],
              }
            : undefined
        }
        className="flex items-center gap-3 sm:gap-4 md:gap-5"
      >
        {/* Project Official CivicEye Eye Symbol */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0"
          aria-label="CivicEye Symbol"
        >
          {/* Outer Eye Almond Contour */}
          <path
            d="M2.5 16C6 8.5 26 8.5 29.5 16C26 23.5 6 23.5 2.5 16Z"
            stroke="#27473A"
            strokeWidth="2.75"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Iris */}
          <circle
            cx="16"
            cy="16"
            r="5.5"
            fill="#27473A"
          />

          {/* Pupil Highlight */}
          <circle
            cx="14.5"
            cy="14.5"
            r="1.75"
            fill="#FFFFFF"
          />
        </svg>

        {/* CivicEye Wordmark using Project Typography and Colors */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.2,
            duration: shouldReduceMotion ? 0.2 : 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight text-[#171918]"
        >
          Civic<span className="text-[#315C4C]">Eye</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
