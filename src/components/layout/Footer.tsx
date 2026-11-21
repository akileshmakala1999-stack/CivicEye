import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Youtube, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <footer className={`border-t border-[#E4E6E2] text-[#171918] ${isLandingPage ? 'bg-[#F5F5F2]' : 'bg-[#F5F5F2]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Top Primary Navigation Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-8">
          {/* Brand Left */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Logo size="md" />
            <span className="hidden sm:inline-block text-[#D1D5CB]">•</span>
            <span className="text-xs sm:text-sm text-[#737773] font-normal">
              Building a better city, together. Smarter Cities, Stronger Communities.
            </span>
          </div>

          {/* Center Main Links */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-3 sm:gap-4 md:gap-5 text-xs sm:text-sm font-medium text-[#171918] whitespace-nowrap">
            <Link to="/dashboard" className="hover:text-[#315C4C] transition-colors">
              Platform
            </Link>
            <span className="text-[#D1D5CB] select-none">/</span>
            <Link to="/how-it-works" className="hover:text-[#315C4C] transition-colors">
              How It Works
            </Link>
            <span className="text-[#D1D5CB] select-none">/</span>
            <Link to="/insights" className="hover:text-[#315C4C] transition-colors">
              Intelligence
            </Link>
            <span className="text-[#D1D5CB] select-none">/</span>
            <Link to="/transparency" className="hover:text-[#315C4C] transition-colors">
              Transparency
            </Link>
          </div>

          {/* Right Secondary Links & Social Icons */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4 text-xs sm:text-sm text-[#737773]">
              <Link to="/community" className="hover:text-[#171918] transition-colors">
                Community
              </Link>
              <span className="text-[#D1D5CB]">|</span>
              <a href="mailto:support@civiceye.internal" className="hover:text-[#171918] transition-colors">
                Support
              </a>
              <span className="text-[#D1D5CB]">|</span>
              <Link to="/privacy" className="hover:text-[#171918] transition-colors">
                About
              </Link>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2 text-[#315C4C]">
              {/* X / Twitter */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-[#E8EAE5] hover:bg-[#315C4C] hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                aria-label="X (Twitter)"
              >
                𝕏
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-[#E8EAE5] hover:bg-[#315C4C] hover:text-white flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={14} />
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full bg-[#E8EAE5] hover:bg-[#315C4C] hover:text-white flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Thin Divider Line */}
        <div className="border-t border-[#E4E6E2]"></div>

        {/* Bottom Legal & Copyright Row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737773]">
          <div>
            © 2026 CivicEye. Building a more responsive Hyderabad. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-[#171918] transition-colors">
              Privacy
            </Link>
            <span className="text-[#D1D5CB]">|</span>
            <Link to="/privacy" className="hover:text-[#171918] transition-colors">
              Terms
            </Link>
            <span className="text-[#D1D5CB]">|</span>
            <Link to="/privacy" className="hover:text-[#171918] transition-colors">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
