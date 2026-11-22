import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronDown, LayoutDashboard, MapPin, Users, Activity, Layers, ShieldCheck, LogOut } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, signOut, role } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setPlatformDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPlatformDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLandingPage = location.pathname === '/';

  // Platform modules dropdown items
  const platformItems = [
    { label: 'My Civic Space (Dashboard)', to: '/dashboard', icon: LayoutDashboard, desc: 'Citizen issue tracker & timeline' },
    { label: 'Explore Incident Map', to: '/explore', icon: MapPin, desc: 'Citywide geo-located report map' },
    { label: 'Community Hub & Validation', to: '/community', icon: Users, desc: 'Corroboration & worsening votes' },
    { label: 'Civic Intelligence Hotspots', to: '/insights', icon: Activity, desc: 'Pattern detection & early warning' },
    { label: 'Civic Digital Twin Engine', to: '/digital-twin', icon: Layers, desc: 'Spatial simulations & cascade analysis' },
    { label: 'Public Transparency Portal', to: '/transparency', icon: ShieldCheck, desc: 'Operations audit ledger & SLA scores' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full max-w-full overflow-x-hidden transition-all duration-300 ${
        scrolled
          ? 'bg-[#F5F5F2]/95 backdrop-blur-md border-b border-[#E4E6E2] shadow-[0_2px_12px_rgba(23,25,24,0.03)]'
          : 'bg-[#F5F5F2] border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-18 sm:h-20 min-w-0">
          {/* Left: CivicEye Logo & Wordmark */}
          <div className="flex items-center flex-shrink-0">
            <Logo size="md" linkToHome={!isLandingPage} />
          </div>

          {/* Center Navigation Links (Reference: Platform v | How It Works | Intelligence | Transparency) */}
          <nav className="hidden lg:flex items-center gap-6 lg:gap-8" aria-label="Main Navigation">
            {/* Platform Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  platformDropdownOpen ? 'text-[#171918]' : 'text-[#171918]/80 hover:text-[#171918]'
                }`}
                aria-expanded={platformDropdownOpen}
              >
                <span>Platform</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${platformDropdownOpen ? 'rotate-180 text-[#315C4C]' : 'text-[#737773]'}`} />
              </button>

              {platformDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 rounded-2xl bg-white border border-[#E4E6E2] shadow-[0_12px_36px_rgba(23,25,24,0.08)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-[#737773] border-b border-[#E4E6E2]/60">
                    CivicEye Platform Modules
                  </div>
                  <div className="py-1">
                    {platformItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setPlatformDropdownOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F5F5F2] transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-[#DDE7DF]/50 group-hover:bg-[#DDE7DF] text-[#315C4C] transition-colors mt-0.5">
                          <item.icon size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#171918] group-hover:text-[#315C4C] transition-colors">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#737773] line-clamp-1">
                            {item.desc}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* How It Works */}
            <Link
              to="/how-it-works"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/how-it-works'
                  ? 'text-[#315C4C] font-semibold'
                  : 'text-[#171918]/80 hover:text-[#171918]'
              }`}
            >
              How It Works
            </Link>

            {/* Intelligence */}
            <Link
              to="/insights"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/insights'
                  ? 'text-[#315C4C] font-semibold'
                  : 'text-[#171918]/80 hover:text-[#171918]'
              }`}
            >
              Intelligence
            </Link>

            {/* Transparency */}
            <Link
              to="/transparency"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/transparency'
                  ? 'text-[#315C4C] font-semibold'
                  : 'text-[#171918]/80 hover:text-[#171918]'
              }`}
            >
              Transparency
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8EAE5] border border-[#E4E6E2] text-xs font-semibold text-[#171918]">
                  <span className="w-2 h-2 rounded-full bg-[#315C4C]" />
                  <span className="truncate max-w-[120px]">{user?.user_metadata?.full_name || user?.email}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#315C4C] text-white uppercase">
                    {role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate('/signin');
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#B8463B] bg-white hover:bg-[#FCE8E6] border border-[#B8463B]/30 rounded-full transition-all flex items-center gap-1"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                className="px-5 py-2 text-sm font-medium text-[#171918] bg-white hover:bg-[#F7F7F5] border border-[#E4E6E2] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-[#D1D5CB]"
              >
                Sign In
              </Link>
            )}

            <Link
              to={role === 'authority' || role === 'admin' ? '/admin' : '/dashboard'}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#315C4C] hover:bg-[#26483B] rounded-full shadow-[0_2px_8px_rgba(49,92,76,0.2)] transition-all hover:shadow-[0_4px_12px_rgba(49,92,76,0.3)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{role === 'authority' || role === 'admin' ? 'Dispatch Desk' : 'Explore CivicEye'}</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#315C4C] rounded-full shadow-sm"
            >
              Explore &rarr;
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#171918] hover:bg-[#E4E6E2]/50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E4E6E2] bg-[#F5F5F2] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200 max-w-full overflow-hidden">
          <div className="flex flex-col space-y-1">
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/how-it-works'
                  ? 'bg-white text-[#315C4C] font-semibold'
                  : 'text-[#171918] hover:bg-white'
              }`}
            >
              How It Works
            </Link>
            <Link
              to="/insights"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/insights'
                  ? 'bg-white text-[#315C4C] font-semibold'
                  : 'text-[#171918] hover:bg-white'
              }`}
            >
              Intelligence
            </Link>
            <Link
              to="/transparency"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/transparency'
                  ? 'bg-white text-[#315C4C] font-semibold'
                  : 'text-[#171918] hover:bg-white'
              }`}
            >
              Transparency
            </Link>
            <Link
              to="/digital-twin"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === '/digital-twin'
                  ? 'bg-white text-[#315C4C] font-semibold'
                  : 'text-[#171918] hover:bg-white'
              }`}
            >
              Digital Twin
            </Link>
          </div>

          {/* Platform Pages */}
          <div className="pt-2 border-t border-[#E4E6E2]/70 space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#737773]">
              Platform Views
            </div>
            {platformItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#171918] rounded-lg hover:bg-white transition-colors"
              >
                <item.icon size={15} className="text-[#315C4C]" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-3 border-t border-[#E4E6E2]/70 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#E8EAE5] text-xs">
                  <span className="font-semibold text-[#171918]">{user?.email}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#315C4C] text-white uppercase">{role}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setMobileMenuOpen(false);
                    navigate('/signin');
                  }}
                  className="w-full text-center py-2.5 text-sm font-medium text-[#B8463B] bg-white border border-[#B8463B]/30 rounded-full shadow-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium text-[#171918] bg-white border border-[#E4E6E2] rounded-full shadow-sm"
              >
                Sign In
              </Link>
            )}
            <Link
              to={role === 'authority' || role === 'admin' ? '/admin' : '/dashboard'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#315C4C] rounded-full shadow-sm"
            >
              <span>{role === 'authority' || role === 'admin' ? 'Dispatch Desk' : 'Explore CivicEye'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
