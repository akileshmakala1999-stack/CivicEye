import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CivicEyeIntro } from '../components/landing/CivicEyeIntro';
import { ReferenceHero } from '../components/landing/ReferenceHero';
import { ChallengeAndWorkflow } from '../components/landing/ChallengeAndWorkflow';
import { CivicIntelligenceSection } from '../components/landing/CivicIntelligenceSection';
import { DigitalTwinPreviewSection } from '../components/landing/DigitalTwinPreviewSection';
import { TransparencyAndCommunitySection } from '../components/landing/TransparencyAndCommunitySection';
import { FinalCtaBanner } from '../components/landing/FinalCtaBanner';

// Module-level in-memory flag.
// Resets on page reload/refresh (F5) or initial site opening.
// Persists across client-side SPA navigation within the app (e.g., navigating / -> /dashboard -> /).
// If the initial visit URL is NOT '/', we set introAlreadyPlayed = true so that direct navigation
// to other routes and subsequent internal SPA navigation to '/' does NOT play the intro.
const isInitialVisitRoot = typeof window !== 'undefined' && window.location.pathname === '/';
let introAlreadyPlayed = !isInitialVisitRoot;

export const LandingPage: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(!introAlreadyPlayed);
  const [isRevealing, setIsRevealing] = useState<boolean>(introAlreadyPlayed);

  const handleExitStart = () => {
    setIsRevealing(true);
  };

  const handleIntroComplete = () => {
    introAlreadyPlayed = true;
    setShowIntro(false);
    setIsRevealing(true);
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <CivicEyeIntro
            key="civiceye-cinematic-intro"
            onComplete={handleIntroComplete}
            onExitStart={handleExitStart}
          />
        )}
      </AnimatePresence>

      <motion.main
        initial={!introAlreadyPlayed ? { opacity: 0, y: 14 } : false}
        animate={isRevealing ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#F5F5F2] selection:bg-[#DDE7DF] selection:text-[#315C4C]"
      >
        {/* 1. Panoramic Editorial Hero with Hyderabad Civic Network Overlay */}
        <ReferenceHero />

        {/* 2. The Challenge & How CivicEye Works (6-Step Lifecycle) */}
        <ChallengeAndWorkflow />

        {/* 3. Civic Intelligence & Spatial Heatmap Visualization */}
        <CivicIntelligenceSection />

        {/* 4. Civic Digital Twin Simulation Engine */}
        <DigitalTwinPreviewSection />

        {/* 5. Transparency Audit Ledger & Community Participation */}
        <TransparencyAndCommunitySection />

        {/* 6. Pre-Footer Action Banner */}
        <FinalCtaBanner />
      </motion.main>
    </>
  );
};

export default LandingPage;
