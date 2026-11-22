import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IssueCategory,
  IssueSeverity,
  HyderabadNeighborhood,
  DashboardReport,
} from '../types';
import { reportService, SimilarityCandidate } from '../services/reportService';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getAllIndianStates,
  getPlacesForState,
  findNearestPlaceInIndia,
  reverseGeocodeLocation,
  IndiaPlace,
} from '../config/indiaLocations';
import {
  MapPin,
  AlertTriangle,
  Upload,
  X,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface CategoryOption {
  category: IssueCategory;
  label: string;
  defaultTitle: string;
  placeholder: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    category: 'Road damage',
    label: 'Pothole / Road Damage',
    defaultTitle: 'Asphalt crater / road depression',
    placeholder: 'Describe the pothole size, depth, and whether it obstructs vehicles or cyclists...',
  },
  {
    category: 'Garbage',
    label: 'Garbage / Waste',
    defaultTitle: 'Uncollected solid waste overspill',
    placeholder: 'Describe the location of overflowing bins, litter spread, or animal scavenging...',
  },
  {
    category: 'Water leakage',
    label: 'Water Leakage',
    defaultTitle: 'Potable water pipeline leakage',
    placeholder: 'Describe the water pressure, pipe burst point, and if clean drinking water is being lost...',
  },
  {
    category: 'Drainage',
    label: 'Drainage / Sewage',
    defaultTitle: 'Choked storm drain / sewage overflow',
    placeholder: 'Describe stagnation depth, odor, and whether water is entering pedestrian areas...',
  },
  {
    category: 'Streetlights',
    label: 'Streetlight Inactive',
    defaultTitle: 'Dark street corridor / inactive fixture',
    placeholder: 'State the pole numbers, stretch length, and night-time pedestrian safety impact...',
  },
  {
    category: 'Electrical Hazard',
    label: 'Electrical Hazard',
    defaultTitle: 'Exposed wiring / damaged transformer box',
    placeholder: 'Describe any hanging low-tension wires, sparking transformers, or open junction boxes...',
  },
  {
    category: 'Damaged footpaths',
    label: 'Damaged Footpaths',
    defaultTitle: 'Broken pavement pavers / missing slab',
    placeholder: 'Describe displaced curb pavers, tripping hazards, or missing utility chamber slabs...',
  },
  {
    category: 'Fallen Tree',
    label: 'Fallen Tree / Branch',
    defaultTitle: 'Fallen tree blocking carriage road',
    placeholder: 'Describe the fallen tree or heavy branch blocking vehicular or pedestrian lanes...',
  },
  {
    category: 'Public Safety',
    label: 'Public Safety',
    defaultTitle: 'Hazardous public corridor obstruction',
    placeholder: 'Describe the immediate physical risk to citizens, unbarricaded construction pits, etc...',
  },
  {
    category: 'Accessibility',
    label: 'Accessibility Defect',
    defaultTitle: 'Obstructed wheelchair ramp / tactile pathway',
    placeholder: 'Describe blocked curb ramps, missing tactile paving, or inaccessible civic infrastructure...',
  },
  {
    category: 'Other',
    label: 'Other Civic Defect',
    defaultTitle: 'Unclassified civic infrastructure issue',
    placeholder: 'Detail the civic problem and its impact on the surrounding neighborhood...',
  },
];

const SEVERITIES: {
  level: IssueSeverity;
  label: string;
  badgeColor: string;
  description: string;
}[] = [
  {
    level: 'low',
    label: 'Low',
    badgeColor: 'bg-[#F5F5F2] text-[#737773] border-[#E4E6E2]',
    description: 'Minor cosmetic flaw or localized nuisance. No safety hazard to traffic or pedestrians.',
  },
  {
    level: 'medium',
    label: 'Moderate',
    badgeColor: 'bg-[#DDE7DF]/60 text-[#315C4C] border-[#315C4C]/20',
    description: 'Noticeable inconvenience, slows down neighborhood transit or causes minor sanitation issue.',
  },
  {
    level: 'high',
    label: 'High',
    badgeColor: 'bg-[#FAF5ED] text-[#C58B36] border-[#C58B36]/30',
    description: 'Significant disruption. Direct collision risk, property damage, or foul sanitation overflow.',
  },
  {
    level: 'critical',
    label: 'Critical',
    badgeColor: 'bg-[#FAF0EF] text-[#B8463B] border-[#B8463B]/30',
    description: 'Immediate severe danger. Live exposed wires, deep sinkhole, or structural collapse risk.',
  },
];

const HYDERABAD_LANDMARKS = [
  {
    neighborhood: 'Jubilee Hills' as HyderabadNeighborhood,
    label: 'Road No. 36, Near Peddamma Temple Metro',
    lat: 17.4325,
    lng: 78.4071,
    mapX: 42,
    mapY: 38,
  },
  {
    neighborhood: 'Jubilee Hills' as HyderabadNeighborhood,
    label: 'Road No. 45 Junction, Near Durgam Cheruvu Cable Bridge',
    lat: 17.4378,
    lng: 78.3965,
    mapX: 35,
    mapY: 34,
  },
  {
    neighborhood: 'Banjara Hills' as HyderabadNeighborhood,
    label: 'Road No. 12, Ministers Quarters Enclosure',
    lat: 17.4156,
    lng: 78.4352,
    mapX: 58,
    mapY: 52,
  },
  {
    neighborhood: 'Madhapur' as HyderabadNeighborhood,
    label: '100ft Road, Cyber Towers Intersection, Madhapur',
    lat: 17.4504,
    lng: 78.3808,
    mapX: 25,
    mapY: 26,
  },
  {
    neighborhood: 'Gachibowli' as HyderabadNeighborhood,
    label: 'ORR Slip Road adjacent to Gachibowli Stadium',
    lat: 17.4435,
    lng: 78.3489,
    mapX: 18,
    mapY: 65,
  },
];

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>('Road damage');
  const [title, setTitle] = useState('Asphalt crater / road depression');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [selectedState, setSelectedState] = useState<string>('Telangana');
  const [availablePlaces, setAvailablePlaces] = useState<IndiaPlace[]>(() => getPlacesForState('Telangana'));
  const [neighborhood, setNeighborhood] = useState<HyderabadNeighborhood>('Hyderabad - Jubilee Hills');
  const [locationText, setLocationText] = useState('Road No. 36, Near Peddamma Temple Metro, Jubilee Hills, Hyderabad');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 17.4325,
    lng: 78.4071,
  });
  const [markerPercent, setMarkerPercent] = useState<{ x: number; y: number }>({ x: 42, y: 38 });

  // Photo uploads
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
  ]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // GPS & Location Status
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Similarity & Duplicate check
  const [similarityWarnings, setSimilarityWarnings] = useState<SimilarityCandidate[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<DashboardReport | null>(null);

  // Auto-suggest title when category changes if user hasn't heavily customized it
  const handleCategorySelect = (cat: IssueCategory) => {
    setSelectedCategory(cat);
    const catObj = CATEGORIES.find((c) => c.category === cat);
    if (catObj) {
      setTitle(catObj.defaultTitle);
    }
  };

  // Re-check similarity warnings when category, location, or coordinates change
  useEffect(() => {
    if (locationText.trim().length > 3) {
      const candidates = reportService.checkSimilarity(
        selectedCategory,
        locationText,
        coordinates.lat,
        coordinates.lng
      );
      setSimilarityWarnings(candidates);
    } else {
      setSimilarityWarnings([]);
    }
  }, [selectedCategory, locationText, coordinates]);

  // State selection change handler - automatically updates all places in that state
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const places = getPlacesForState(stateName);
    setAvailablePlaces(places);
    if (places.length > 0) {
      const first = places[0];
      setNeighborhood(first.name);
      setLocationText(`${first.name}, ${stateName}`);
      setCoordinates({ lat: first.lat, lng: first.lng });
      setGpsMessage(`✓ Showing ${places.length} places and districts in ${stateName}.`);
    }
  };

  // Place selection change handler - updates coordinates & location
  const handlePlaceChange = (placeName: string) => {
    setNeighborhood(placeName);
    const place = availablePlaces.find((p) => p.name === placeName);
    if (place) {
      setCoordinates({ lat: place.lat, lng: place.lng });
      setLocationText(`${place.name}, ${selectedState}`);
      setGpsMessage(`Location pinned: ${place.name}, ${selectedState}`);
    }
  };

  // Request GPS Location with India-wide auto-detection
  const handleRequestGPS = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Geolocation is not supported by your browser. Please select your State and Place manually.');
      return;
    }

    setGpsLoading(true);
    setGpsMessage('Locating device via GPS satellites & cellular networks across India...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));
        setCoordinates({ lat, lng });

        // Map into 2D SVG canvas percentages
        const xPercent = Math.min(85, Math.max(15, 50 + (lng - 78.4) * 20));
        const yPercent = Math.min(85, Math.max(15, 50 - (lat - 17.43) * 20));
        setMarkerPercent({ x: Math.round(xPercent), y: Math.round(yPercent) });

        try {
          const geo = await reverseGeocodeLocation(lat, lng);
          setGpsLoading(false);
          setSelectedState(geo.state);
          const places = getPlacesForState(geo.state);
          setAvailablePlaces(places);

          // Find closest matching place
          const matched = places.find(
            (p) =>
              p.name.toLowerCase().includes(geo.city.toLowerCase()) ||
              geo.city.toLowerCase().includes(p.name.toLowerCase())
          );
          const placeToSet = matched ? matched.name : (places[0]?.name || geo.city || 'Central District');
          setNeighborhood(placeToSet);
          setLocationText(geo.fullAddress || `${geo.locality}, ${geo.city}, ${geo.state}`);
          setGpsMessage(
            `✓ Location Auto-Detected: ${geo.locality || geo.city}, ${geo.state} (${lat}°N, ${lng}°E · ±${Math.round(position.coords.accuracy)}m)`
          );
        } catch (_e) {
          setGpsLoading(false);
          const nearest = findNearestPlaceInIndia(lat, lng);
          setSelectedState(nearest.state.name);
          setAvailablePlaces(nearest.state.places);
          setNeighborhood(nearest.place.name);
          setLocationText(`${nearest.place.name}, ${nearest.state.name}`);
          setGpsMessage(`✓ GPS locked: Near ${nearest.place.name}, ${nearest.state.name} (${lat}°N, ${lng}°E)`);
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsMessage('GPS permission denied. You can select your State and Place from the dropdowns below.');
        } else {
          setGpsMessage('Unable to retrieve GPS signal. Please select your State and Place below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Photo file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagePreviews.length + files.length > 3) {
      setUploadError('Maximum 3 photos allowed per civic report.');
      return;
    }

    const newFiles: File[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError(`File "${file.name}" is not a valid image format.`);
        return;
      }
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 5MB file size limit.`);
        return;
      }

      newFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreviews((prev) => [...prev, reader.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...newFiles].slice(0, 3));
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Select Landmark Preset on Map
  const handleSelectLandmark = (item: (typeof HYDERABAD_LANDMARKS)[0]) => {
    setNeighborhood(item.neighborhood);
    setLocationText(item.label);
    setCoordinates({ lat: item.lat, lng: item.lng });
    setMarkerPercent({ x: item.mapX, y: item.mapY });
  };

  // Handle Map Click to place marker
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setMarkerPercent({ x, y });

    // Derive approximate Hyderabad lat/lng from map click
    const approxLat = parseFloat((17.4325 + (50 - y) * 0.0008).toFixed(4));
    const approxLng = parseFloat((78.4071 + (x - 50) * 0.0012).toFixed(4));
    setCoordinates({ lat: approxLat, lng: approxLng });
    setGpsMessage(`Map pin placed: ${approxLat}°N, ${approxLng}°E`);
  };

  // Form Validation
  const isFormValid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    locationText.trim().length >= 3 &&
    !isSubmitting;

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await reportService.createReport({
        title,
        description,
        category: selectedCategory,
        severity,
        locationText,
        neighborhood,
        state: selectedState,
        city: neighborhood,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        imageFiles,
        imagePreviews,
      });

      if (result.success) {
        setSubmittedReport(result.report);
      } else {
        setSubmitError(result.error || 'Failed to submit report. Please check your network connection.');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred while saving your report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedReport) {
    return (
      <div className="min-h-screen bg-[#F5F5F2] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white border border-[#E4E6E2] rounded-2xl p-6 sm:p-10 shadow-sm text-center">
            {/* Top Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-[#DDE7DF] text-[#315C4C] mx-auto flex items-center justify-center mb-5 ring-8 ring-[#DDE7DF]/40">
              <CheckCircle2 size={36} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#DDE7DF]/60 text-[#315C4C] border border-[#315C4C]/20 mb-3">
              <span>STATUS: SUBMITTED</span>
              <span>•</span>
              <span>STAGE 01 RECORDED</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918] mb-2">
              Civic Report Successfully Lodged
            </h1>
            <p className="text-sm text-[#737773] max-w-md mx-auto leading-relaxed mb-6">
              Your observation has been indexed into the municipal civic registry. Ward residents can now validate the condition on site.
            </p>

            {/* Ticket Summary Box */}
            <div className="p-5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] text-left mb-6 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
                <span className="font-mono text-[#737773] uppercase text-[10px]">Official Ticket Number</span>
                <span className="font-mono font-bold text-sm text-[#315C4C]">{submittedReport.ticketNumber}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-mono text-[#737773] uppercase text-[10px] block">Category</span>
                  <span className="font-semibold text-[#171918]">{submittedReport.category}</span>
                </div>
                <div>
                  <span className="font-mono text-[#737773] uppercase text-[10px] block">Citizen Severity</span>
                  <span className="font-semibold text-[#171918] capitalize">{submittedReport.severity} Priority</span>
                </div>
                <div>
                  <span className="font-mono text-[#737773] uppercase text-[10px] block">Location</span>
                  <span className="font-medium text-[#171918] truncate block">{submittedReport.location}</span>
                </div>
                <div>
                  <span className="font-mono text-[#737773] uppercase text-[10px] block">Persistence</span>
                  <span className="font-mono text-[11px] text-[#315C4C]">
                    {submittedReport.isRemotePersisted ? '✓ Synced to Supabase Cloud' : '✓ Saved Locally (Demo Mode)'}
                  </span>
                </div>
              </div>

              {submittedReport.images && submittedReport.images.length > 0 && (
                <div className="pt-2 border-t border-[#E4E6E2]">
                  <span className="font-mono text-[#737773] uppercase text-[10px] block mb-1.5">Attached Field Evidence</span>
                  <div className="flex gap-2">
                    {submittedReport.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Submitted evidence"
                        className="w-12 h-12 rounded object-cover border border-[#E4E6E2]"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>View in My Civic Space</span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmittedReport(null);
                  setDescription('');
                  setImagePreviews([]);
                  setImageFiles([]);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-[#E4E6E2] text-[#171918] text-xs font-medium hover:bg-[#F5F5F2] flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} className="text-[#737773]" />
                <span>Submit Another Report</span>
              </button>

              <Link
                to="/explore"
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white border border-[#E4E6E2] text-[#737773] hover:text-[#171918] text-xs font-medium hover:bg-[#F5F5F2] flex items-center justify-center gap-1 transition-colors"
              >
                <span>View on Civic Map</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCatObj = CATEGORIES.find((c) => c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Breadcrumbs & Title */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#737773]">
              <Link to="/" className="hover:text-[#171918] transition-colors">CivicEye</Link>
              <span>/</span>
              <Link to="/dashboard" className="hover:text-[#171918] transition-colors">Dashboard</Link>
              <span>/</span>
              <span className="text-[#315C4C] font-semibold">Report Issue</span>
            </div>

            {/* Supabase status badge */}
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-mono border ${
                isSupabaseConfigured
                  ? 'bg-[#DDE7DF]/70 text-[#315C4C] border-[#315C4C]/30'
                  : 'bg-[#F5F5F2] text-[#737773] border-[#E4E6E2]'
              }`}
            >
              {isSupabaseConfigured ? '● SUPABASE CONNECTED' : 'DEMO MODE (LOCAL PERSISTENCE)'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918]">
            Report a Civic Hazard or Infrastructure Defect
          </h1>
          <p className="text-sm text-[#737773] mt-1 max-w-2xl leading-relaxed">
            Submit photographic evidence and exact coordinates directly into the Hyderabad municipal civic registry.
          </p>
        </div>

        {/* Main Reporting Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: ISSUE CATEGORY */}
          <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E6E2]">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#315C4C] font-semibold block">Step 01</span>
                <h3 className="text-base font-bold text-[#171918]">Select Issue Category</h3>
              </div>
              <span className="text-xs font-mono text-[#737773]">Required</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => handleCategorySelect(cat.category)}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                      isSelected
                        ? 'bg-[#315C4C] text-white border-[#315C4C] shadow-xs'
                        : 'bg-[#F5F5F2]/50 hover:bg-white text-[#171918] border-[#E4E6E2]'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-snug">{cat.label}</span>
                    <span
                      className={`text-[10px] font-mono mt-1 ${
                        isSelected ? 'text-[#DDE7DF]' : 'text-[#737773]'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Choose'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: TITLE & OBSERVATION DESCRIPTION */}
          <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#315C4C] font-semibold block">Step 02</span>
                <h3 className="text-base font-bold text-[#171918]">Issue Title & Observation Details</h3>
              </div>
              <span className="text-xs font-mono text-[#737773]">Required</span>
            </div>

            {/* Title Input with Suggestion tag */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="issue-title" className="text-xs font-semibold text-[#171918]">
                  Issue Title
                </label>
                <span className="text-[10px] font-mono text-[#737773]">Auto-suggested from category (editable)</span>
              </div>
              <input
                id="issue-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief headline describing the condition..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E4E6E2] bg-white text-sm text-[#171918] focus:border-[#315C4C] focus:ring-1 focus:ring-[#315C4C] outline-none transition-colors"
                required
              />
            </div>

            {/* Detailed Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="issue-description" className="text-xs font-semibold text-[#171918]">
                  Citizen Description
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    description.length >= 10 ? 'text-[#315C4C]' : 'text-[#737773]'
                  }`}
                >
                  {description.length} characters (min 10)
                </span>
              </div>
              <textarea
                id="issue-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={currentCatObj?.placeholder || 'Describe what you observed, depth/dimensions, and pedestrian safety impacts...'}
                className="w-full p-3.5 rounded-lg border border-[#E4E6E2] bg-white text-sm text-[#171918] focus:border-[#315C4C] focus:ring-1 focus:ring-[#315C4C] outline-none transition-colors"
                required
              />
              {description.length > 0 && description.length < 10 && (
                <p className="text-[11px] text-[#B8463B] mt-1">
                  Please provide at least 10 characters so municipal field engineers can understand the issue.
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: CITIZEN SEVERITY ASSESSMENT */}
          <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E4E6E2]">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#315C4C] font-semibold block">Step 03</span>
                <h3 className="text-base font-bold text-[#171918]">Citizen Severity Assessment</h3>
              </div>
              <span className="text-xs font-mono text-[#737773]">Citizen Reported</span>
            </div>

            <p className="text-xs text-[#737773] mb-4">
              Indicate how severe the condition appeared to you. Civic authorities will calibrate priority alongside community consensus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SEVERITIES.map((sev) => {
                const isSelected = severity === sev.level;
                return (
                  <button
                    key={sev.level}
                    type="button"
                    onClick={() => setSeverity(sev.level)}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-[#315C4C] ring-2 ring-[#315C4C]/20 bg-white shadow-xs'
                        : 'border-[#E4E6E2] bg-[#F5F5F2]/40 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${sev.badgeColor}`}>
                        {sev.label}
                      </span>
                      {isSelected && <span className="text-xs text-[#315C4C] font-bold">✓</span>}
                    </div>
                    <p className="text-[11px] text-[#737773] leading-relaxed">{sev.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: PHOTO EVIDENCE */}
          <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#315C4C] font-semibold block">Step 04</span>
                <h3 className="text-base font-bold text-[#171918]">Visual Photo Evidence</h3>
              </div>
              <span className="text-xs font-mono text-[#737773]">Max 3 Photos • Up to 5MB</span>
            </div>

            <p className="text-xs text-[#737773]">
              Photographs verify physical damage on site and prevent delayed inspections. Supported formats: JPG, PNG, WebP.
            </p>

            {uploadError && (
              <div className="p-3 rounded-lg bg-[#FAF0EF] border border-[#B8463B]/30 text-xs text-[#B8463B] flex items-center justify-between">
                <span>{uploadError}</span>
                <button type="button" onClick={() => setUploadError(null)} className="p-0.5 hover:opacity-75">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Photo Previews Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {imagePreviews.map((previewUrl, idx) => (
                <div key={idx} className="relative aspect-video sm:aspect-square rounded-lg overflow-hidden border border-[#E4E6E2] group">
                  <img src={previewUrl} alt={`Evidence preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-[#B8463B] text-white transition-colors"
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                  <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/60 text-white">
                    Photo #{idx + 1}
                  </span>
                </div>
              ))}

              {/* Upload trigger slot */}
              {imagePreviews.length < 3 && (
                <label className="border-2 border-dashed border-[#E4E6E2] hover:border-[#315C4C] rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer bg-[#F5F5F2]/40 hover:bg-white transition-all aspect-video sm:aspect-square">
                  <Upload size={18} className="text-[#315C4C] mb-1.5" />
                  <span className="text-xs font-medium text-[#171918]">Add Photo</span>
                  <span className="text-[10px] text-[#737773] font-mono">Tap or drag</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick preset selector for fast demo testing */}
            <div className="pt-2 border-t border-[#E4E6E2]/70 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-mono text-[#737773]">Demo Photo Presets:</span>
              <button
                type="button"
                onClick={() =>
                  setImagePreviews([
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
                  ])
                }
                className="px-2.5 py-1 rounded bg-[#F5F5F2] hover:bg-[#E4E6E2] text-[#171918] text-[11px] transition-colors"
              >
                Pothole Evidence
              </button>
              <button
                type="button"
                onClick={() =>
                  setImagePreviews([
                    'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
                  ])
                }
                className="px-2.5 py-1 rounded bg-[#F5F5F2] hover:bg-[#E4E6E2] text-[#171918] text-[11px] transition-colors"
              >
                Water Leak Evidence
              </button>
              <button
                type="button"
                onClick={() =>
                  setImagePreviews([
                    'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80',
                  ])
                }
                className="px-2.5 py-1 rounded bg-[#F5F5F2] hover:bg-[#E4E6E2] text-[#171918] text-[11px] transition-colors"
              >
                Garbage Evidence
              </button>
            </div>
          </div>

          {/* SECTION 5: GEOTAG LOCATION & INTERACTIVE MAP SELECTION */}
          <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E6E2]">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#315C4C] font-semibold block">Step 05</span>
                <h3 className="text-base font-bold text-[#171918]">Location, State & Geographic Pin</h3>
              </div>
              <span className="text-xs font-mono text-[#737773]">India-Wide • Auto GPS or Select</span>
            </div>

            {/* GPS Trigger & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#F5F5F2] border border-[#E4E6E2]">
              <div className="flex items-start gap-2.5">
                <Navigation size={18} className="text-[#315C4C] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-[#171918] block">Auto-Detect Device Location (GPS)</span>
                  <span className="text-[11px] text-[#737773]">
                    Automatically identifies your State, District/City, and exact locality anywhere in India.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestGPS}
                disabled={gpsLoading}
                className="px-3.5 py-1.5 rounded-md bg-[#315C4C] hover:bg-[#26483B] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 flex-shrink-0"
              >
                <MapPin size={13} />
                <span>{gpsLoading ? 'Detecting Location...' : 'Auto-Detect My Location'}</span>
              </button>
            </div>

            {gpsMessage && (
              <p className="text-xs font-mono p-2.5 rounded bg-[#FAFBF9] border border-[#315C4C]/20 text-[#315C4C]">
                {gpsMessage}
              </p>
            )}

            {/* State & City / Place Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1">
                  1. Select State / Union Territory
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none font-medium"
                >
                  {getAllIndianStates().map((stateName) => (
                    <option key={stateName} value={stateName}>
                      {stateName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1">
                  2. Select City / Place in {selectedState} ({availablePlaces.length} places)
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => handlePlaceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none font-medium"
                >
                  {availablePlaces.map((place) => (
                    <option key={place.name} value={place.name}>
                      {place.name} {place.district ? `(${place.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Street Address or Landmark Details */}
            <div>
              <label className="text-xs font-semibold text-[#171918] block mb-1">
                3. Street Address / Locality / Landmark Details
              </label>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. Near Metro Station / Main Market Road / Cross Junction..."
                className="w-full px-3 py-2 rounded-lg border border-[#E4E6E2] bg-white text-xs text-[#171918] focus:border-[#315C4C] outline-none"
                required
              />
            </div>

            {/* Quick Place Presets for Current State */}
            <div>
              <span className="text-[11px] font-mono text-[#737773] block mb-2">
                Quick Places in {selectedState}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availablePlaces.slice(0, 10).map((place, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePlaceChange(place.name)}
                    className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                      neighborhood === place.name
                        ? 'bg-[#315C4C] text-white border-[#315C4C] font-semibold'
                        : 'border-[#E4E6E2] bg-white hover:bg-[#F5F5F2] hover:border-[#315C4C] text-[#171918]'
                    }`}
                  >
                    {place.name}
                  </button>
                ))}
              </div>

              {selectedState === 'Telangana' && (
                <div className="pt-2.5 mt-2.5 border-t border-[#E4E6E2]/60">
                  <span className="text-[10px] font-mono text-[#737773] block mb-1.5 uppercase">
                    Hyderabad Ward Landmarks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {HYDERABAD_LANDMARKS.map((landmark, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectLandmark(landmark)}
                        className="px-2 py-0.5 rounded text-[11px] border border-[#E4E6E2] bg-white hover:bg-[#F5F5F2] hover:border-[#315C4C] transition-colors text-[#171918]"
                      >
                        {landmark.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Vector Map Canvas for Location Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-semibold text-[#171918] flex items-center gap-1">
                  <span>Geographic Location Canvas</span>
                  <span className="text-[10px] font-mono text-[#737773]">(Click anywhere to place pin)</span>
                </span>
                <span className="font-mono text-[11px] text-[#315C4C]">
                  {coordinates.lat}°N, {coordinates.lng}°E
                </span>
              </div>

              <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] rounded-lg border border-[#E4E6E2] overflow-hidden bg-[#F5F5F2] select-none">
                <svg
                  className="w-full h-full cursor-crosshair"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onClick={handleMapClick}
                >
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="picker-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E4E6E2" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="#F5F5F2" />
                  <rect width="100" height="100" fill="url(#picker-grid)" />

                  {/* Urban Blocks */}
                  <rect x="10" y="15" width="22" height="28" rx="1" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.5" />
                  <rect x="36" y="12" width="25" height="32" rx="1" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.5" />
                  <rect x="66" y="15" width="25" height="32" rx="1" fill="#DDE7DF" fillOpacity="0.4" stroke="#315C4C" strokeWidth="0.3" />

                  <rect x="10" y="55" width="30" height="32" rx="1" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.5" />
                  <rect x="45" y="55" width="45" height="32" rx="1" fill="#FFFFFF" stroke="#E4E6E2" strokeWidth="0.5" />

                  {/* Road Arterials */}
                  <line x1="0" y1="48" x2="100" y2="48" stroke="#FFFFFF" strokeWidth="3" />
                  <line x1="0" y1="48" x2="100" y2="48" stroke="#E4E6E2" strokeWidth="0.5" />

                  <line x1="33" y1="0" x2="33" y2="100" stroke="#FFFFFF" strokeWidth="3" />
                  <line x1="33" y1="0" x2="33" y2="100" stroke="#E4E6E2" strokeWidth="0.5" />

                  <line x1="63" y1="0" x2="63" y2="100" stroke="#FFFFFF" strokeWidth="3" />
                  <line x1="63" y1="0" x2="63" y2="100" stroke="#E4E6E2" strokeWidth="0.5" />

                  {/* User Placed Pin */}
                  <g transform={`translate(${markerPercent.x}, ${markerPercent.y})`}>
                    <circle cx="0" cy="0" r="4" fill="#315C4C" fillOpacity="0.3" className="animate-ping" />
                    <circle cx="0" cy="0" r="2.5" fill="#315C4C" stroke="#FFFFFF" strokeWidth="0.8" />
                  </g>
                </svg>

                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 border border-[#E4E6E2] text-[10px] font-mono text-[#737773]">
                  CLICK GRID TO SET COORDINATES
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: DUPLICATE / SIMILARITY ADVISORY (Non-blocking) */}
          {similarityWarnings.length > 0 && (
            <div className="p-4 sm:p-5 rounded-xl border border-[#C58B36]/40 bg-[#FAF5ED] space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C58B36]">
                <AlertTriangle size={15} />
                <span>Possible Similar Report in this Ward</span>
              </div>
              <p className="text-xs text-[#737773] leading-relaxed">
                We found existing community hazard(s) that match your category and vicinity. If this is the same defect, you can confirm it instead of creating a duplicate ticket:
              </p>

              <div className="space-y-2">
                {similarityWarnings.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 rounded-lg bg-white border border-[#E4E6E2] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#171918] block">{cand.title}</span>
                      <span className="text-[11px] text-[#737773]">{cand.similarityReason} • {cand.confirmationsCount} confirmations</span>
                    </div>
                    <Link
                      to="/dashboard"
                      className="px-2.5 py-1 rounded bg-[#DDE7DF] text-[#315C4C] text-[11px] font-medium flex items-center gap-1 hover:bg-[#315C4C] hover:text-white transition-colors flex-shrink-0"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </Link>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-mono text-[#737773]">
                Note: This is a similarity suggestion and will not block your submission if your report is distinct.
              </p>
            </div>
          )}

          {/* Submission Failure Alert */}
          {submitError && (
            <div className="p-4 rounded-xl bg-[#FAF0EF] border border-[#B8463B]/30 text-xs text-[#B8463B] flex items-center gap-2">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* SECTION 7: SUBMISSION ACTION BAR */}
          <div className="bg-white border border-[#E4E6E2] rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#171918]">Ready to Lodge Report</div>
              <div className="text-[11px] text-[#737773]">
                {!isFormValid ? (
                  <span className="text-[#B8463B]">
                    Please complete: {title.length < 3 ? 'Title' : ''} {description.length < 10 ? 'Description (10+ chars)' : ''} {locationText.length < 3 ? 'Location' : ''}
                  </span>
                ) : (
                  <span>All required parameters validated. Will be logged in Submitted status.</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="px-4 py-2.5 rounded-lg border border-[#E4E6E2] hover:bg-[#F5F5F2] text-xs font-medium text-[#737773] hover:text-[#171918] transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Indexing Report...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Civic Report</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
