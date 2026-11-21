import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';

export const DataPrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="pb-6 border-b border-[#E4E6E2]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#315C4C] font-semibold mb-1">
            <ShieldCheck size={14} />
            <span>MUNICIPAL TRANSPARENCY & CITIZEN PRIVACY CHARTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918]">
            CivicEye Data Privacy & Open Governance
          </h1>
          <p className="text-xs text-[#737773] mt-1 max-w-2xl leading-relaxed">
            How we protect citizen location confidentiality, enforce differential privacy, and ensure civic issue reporting remains transparent without compromising personal privacy.
          </p>
        </div>

        {/* 4 Pillars of CivicEye Privacy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pillar 1 */}
          <div className="p-6 rounded-xl bg-white border border-[#E4E6E2] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#DDE7DF] text-[#315C4C] flex items-center justify-center">
              <EyeOff size={18} />
            </div>
            <h3 className="text-sm font-bold text-[#171918]">
              Differential Privacy & Location Masking
            </h3>
            <p className="text-xs text-[#737773] leading-relaxed">
              Public maps and civic dashboards apply geometric coordinate jitter (±30–50 meter noise) to reports near private residential homes, preventing household tracking while giving road engineers precise repair locations.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-xl bg-white border border-[#E4E6E2] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#FAF5ED] text-[#C58B36] flex items-center justify-center">
              <Lock size={18} />
            </div>
            <h3 className="text-sm font-bold text-[#171918]">
              Zero Commercial Monetization Pledge
            </h3>
            <p className="text-xs text-[#737773] leading-relaxed">
              CivicEye will never sell, license, or monetize citizen reporting activity, location logs, or behavioral profiles to third-party advertisers or commercial brokers. Data exists solely for public infrastructure repair.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-xl bg-white border border-[#E4E6E2] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F5F2] text-[#171918] flex items-center justify-center">
              <Database size={18} />
            </div>
            <h3 className="text-sm font-bold text-[#171918]">
              Open311 & Open Data Standards
            </h3>
            <p className="text-xs text-[#737773] leading-relaxed">
              All non-sensitive civic issue records conform to international Open311 and GeoJSON interoperability schemas, allowing municipal agencies and open-source civic researchers to audit municipal SLA delivery times.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-xl bg-white border border-[#E4E6E2] shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#DDE7DF]/50 text-[#315C4C] flex items-center justify-center">
              <FileCheck2 size={18} />
            </div>
            <h3 className="text-sm font-bold text-[#171918]">
              Right to Anonymity & Erasure
            </h3>
            <p className="text-xs text-[#737773] leading-relaxed">
              Citizens can lodge reports with pseudonymized handles or anonymous mode. You hold full rights to request complete removal of uploaded media attachments once municipal verification concludes.
            </p>
          </div>
        </div>

        {/* Detailed Policy Text */}
        <div className="bg-white border border-[#E4E6E2] rounded-xl p-6 sm:p-8 shadow-xs space-y-6 text-xs text-[#737773] leading-relaxed">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#171918]">
              1. Photographic Evidence Metadata Stripping
            </h4>
            <p>
              When an image is submitted via the reporting flow, EXIF metadata containing device serial numbers, camera sensor IDs, and owner identifiers are scrubbed client-side before storage. Only verified spatial GPS coordinates and timestamp data are retained for work order validation.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#171918]">
              2. Municipal Employee Attribution & Auditability
            </h4>
            <p>
              To eliminate phantom closures and fake completion certifications, municipal officers who update reports from "In Progress" to "Resolved" must sign off with their verified GHMC badge number and geotagged field photos.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-[#171918]">
              3. Cloud Persistence & Encryption in Transit
            </h4>
            <p>
              All interactions with our Supabase PostgreSQL data layer and local storage caches utilize TLS 1.3 transport encryption. Row Level Security (RLS) ensures unprivileged API clients cannot manipulate resolution timestamps or falsify community confirmation tallies.
            </p>
          </div>
        </div>

        {/* Action Link Footer */}
        <div className="p-5 rounded-xl bg-white border border-[#E4E6E2] flex items-center justify-between text-xs">
          <span className="font-mono text-[#737773]">CIVICEYE GOVERNANCE VERSION 2026.11</span>
          <Link
            to="/report"
            className="px-4 py-2 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Proceed to Report an Issue</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};
