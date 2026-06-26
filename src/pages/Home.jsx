import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Zap,
  TrendingUp,
  Sliders,
  Cpu,
  Sun,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  ShieldCheck,
  Target,
  Eye,
  Info,
  Scale,
  Award,
  AlertTriangle,
  Flame,
  LayoutGrid,
  Table,
  X,
  ExternalLink,
  FileText,
  Sparkles,
  Send,
  Calculator
} from "lucide-react";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";
import { translations } from "../data/translations.js";

export function Home({ content, language = "en" }) {
  const { heroSlides, about, capabilities, transformers, materials, recentProjects = [] } = content;
  const t = translations[language] || translations.en;

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  // Transformers Matrix State
  const [transformerSearch, setTransformerSearch] = useState("");
  const [transformerCategoryFilter, setTransformerCategoryFilter] = useState("all");
  const [transformerFilter, setTransformerFilter] = useState("all");
  const [selectedHtModel, setSelectedHtModel] = useState("vcb-12");
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    setIsCatalogLoading(true);
    const timer = setTimeout(() => {
      setIsCatalogLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [transformerSearch, transformerCategoryFilter, transformerFilter]);

  const filteredTransformers = transformers.filter((t) => {
    const itemCategory = t.category || "Distribution Transformer";
    const capacityLower = t.capacity.toLowerCase();
    const categoryLower = itemCategory.toLowerCase();
    const searchLower = transformerSearch.toLowerCase();

    // Matches capacity name OR category
    const matchesSearch = capacityLower.includes(searchLower) || categoryLower.includes(searchLower);

    // Apply explicit category filter if selected
    const matchesCategoryFilter =
      transformerCategoryFilter === "all" ||
      categoryLower === transformerCategoryFilter.toLowerCase();

    if (!matchesSearch || !matchesCategoryFilter) return false;

    if (transformerFilter === "all") return true;
    
    // Parse capacity number for simple numerical filters if needed
    const val = parseInt(t.capacity);
    if (isNaN(val)) return true; // If non-numeric model name, keep it in "all" or specific category matches
    if (transformerFilter === "small") return val <= 500;
    if (transformerFilter === "large") return val > 500;
    return true;
  });

  // Solar Power Factor Estimator State
  const [activePower, setActivePower] = useState("400"); // kW
  const [apparentPower, setApparentPower] = useState("500"); // kVA
  const [calculatedPf, setCalculatedPf] = useState(0.8);
  const [pfWarning, setPfWarning] = useState("danger");
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const kw = parseFloat(activePower);
    const kva = parseFloat(apparentPower);

    if (isNaN(kw) || isNaN(kva) || kw <= 0 || kva <= 0) {
      setCalculatedPf(null);
      setValidationError("Please input positive numbers for active and apparent power.");
      return;
    }

    if (kw > kva) {
      setCalculatedPf(null);
      setValidationError("Active Power (kW) cannot exceed Apparent Power (kVA). In AC systems, kW is always ≤ kVA.");
      return;
    }

    setValidationError(null);
    const pf = parseFloat((kw / kva).toFixed(3));
    setCalculatedPf(pf);

    if (pf < 0.95) {
      setPfWarning("danger");
    } else if (pf < 0.98) {
      setPfWarning("warning");
    } else {
      setPfWarning("success");
    }
  }, [activePower, apparentPower]);

  // Map icon strings to Lucide icon components
  const getIcon = (iconName) => {
    switch (iconName) {
      case "Zap": return <Zap className="w-6 h-6 text-plt-green" />;
      case "TrendingUp": return <TrendingUp className="w-6 h-6 text-plt-purple" />;
      case "Sliders": return <Sliders className="w-6 h-6 text-plt-violet" />;
      case "Cpu": return <Cpu className="w-6 h-6 text-plt-green" />;
      case "Sun": return <Sun className="w-6 h-6 text-plt-skyblue" />;
      case "Wrench": return <Wrench className="w-6 h-6 text-plt-purple" />;
      default: return <Zap className="w-6 h-6 text-plt-purple" />;
    }
  };

  const getLocalizedHeroSlides = () => {
    if (language === "bn") {
      return heroSlides.map(slide => ({
        id: slide.id,
        title: slide.titleBn || slide.title,
        subtitle: slide.subtitleBn || slide.subtitle,
        bgImage: slide.bgImage
      }));
    }
    return heroSlides;
  };

  const getLocalizedAbout = () => {
    if (language === "bn") {
      return {
        mission: about.missionBn || about.mission,
        vision: about.visionBn || about.vision,
        qualityPolicy: about.qualityPolicyBn || about.qualityPolicy
      };
    }
    return about;
  };

  const getLocalizedCapabilities = () => {
    const list = capabilities || [];
    if (language === "bn") {
      return list.map(cap => ({
        id: cap.id,
        title: cap.titleBn || cap.title,
        description: cap.descriptionBn || cap.description,
        iconName: cap.iconName
      }));
    }
    return list;
  };

  const getHeading = (key, fallbackEn, fallbackBn) => {
    if (content && content.headings) {
      if (language === "bn") {
        const bnKey = `${key}Bn`;
        return content.headings[bnKey] || content.headings[key] || fallbackBn;
      }
      return content.headings[key] || fallbackEn;
    }
    return language === "bn" ? fallbackBn : fallbackEn;
  };

  const localizedHeroSlides = getLocalizedHeroSlides();
  const localizedAbout = getLocalizedAbout();
  const localizedCapabilities = getLocalizedCapabilities();

  return (
    <div id="home" className="space-y-24 pb-12 bg-white text-slate-800">
      
      {/* 1. HERO SLIDER */}
      <section className="relative h-[92vh] min-h-[540px] sm:min-h-[620px] w-full overflow-hidden bg-slate-50 border-b border-slate-200">
        
        {/* RIGHT SIDE / FULL BG SLIDING LAYER */}
        <div className="absolute inset-0 w-full h-full">
          {localizedHeroSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Mobile background image & overlay */}
              <div 
                className="absolute inset-0 lg:hidden"
                style={{
                  backgroundImage: `url(${slide.bgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-slate-950/20"></div>
              </div>

              {/* Desktop split right-side layout */}
              <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 h-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                
                {/* Brand-Injected Orbital Lines & Energy Bubble Details Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  <div className="absolute inset-0 bg-slate-950/15"></div>
                  
                  {/* Interactive Vector Core */}
                  <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* Concentric Green Orbital Lines with slow spin */}
                    <svg className="absolute w-full h-full animate-spin" style={{ animationDuration: "35s" }} viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="85" fill="none" stroke="#3B8E42" strokeWidth="1" strokeDasharray="5,10" className="opacity-80" />
                      <circle cx="100" cy="100" r="60" fill="none" stroke="#3B8E42" strokeWidth="1.5" strokeDasharray="15,5" className="opacity-60" />
                      <circle cx="100" cy="100" r="40" fill="none" stroke="#3B8E42" strokeWidth="0.8" className="opacity-40" />
                    </svg>

                    {/* Counter-rotating Green Orbital Lines */}
                    <svg className="absolute w-72 h-72 animate-spin" style={{ animationDuration: "20s", animationDirection: "reverse" }} viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="72" fill="none" stroke="#3B8E42" strokeWidth="1.2" strokeDasharray="30,10,5,10" className="opacity-70" />
                      <circle cx="100" cy="100" r="50" fill="none" stroke="#3B8E42" strokeWidth="0.5" strokeDasharray="2,2" className="opacity-55" />
                    </svg>

                    {/* Violet Energy Bubbles */}
                    <div className="absolute w-6 h-6 rounded-full bg-[#714B9D] opacity-85 blur-[2px] animate-pulse top-1/4 left-1/4 shadow-[0_0_15px_#714B9D]" style={{ animationDuration: "3s" }}></div>
                    <div className="absolute w-8 h-8 rounded-full bg-[#714B9D] opacity-75 blur-[4px] animate-pulse bottom-1/4 right-1/3 shadow-[0_0_20px_#714B9D]" style={{ animationDuration: "5s" }}></div>
                    
                    {/* Skyblue Accent Bubbles */}
                    <div className="absolute w-5 h-5 rounded-full bg-[#8ECDF5] opacity-90 blur-[1px] animate-ping top-1/3 right-1/4" style={{ animationDuration: "4s" }}></div>
                    <div className="absolute w-4 h-4 rounded-full bg-[#8ECDF5] opacity-85 blur-[2px] animate-pulse bottom-1/3 left-1/3 shadow-[0_0_12px_#8ECDF5]" style={{ animationDuration: "2.5s" }}></div>
                    
                    {/* Central Corporate Badge Fallback Container */}
                    <div className="absolute w-14 h-14 bg-white/95 border-2 border-[#4A3B80] rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                      <img
                        src="/logo.png"
                        alt="PLT Logo"
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const badge = document.createElement("div");
                            badge.className = "text-[#4A3B80] font-black font-display text-sm tracking-tighter";
                            badge.innerText = "EPLT";
                            parent.appendChild(badge);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* STATIC LEFT-SIDE CONTENT PANEL (Laying on top of slides) */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-1/2 h-full z-20 flex items-center bg-white/90 backdrop-blur-md lg:backdrop-blur-none lg:bg-white px-6 sm:px-12 lg:px-20 border-r border-transparent lg:border-slate-200">
          <div className="max-w-xl w-full space-y-6">
            
            {/* Badge */}
            <div>
              <Badge variant="purple" className="px-3 py-1 font-semibold shadow-sm">
                {language === "bn" ? "ইপিএলটি সাবস্টেশন সিস্টেমস" : "EPLT Substation Systems"}
              </Badge>
            </div>

            {/* Title & Subtitle transitions in a CSS grid stack to prevent overlapping contents and keep buttons consistent */}
            <div className="grid grid-cols-1 grid-rows-1">
              {localizedHeroSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`col-start-1 row-start-1 transition-all duration-700 ease-in-out flex flex-col justify-center w-full ${
                    idx === currentSlide 
                      ? "opacity-100 translate-y-0 pointer-events-auto z-10" 
                      : "opacity-0 -translate-y-4 pointer-events-none z-0"
                  }`}
                >
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-slate-900 tracking-tight leading-none mb-3 sm:mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-light font-sans">
                    {slide.subtitle}
                  </p>
                </div>
              ))}
            </div>

            {/* Consistent, static CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                variant="gold"
                size="lg"
                className="text-white font-semibold shadow-sm cursor-pointer"
                onClick={() => {
                  const contactEl = document.getElementById("contact");
                  if (contactEl) contactEl.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {language === "bn" ? "সাবস্টেশন কনসালটেশন বুক করুন" : "Book Substation Consultation"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
                onClick={() => {
                  const matrixEl = document.getElementById("tech-data");
                  if (matrixEl) matrixEl.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {language === "bn" ? "ট্রান্সফরমার স্পেসিফিকেশন দেখুন" : "View Transformer Specs"}
              </Button>
            </div>

          </div>
        </div>

        {/* Navigation Arrow Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/90 border border-slate-200 hover:bg-slate-100 hover:text-brand-gold text-slate-800 shadow-sm transition-colors cursor-pointer hidden md:block"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/90 border border-slate-200 hover:bg-slate-100 hover:text-brand-gold text-slate-800 shadow-sm transition-colors cursor-pointer hidden md:block"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Carousel Bottom Indicator Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
          {localizedHeroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-10 h-1.5 rounded transition-all duration-300 ${
                idx === currentSlide ? "bg-brand-gold" : "bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* 2. EXECUTIVE ABOUT & THREE-PHASE QUALITY MECHANISM */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Executive Corporate Copy */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-plt-purple font-mono text-xs font-bold tracking-widest uppercase block">
              {language === "bn" ? "কারিগরি কমপ্লায়েন্স" : "ENGINEERING COMPLIANCE"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight leading-tight">
              {language === "bn" ? "বিদ্যুৎ ব্যবস্থার নির্ভরযোগ্যতা এবং সুনিপুণ কারুকার্যের ঐতিহ্য" : "A Legacy of Power System Reliability & Craftsmanship"}
            </h2>
            <div className="h-1 w-20 bg-plt-green"></div>
            <p className="text-slate-600 leading-relaxed">
              {language === "bn" ? (
                <span>
                  <strong className="text-plt-green font-semibold">পাওয়ার লাইন টেক</strong> (<strong className="text-plt-purple font-semibold">EPLT</strong>) দীর্ঘ সময় ধরে বাংলাদেশের শিল্পকারখানার বিদ্যুৎ অবকাঠামো খাতে আস্থার সাথে কাজ করছে। আমরা অত্যন্ত দক্ষতার সাথে ১১ কেভি (11KV) সাবস্টেশন এবং নিয়ন্ত্রণ প্যানেল ডিজাইন, উৎপাদন ও পরীক্ষা করি, যা দেশের বৃহত্তম ম্যানুফ্যাকচারিং প্ল্যান্টগুলো পরিচালনা করছে।
                </span>
              ) : (
                <span>
                  <strong className="text-plt-green font-semibold">Power Line Tech</strong> (<strong className="text-plt-purple font-semibold">EPLT</strong>) has stood at the forefront of industrial power infrastructure. We engineering-design, fabricate, and test 11KV electrical substations and industrial control systems that run Bangladesh’s highest-capacity manufacturing plants.
                </span>
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-2">
                  <Target className="w-4 h-4 text-brand-gold" />
                  <span>{language === "bn" ? "আমাদের লক্ষ্য (Mission)" : "Our Mission"}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {localizedAbout.mission}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center space-x-2 text-slate-900 font-semibold mb-2">
                  <Eye className="w-4 h-4 text-brand-gold" />
                  <span>{language === "bn" ? "আমাদের ভিশন (Vision)" : "Our Vision"}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {localizedAbout.vision}
                </p>
              </div>
            </div>
          </div>

          {/* Premium Quality Panel card (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 p-6 sm:p-8 rounded-2xl relative shadow-sm">
            <div className="absolute top-4 right-4 text-brand-gold opacity-5">
              <ShieldCheck className="w-24 h-24 stroke-[1]" />
            </div>

            <div className="space-y-4 mb-6">
              <Badge variant="purple">
                {language === "bn" ? "ISO ৯০০১:২০১৫ প্রসেস স্ট্যান্ডার্ড" : "ISO 9001:2015 Process Standards"}
              </Badge>
              <h3 className="text-2xl font-display font-bold text-slate-900">
                {language === "bn" ? "৩-ধাপের মান নিয়ন্ত্রণ মেকানিজম" : "Three-Phase Quality Mechanism"}
              </h3>
              <p className="text-sm text-slate-600">
                {localizedAbout.qualityPolicy}
              </p>
            </div>

            <div className="space-y-4">
              {/* Mechanism Item 1 */}
              <div className="flex items-start space-x-3.5 p-4 bg-white hover:bg-slate-100/50 rounded border border-slate-200 transition-colors">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold font-mono font-bold text-sm shrink-0">
                  01
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                    {language === "bn" ? "কাঁচামাল মান নিয়ন্ত্রণ" : "Raw Material Quality Control"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {language === "bn" ? (
                      "উৎপাদনে পাঠানোর পূর্বে আমদানিকৃত কোল্ড-রোল্ড সিলিকন স্টিল শিট কোর (CRGO), খাঁটি তামা এবং সার্টিফাইড ইনসুলেশন সামগ্রীর শতভাগ কঠোর মান যাচাই।"
                    ) : (
                      "100% rigorous validation of imported cold-rolled grain-oriented (CRGO) silicon steel sheet cores, pure electrolytic copper, and certified electrical grade insulating materials before line discharge."
                    )}
                  </p>
                </div>
              </div>

              {/* Mechanism Item 2 */}
              <div className="flex items-start space-x-3.5 p-4 bg-white hover:bg-slate-100/50 rounded border border-slate-200 transition-colors">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold font-mono font-bold text-sm shrink-0">
                  02
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                    {language === "bn" ? "উৎপাদনকালীন মান পর্যবেক্ষণ" : "In-Process Quality Audits"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {language === "bn" ? (
                      "স্বয়ংক্রিয় কোর স্ট্যাকিং, উইন্ডিং টেনশন রেশিও, ভ্যাকুয়াম কয়েল ড্রাইং এবং ট্যাংক ওয়েল্ডিং সিলের ধারাবাহিক নিবিড় পর্যবেক্ষণ ও অডিট।"
                    ) : (
                      "Continuous line-testing during automatic core stacking, winding tension ratios, vacuum coil drying, tank fabrication welding seals, and automated painting thickness gauges."
                    )}
                  </p>
                </div>
              </div>

              {/* Mechanism Item 3 */}
              <div className="flex items-start space-x-3.5 p-4 bg-white hover:bg-slate-100/50 rounded border border-slate-200 transition-colors">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold font-mono font-bold text-sm shrink-0">
                  03
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                    {language === "bn" ? "চূড়ান্ত ডেলিভারি পূর্ববর্তী টেস্ট" : "Final Post-Production Quality Testing"}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {language === "bn" ? (
                      "উইন্ডিং রেজিস্ট্যান্স, ভোল্টেজ রেশিও, নো-লোড ও লোড লস এবং হাই-ভোল্টেজ ডাই-ইলেকট্রিক অয়েল ব্রেকডাউন ভোল্টেজ (BDV) সহ সকল প্রফেশনাল রুটিন ল্যাব টেস্ট সম্পাদন।"
                    ) : (
                      "Full functional diagnostic laboratory compliance. Routine tests include winding resistance, voltage ratio, vector group compliance, no-load & load losses measurement, and high-voltage dielectric insulation oil breakdown voltage (BDV) tests."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </motion.section>

      {/* 3. CAPABILITIES & SCOPE OF WORK GRID */}
      <motion.section
        id="scope"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-50 border-y border-slate-200 py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-brand-gold font-mono text-xs font-semibold uppercase tracking-widest block">
              {language === "bn" ? "প্রধান কারিগরি দক্ষতাসমূহ" : "Core Technical Capabilities"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
              {language === "bn" ? "আমাদের কাজের ক্ষেত্র ও কার্যপরিধি" : "Our Scope of Engineering Work"}
            </h2>
            <div className="h-1 w-16 bg-brand-gold mx-auto"></div>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {language === "bn" ? (
                "আমরা অত্যন্ত দক্ষতার সাথে ভারি শিল্পকারখানার গ্রিড চাপ সহ্য করার জন্য অত্যন্ত উন্নত পাওয়ার সিস্টেম ডিজাইন, প্রস্তুত এবং রক্ষণাবেক্ষণ করি। নিচে আমাদের সেবাসমূহ দেওয়া হলো।"
              ) : (
                "We engineer, manufacture, and maintain advanced systems configured to handle heavy industrial grid stress. Review our primary scope of production models below."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {localizedCapabilities.map((cap) => (
              <div
                key={cap.id}
                className="group relative bg-white border border-slate-200 hover:border-brand-gold/40 p-6 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1.5 flex flex-col justify-between"
              >
                {/* Visual accent top right */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-gold/5 to-transparent rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="space-y-4">
                  {/* Icon Block */}
                  <div className="inline-flex p-3 bg-slate-50 border border-slate-100 rounded-lg group-hover:border-brand-gold/30 group-hover:bg-slate-100 transition-all">
                    {getIcon(cap.iconName)}
                  </div>
                  
                  <h3 className="text-lg font-display font-semibold text-slate-900 group-hover:text-brand-gold transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {cap.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">
                    {language === "bn" ? "সার্ভিস ক্যাটাগরি" : "Service Category"}
                  </span>
                  <span className="text-brand-gold opacity-0 group-hover:opacity-100 transition-all tracking-wider font-semibold">
                    {language === "bn" ? "বিস্তারিত দেখুন →" : "EXPLORE SPECS →"}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </motion.section>

      {/* 3.5 RECENT COMPLETED PROJECTS */}
      <motion.section
        id="recent-projects"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bg-slate-50 border-y border-slate-200 py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-plt-green font-mono text-xs font-bold tracking-widest uppercase block">
              {language === "bn" ? "প্রজেক্ট গ্যালারি" : "PROJECT GALLERY"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
              {getHeading("recentProjectsHeading", "Completed Substation Projects", "সম্পন্ন সাবস্টেশন প্রজেক্ট সমূহ")}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {getHeading("recentProjectsSub", "Showcasing our completed high-voltage substations, automatic PFI panels, and distribution networks in Bangladesh.", "বাংলাদেশের বিভিন্ন শিল্পাঞ্চলে আমাদের সফলভাবে সম্পন্ন করা হেভি সাবস্টেশন, পাওয়ার ফ্যাক্টর ও ডিস্ট্রিবিউশন নেটওয়ার্ক প্রজেক্ট সমূহ।")}
            </p>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 font-medium">
              {language === "bn" ? "কোনো সাম্প্রতিক প্রজেক্ট পাওয়া যায়নি।" : "No recent projects added yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentProjects.map((project, idx) => (
                <motion.div
                  key={project.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full"
                >
                  {/* Project Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={project.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800"}
                      alt={language === "bn" ? (project.titleBn || project.title) : project.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold font-mono tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {language === "bn" ? "সম্পন্ন" : "Completed"}
                      </span>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-display font-bold text-slate-900 group-hover:text-brand-gold transition-colors leading-snug">
                        {language === "bn" ? (project.titleBn || project.title) : project.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {language === "bn" ? (project.descriptionBn || project.description) : project.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-mono mt-auto">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider">{t.projectClient}</span>
                        <span className="text-slate-800 font-semibold font-sans">
                          {language === "bn" ? (project.clientBn || project.client) : project.client}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider">{t.projectCapacity}</span>
                        <span className="text-slate-800 font-semibold font-mono">
                          {language === "bn" ? (project.capacityBn || project.capacity) : project.capacity}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider">{t.projectLocation}</span>
                        <span className="text-slate-800 font-semibold font-sans">
                          {language === "bn" ? (project.locationBn || project.location) : project.location}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider">{t.projectDate}</span>
                        <span className="text-slate-800 font-semibold">
                          {project.commissionedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </motion.section>

      {/* 4. PRODUCT CATALOG & INTERACTIVE DATA CENTER */}
      <motion.section
        id="tech-data"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24"
      >
        
        {/* A. Transformers Matrix */}
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-brand-gold font-mono text-xs font-semibold uppercase tracking-widest block mb-2">
                {language === "bn" ? "প্রোডাক্ট ডাটা শিট" : "PRODUCT DATA SHEETS"}
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
                {language === "bn" ? "ইন্ডাস্ট্রিয়াল ইলেকট্রিক্যাল প্রোডাক্টস ম্যাট্রিক্স" : "Industrial Electrical Products Matrix"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
                {language === "bn" ? (
                  "আন্তর্জাতিক IEC স্ট্যান্ডার্ড অনুযায়ী প্রস্তুতকৃত উন্নত মানের ডিস্ট্রিবিউশন ট্রান্সফরমার, এইচটি (HT) সুইচগিয়ার প্যানেল এবং কাস্টম পিএফআই (PFI) প্ল্যান্ট। প্রয়োজনীয় ক্ষমতা বা ক্যাটাগরি দিয়ে সার্চ করুন।"
                ) : (
                  "Certified high-tier distribution transformers, HT switchgear lines, and custom PFI panels manufactured to IEC standards. Search and filter by product model name or category."
                )}
              </p>
            </div>

            {/* Matrix Filter Inputs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-grow sm:flex-grow-0">
                <input
                  type="text"
                  placeholder={language === "bn" ? "নাম বা ক্যাটাগরি দিয়ে সার্চ করুন..." : "Search by name or category..."}
                  className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/10 focus:border-brand-gold w-full sm:w-64"
                  value={transformerSearch}
                  onChange={(e) => setTransformerSearch(e.target.value)}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Filter */}
              <select
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/10 focus:border-brand-gold cursor-pointer"
                value={transformerCategoryFilter}
                onChange={(e) => setTransformerCategoryFilter(e.target.value)}
              >
                <option value="all">{language === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}</option>
                <option value="Distribution Transformer">{language === "bn" ? "ডিস্ট্রিবিউশন ট্রান্সফরমার" : "Distribution Transformers"}</option>
                <option value="Power Transformer">{language === "bn" ? "পাওয়ার ট্রান্সফরমার" : "Power Transformers"}</option>
                <option value="PFI Panel">{language === "bn" ? "পিএফআই (PFI) প্যানেল" : "PFI Panels"}</option>
                <option value="HT Switchgear">{language === "bn" ? "এইচটি (HT) সুইচগিয়ার" : "HT Switchgears"}</option>
              </select>

              {/* Quick Select Capacity Filter */}
              <select
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/10 focus:border-brand-gold cursor-pointer animate-none"
                value={transformerFilter}
                onChange={(e) => setTransformerFilter(e.target.value)}
              >
                <option value="all">{language === "bn" ? "সকল ক্যাপাসিটি" : "All Capacities"}</option>
                <option value="small">{language === "bn" ? "ছোট ক্যাপাসিটি (≤ ৫০০ KVA)" : "Small Capacity (≤ 500 KVA)"}</option>
                <option value="large">{language === "bn" ? "উচ্চ ক্যাপাসিটি (> ৫০০ KVA)" : "High Capacity (> 500 KVA)"}</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-slate-200 rounded p-1 bg-slate-100/75 space-x-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-brand-gold shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Grid View (Images & Specs)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white text-brand-gold shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Table View (Data Sheets)"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === "grid" ? (
            /* PREMIUM DYNAMIC PRODUCT GRID WITH IMAGES & COMPACT CARDS */
            <motion.div
              key={`grid-${transformerSearch}-${transformerCategoryFilter}-${transformerFilter}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {isCatalogLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse shadow-sm">
                    <div className="w-full h-44 bg-slate-100 rounded-xl"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    <div className="space-y-2 pt-2">
                      <div className="h-3 bg-slate-100 rounded"></div>
                      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    </div>
                  </div>
                ))
              ) : filteredTransformers.length > 0 ? (
                filteredTransformers.map((item, idx) => {
                  const itemCat = item.category || "Distribution Transformer";
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      className="bg-white border border-slate-200 hover:border-brand-gold/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
                    >
                      {/* Accent highlight strip */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold/10 via-brand-gold/50 to-brand-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div>
                        {/* Image / Fallback Container */}
                        <div className="w-full h-44 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 overflow-hidden mb-4 flex items-center justify-center p-3 relative transition-colors duration-300">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.capacity}
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center space-y-2 select-none">
                              <div className="w-12 h-12 rounded-full bg-amber-50 text-brand-gold flex items-center justify-center border border-amber-100">
                                <Zap className="w-6 h-6" />
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Premium Heavy Duty</span>
                            </div>
                          )}
                          
                          {/* Floating Category Badge */}
                          <div className="absolute top-2.5 left-2.5">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm border ${
                              itemCat === "Distribution Transformer" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              itemCat === "Power Transformer" ? "bg-purple-50 text-purple-700 border-purple-100" :
                              itemCat === "PFI Panel" ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-blue-50 text-blue-700 border-blue-100"
                            }`}>
                              {itemCat}
                            </span>
                          </div>
                        </div>

                        {/* Title & Stats */}
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-slate-900 group-hover:text-brand-gold transition-colors duration-200 flex items-center justify-between">
                            <span>{item.capacity}</span>
                            <span className="text-[11px] text-slate-400 font-mono font-normal">KVA Rating</span>
                          </h4>
                          
                          {/* Mini specs preview */}
                          <div className="grid grid-cols-2 gap-2 pt-3 pb-1 border-t border-slate-100 text-xs">
                            <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-mono uppercase">Losses</span>
                              <span className="font-semibold text-slate-700 block truncate">{item.losses || "N/A"}</span>
                            </div>
                            <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-mono uppercase">Efficiency</span>
                              <span className="font-semibold text-emerald-600 block truncate">{item.efficiency || "98.9%"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(item)}
                          className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-slate-50 hover:bg-brand-gold hover:text-white border border-slate-200 hover:border-brand-gold text-slate-700 text-xs font-bold py-2 px-3 rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          <span>Technical Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const contact = document.getElementById("contact");
                            if (contact) {
                              const textarea = document.getElementsByName("requirements")[0];
                              if (textarea) {
                                textarea.value = `Dear Engineering Team,\n\nWe would like to request an official quote and technical design drawing for this specific model:\n\n- Category: ${itemCat}\n- Capacity Rating: ${item.capacity}\n- Losses (No-Load/Load): ${item.losses || "N/A"}\n- Voltage Regulation: ${item.regulation || "N/A"}\n- Efficiency: ${item.efficiency || "N/A"}\n- Insulating Oil Volume: ${item.oil || "N/A"}\n- Gross Weight: ${item.weight || "N/A"}\n\nPlease reach back to us with availability and estimated delivery times.`;
                                // Dispatch change
                                const event = new Event('input', { bubbles: true });
                                textarea.dispatchEvent(event);
                              }
                              contact.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
                          title="Instant Quote Request"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400 text-sm font-mono bg-white border border-slate-200 rounded-2xl shadow-sm">
                  No matching specifications found in our active database matrices.
                </div>
              )}
            </motion.div>
          ) : (
            /* CLASSIC FULL SPECIFICATIONS SPREADSHEET TABLE */
            <motion.div
              key={`table-${transformerSearch}-${transformerCategoryFilter}-${transformerFilter}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono text-slate-700 uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Capacity Rating / Category</th>
                    <th className="px-6 py-4 font-semibold">Losses (No-Load / Load)</th>
                    <th className="px-6 py-4 font-semibold">% Voltage Regulation</th>
                    <th className="px-6 py-4 font-semibold">Efficiency (Full Load)</th>
                    <th className="px-6 py-4 font-semibold">Insulating Oil Vol</th>
                    <th className="px-6 py-4 font-semibold">Total Gross Weight</th>
                    <th className="px-6 py-4 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {isCatalogLoading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-5 bg-slate-200 rounded w-28 mb-2"></div>
                          <div className="h-3.5 bg-slate-100 rounded w-20"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-32"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-100 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-200 rounded w-12"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-100 rounded w-14"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-slate-100 rounded w-16"></div>
                        </td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    ))
                  ) : filteredTransformers.length > 0 ? (
                    filteredTransformers.map((item, idx) => {
                      const itemCat = item.category || "Distribution Transformer";
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4 font-mono group-hover:translate-x-1 transition-transform duration-100">
                            <div className="font-semibold text-brand-gold text-base">{item.capacity}</div>
                            <div className="mt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {itemCat}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700">{item.losses || "N/A"}</td>
                          <td className="px-6 py-4 font-mono text-slate-500">{item.regulation || "N/A"}</td>
                          <td className="px-6 py-4 font-mono text-emerald-600 font-medium">{item.efficiency || "N/A"}</td>
                          <td className="px-6 py-4 font-mono text-slate-500">{item.oil || "N/A"}</td>
                          <td className="px-6 py-4 font-mono text-slate-500">{item.weight || "N/A"}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(item)}
                              className="p-1.5 bg-slate-50 hover:bg-brand-gold text-slate-500 hover:text-white rounded border border-slate-200 transition-all cursor-pointer"
                              title="Inspect full details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm font-mono">
                        No matching specifications found in our active database matrices.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* B. Component Bill of Materials Origins Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
                {language === "bn" ? "ম্যাগনেটিক কোর উপাদান" : "MAGNETIC CORE MAT"}
              </span>
              <h4 className="text-base font-semibold text-slate-900">{materials.coreOrigin || (language === "bn" ? "নিপ্পন স্টিল (জাপান)" : "Nippon Steel, Japan")}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === "bn" ? (
                  "কোল্ড-রোল্ড গ্রেইন-ওরিয়েন্টেড (CRGO) সিলিকন স্টিল শিট যা হিস্টেরেসিস লস কমিয়ে হিট ডিসিপেশন বৃদ্ধি করে।"
                ) : (
                  "Cold-Rolled Grain-Oriented (CRGO) silicon steel sheet layers providing ultra-low hysteresis heat dissipation."
                )}
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
                {language === "bn" ? "কয়েল ইনসুলেশন" : "COIL INSULATION"}
              </span>
              <h4 className="text-base font-semibold text-slate-900">{materials.insulationOrigin || (language === "bn" ? "উইডম্যান (সুইজারল্যান্ড)" : "Weidmann, Switzerland")}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === "bn" ? (
                  "উচ্চ ডাই-ইলেকট্রিক ক্ষমতা সম্পন্ন উইডম্যান প্রেসবোর্ড সামগ্রী যা সর্বোচ্চ থার্মাল ইনসুলেশন দেয়।"
                ) : (
                  "High dielectric strength Weidmann pressboard components offering absolute thermal insulation reliability."
                )}
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
                {language === "bn" ? "কুলিং ডাই-ইলেকট্রিক অয়েল" : "COOLING DIELECTRIC"}
              </span>
              <h4 className="text-base font-semibold text-slate-900">{materials.oilOrigin || (language === "bn" ? "সবিতা (ভারত)" : "Savita (India)")}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === "bn" ? (
                  "প্রিমিয়াম ক্লাস-১ মিনারেল ইনসুলেটিং ট্রান্সফরমার অয়েল, যা সর্বোত্তম ব্রেকডাউন ভোল্টেজ (BDV) নিশ্চিত করে।"
                ) : (
                  "Premium Class-1 mineral insulating transformer oil, verified for optimum breakdown voltage (BDV) and cooling rates."
                )}
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
                {language === "bn" ? "উইন্ডিং ক্যাবল স্ট্যান্ডার্ড" : "WINDINGS STANDARD"}
              </span>
              <h4 className="text-base font-semibold text-slate-900">{materials.copperOrigin || (language === "bn" ? "বিআরবি ক্যাবল (বাংলাদেশ)" : "BRB Cable, Bangladesh")}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === "bn" ? (
                  "৯৯.৯% খাঁটি ইলেকট্রোলাইটিক গ্রেড ইনসুলেটেড কপার উইন্ডিং যা সর্বোচ্চ বৈদ্যুতিক কর্মদক্ষতা নিশ্চিত করে।"
                ) : (
                  "99.9% pure electrolytic grade insulated copper windings to ensure maximum electrical efficiency and conductivity."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Elegant Corporate Section Divider - Switchgear Line */}
        <div className="relative py-12 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          </div>
          <div className="relative bg-white px-6 py-2.5 rounded-full border border-slate-200/80 shadow-md flex items-center space-x-3 transition-all hover:border-plt-green/40 hover:shadow-lg group">
            {/* Left accent lines */}
            <div className="flex space-x-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-plt-green animate-pulse"></div>
              <div className="w-12 h-[2px] bg-gradient-to-r from-plt-green to-plt-purple rounded"></div>
            </div>

            {/* Central Badge and Title */}
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-slate-50 rounded-lg text-plt-green group-hover:bg-plt-green group-hover:text-white transition-colors duration-300">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] tracking-widest font-bold text-slate-500 uppercase select-none">
                {language === "bn" ? "সুইচগিয়ার ও সুরক্ষা প্যানেল" : "PROTECTION & SWITCHGEAR PANEL LINE"}
              </span>
            </div>

            {/* Right accent lines */}
            <div className="flex space-x-1 items-center">
              <div className="w-12 h-[2px] bg-gradient-to-r from-plt-purple to-plt-violet rounded"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-plt-violet"></div>
            </div>
          </div>
        </div>

        {/* C. High Voltage Switchgear Terminal */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 relative shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Spec Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <Badge variant="purple">{language === "bn" ? "এইচটি সুইচগিয়ার প্যানেল" : "HT Switchgear Terminal"}</Badge>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
                  {language === "bn" ? "হাই-ভোল্টেজ LBS এবং VCB প্যানেল অ্যাসেম্বলি" : "High-Voltage LBS & VCB Assemblies"}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {language === "bn" ? (
                    "২৫.২ কেভি (25.2 KV) গ্রিড ফ্রিকোয়েন্সি পর্যন্ত যেকোনো শর্ট সার্কিট ফল্ট সহ্য করার জন্য ডিজাইনকৃত। ইপিএলটি (EPLT) সম্পূর্ণ ঘেরা ও আর্ক-প্রতিরোধী চমৎকার এইচটি সুইচগিয়ার প্যানেল তৈরি করে যা ফ্যাক্টরির সামগ্রিক নিরাপত্তা নিশ্চিত করে।"
                  ) : (
                    "Engineered to endure severe fault conditions up to 25.2 KV grid frequencies. EPLT designs fully enclosed arc-resistant switchgear lineups featuring premium Vacuum Circuit Breakers (VCB) and Load Break Switches (LBS) for robust industrial safety."
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 font-mono">
                <div className="flex items-center space-x-2.5 p-3 bg-white rounded border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                  <span>{language === "bn" ? "ভোল্টেজ রেটিং: ২৫.২ kV পর্যন্ত" : "Rated Voltage: Up to 25.2 kV"}</span>
                </div>
                <div className="flex items-center space-x-2.5 p-3 bg-white rounded border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                  <span>{language === "bn" ? "কারেন্ট রেটিং: ১২৫০ A পর্যন্ত" : "Rated Current: Up to 1250 A"}</span>
                </div>
                <div className="flex items-center space-x-2.5 p-3 bg-white rounded border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                  <span>{language === "bn" ? "ব্রেকিং ক্যাপাসিটি: ২৫ kA / ৩ সে." : "Breaking Capacity: 25 kA / 3s"}</span>
                </div>
                <div className="flex items-center space-x-2.5 p-3 bg-white rounded border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-brand-gold"></div>
                  <span>{language === "bn" ? "প্রতিরক্ষা স্ট্যান্ডার্ড: IP4X আর্ক-প্রুফ" : "Enclosure Standard: IP4X Arc-Proof"}</span>
                </div>
              </div>
            </div>

            {/* Interactive Model Specs Selector (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-xl space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold text-slate-700">
                  {language === "bn" ? "মডেল স্পেসিফিকেশন তুলনা" : "MODEL SPEC COMPARATOR"}
                </span>
                <Badge variant="purple">{language === "bn" ? "IEC কমপ্লায়েন্ট" : "IEC COMPLIANT"}</Badge>
              </div>

              {/* Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {["vcb-12", "lbs-11", "vcb-24"].map((model) => (
                  <button
                    key={model}
                    onClick={() => setSelectedHtModel(model)}
                    className={`py-1.5 px-2 text-xs font-mono font-bold rounded border transition-all uppercase cursor-pointer text-center ${
                      selectedHtModel === model
                        ? "bg-brand-gold text-white border-brand-gold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>

              {/* Specs List Based on Selection */}
              <div className="space-y-3 font-mono text-xs text-slate-600">
                {selectedHtModel === "vcb-12" && (
                  <>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ভিসিবির ধরন:" : "VCB Interrupter Type:"}</span>
                      <span className="text-slate-900 font-bold">{language === "bn" ? "ভ্যাকুয়াম সিলড" : "Vacuum Sealed (BDV)"}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ট্রিপিং মেকানিজম:" : "Tripping Mechanism:"}</span>
                      <span className="text-slate-900 font-bold">{language === "bn" ? "সোলেনয়েড ট্রিপ" : "Solenoid Trip"}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ইনসুলেশনের ধরন:" : "Insulation Type:"}</span>
                      <span className="text-emerald-600 font-bold">{language === "bn" ? "এয়ার ইনসুলেটেড (IP4X)" : "Air Insulated (IP4X)"}</span>
                    </div>
                  </>
                )}

                {selectedHtModel === "lbs-11" && (
                  <>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "সুইচিং কন্টাক্ট টাইপ:" : "Switching Contact Type:"}</span>
                      <span className="text-slate-900 font-bold">{language === "bn" ? "এলবিএস ডাবল-ব্রেক" : "LBS Double-Break"}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ট্রিপিং মেকানিজম:" : "Tripping Mechanism:"}</span>
                      <span className="text-slate-900 font-bold">{language === "bn" ? "ম্যানুয়াল / স্প্রিং-চার্জড" : "Manual / Spring-Charged"}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ইনসুলেশনের ধরন:" : "Insulation Type:"}</span>
                      <span className="text-emerald-600 font-bold">{language === "bn" ? "এয়ার ইনসুলেটেড স্ট্যান্ডার্ড" : "Air Insulated Standard"}</span>
                    </div>
                  </>
                )}

                {selectedHtModel === "vcb-24" && (
                  <>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ভিসিবির ধরন:" : "VCB Interrupter Type:"}</span>
                      <span className="text-slate-900 font-bold">{language === "bn" ? "SF6 গ্যাস ইনসুলেটেড অপশন" : "SF6 Gas Insulated Option"}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ট্রিপিং মেকানিজম:" : "Tripping Mechanism:"}</span>
                      <span className="text-slate-900 font-bold">{language === "bn" ? "অটো ডুয়াল সোলেনয়েড ট্রিপ" : "Auto Dual Solenoid Trip"}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{language === "bn" ? "ইনসুলেশনের ধরন:" : "Insulation Type:"}</span>
                      <span className="text-emerald-600 font-bold">{language === "bn" ? "SF6 কো-ইনসুলেটেড চেম্বার" : "SF6 Co-Insulated Chamber"}</span>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>{language === "bn" ? "থার্মাল ডিসচার্জ লেভেল:" : "THERMAL RUN DISCHARGE LEVEL:"}</span>
                    <span>{language === "bn" ? "৩২°সে / ৮৫°সে সর্বোচ্চ (নিরাপদ)" : "32°C / 85°C Max (Safe)"}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-brand-gold h-full w-[38%]"></div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs cursor-pointer border-slate-300 text-slate-800 hover:bg-slate-50"
                  onClick={() => {
                    const contact = document.getElementById("contact");
                    if (contact) contact.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Request HT Panel Blueprint Drawing
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Corporate Section Divider */}
        <div className="relative py-12 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          </div>
          <div className="relative bg-white px-6 py-2.5 rounded-full border border-slate-200/80 shadow-md flex items-center space-x-3 transition-all hover:border-plt-purple/40 hover:shadow-lg group">
            {/* Left accent lines */}
            <div className="flex space-x-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-plt-purple animate-pulse"></div>
              <div className="w-12 h-[2px] bg-gradient-to-r from-plt-purple to-plt-green rounded"></div>
            </div>

            {/* Central Badge and Title */}
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-slate-50 rounded-lg text-plt-purple group-hover:bg-plt-purple group-hover:text-white transition-colors duration-300">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="font-mono text-[10px] tracking-widest font-bold text-slate-500 uppercase select-none">
                {language === "bn" ? "কারিগরি হিসাব-নিকাশ ও বিশ্লেষণ" : "TECHNICAL COMPUTATIONS & METRICS"}
              </span>
            </div>

            {/* Right accent lines */}
            <div className="flex space-x-1 items-center">
              <div className="w-12 h-[2px] bg-gradient-to-r from-plt-green to-plt-violet rounded"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-plt-violet"></div>
            </div>
          </div>
        </div>

        {/* D. Solar Energy & Active Power Factor Surcharge Penalty Estimator */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
          
          {/* Interactive Calculator (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-brand-gold font-mono text-xs font-semibold uppercase tracking-widest block mb-2">
                {language === "bn" ? "কারিগরি হিসাব-নিকাশ" : "ENGINEERING MATH SUITE"}
              </span>
              <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                {getHeading("estimatorTitle", "Active Power Factor (PF) Surcharge Estimator", "অ্যাক্টিভ পাওয়ার ফ্যাক্টর (PF) সারচার্জ ক্যালকুলেটর")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {getHeading("estimatorSub", "Calculate your load efficiency coefficient to verify utility penalty liabilities. In Bangladesh, DPDC, DESCO, and BREB levy heavy monthly surcharges if the industrial average PF falls below 0.95.", "আপনার লোড কর্মদক্ষতা সহগ হিসাব করে নিশ্চিত করুন কোনো জরিমানা দিতে হবে কিনা। বাংলাদেশে, গড়ে পাওয়ার ফ্যাক্টর ০.৯৫ এর নিচে নেমে গেলে ডিপিডিসি (DPDC), ডেসকো (DESCO) এবং আরইবি (BREB) প্রতি মাসে বড় অঙ্কের জরিমানা আরোপ করে।")}
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-700 uppercase mb-2">
                  {language === "bn" ? "অ্যাক্টিভ পাওয়ার (P, kW)" : "Active Power (P, kW)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/15 focus:border-brand-gold text-sm font-mono"
                    value={activePower}
                    onChange={(e) => setActivePower(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 font-mono">kW</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-slate-700 uppercase mb-2">
                  {language === "bn" ? "অ্যাপ্যারেন্ট পাওয়ার (S, kVA)" : "Apparent Power (S, kVA)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/15 focus:border-brand-gold text-sm font-mono"
                    value={apparentPower}
                    onChange={(e) => setApparentPower(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 font-mono">kVA</span>
                </div>
              </div>
            </div>

            {/* Error Alerts */}
            {validationError && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-xs leading-relaxed font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {language === "bn" ? "অ্যাপ্যারেন্ট পাওয়ার অবশ্যই অ্যাক্টিভ পাওয়ারের সমান বা বেশি হতে হবে।" : validationError}
                </span>
              </div>
            )}

            {/* Mathematical Formula Preview */}
            <div className="p-4 bg-white border border-slate-200 rounded font-mono text-xs space-y-1 text-slate-600">
              <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                {language === "bn" ? "গাণিতিক সূত্র:" : "Mathematical Formula:"}
              </div>
              <div className="text-center py-2 text-sm text-brand-gold font-bold">
                {language === "bn" ? (
                  "পাওয়ার ফ্যাক্টর (PF) = অ্যাক্টিভ পাওয়ার (kW) ÷ অ্যাপ্যারেন্ট পাওয়ার (kVA)"
                ) : (
                  "Power Factor (PF) = Active Power (kW) ÷ Apparent Power (kVA)"
                )}
              </div>
            </div>
          </div>

          {/* Results Badge Column (5 cols) */}
          <div className="lg:col-span-5 bg-slate-100/60 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            
            {/* Result Displays */}
            <div className="space-y-4">
              <span className="text-slate-600 font-mono text-xs uppercase tracking-wider block">
                {language === "bn" ? "হিসাবকৃত ফলাফল" : "Calculated Result"}
              </span>
              
              {calculatedPf !== null ? (
                <div className="space-y-2">
                  <div className="text-5xl sm:text-6xl font-display font-black text-slate-900 tracking-tight flex items-baseline">
                    <span className={pfWarning === "danger" ? "text-red-600" : pfWarning === "warning" ? "text-brand-gold" : "text-emerald-600"}>
                      {calculatedPf}
                    </span>
                    <span className="text-sm font-normal text-slate-500 ml-2">PF COS(θ)</span>
                  </div>

                  <div className="pt-2">
                    {pfWarning === "danger" && (
                      <div className="space-y-2">
                        <Badge variant="danger">
                          {language === "bn" ? "অত্যধিক জরিমানার ঝুঁকি" : "HIGH UTILITY PENALTY RISK"}
                        </Badge>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {language === "bn" ? (
                            <span>
                              আপনার পাওয়ার ফ্যাক্টর আইনি সীমা ০.৯৫ এর অনেক নিচে। আপনার মোট বিদ্যুৎ বিলের ওপর <strong>১০% থেকে ১৫% পর্যন্ত সারচার্জ বা জরিমানা</strong> আসার ঝুঁকি রয়েছে। এই জরিমানা এড়াতে অবিলম্বে একটি কাস্টম PFI প্যানেল স্থাপন করার জন্য অনুরোধ করা হলো।
                            </span>
                          ) : (
                            "Your power factor falls far below the 0.95 legal limit. You risk a mandatory 10% to 15% monthly utility penalty surcharge on your peak electricity bill. Installing a custom-fabricated EPLT PFI plant is highly recommended to correct this liability instantly."
                          )}
                        </p>
                      </div>
                    )}

                    {pfWarning === "warning" && (
                      <div className="space-y-2">
                        <Badge variant="warning">
                          {language === "bn" ? "সীমিত জরিমানার ঝুঁকি" : "MODERATE PENALTY EXPOSURE"}
                        </Badge>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {language === "bn" ? (
                            "আপনার পাওয়ার ফ্যাক্টর গ্রহণযোগ্য তবে সীমানার কাছাকাছি। যেকোনো সময় ০.৯৫ এর নিচে নেমে জরিমানা হতে পারে। পাওয়ার ফ্যাক্টর উন্নত করতে EPLT-এর অটোমেটিক ক্যাপাসিটর ব্যাংক ব্যবহার করুন।"
                          ) : (
                            "Your power factor is acceptable but borderline. Minor load fluctuations might tip you below 0.95. Installing automatic capacitor steps from EPLT can optimize your energy efficiency."
                          )}
                        </p>
                      </div>
                    )}

                    {pfWarning === "success" && (
                      <div className="space-y-2">
                        <Badge variant="success">
                          {language === "bn" ? "সর্বোত্তম বিদ্যুৎ দক্ষতা" : "PEAK ELECTRICAL EFFICIENCY"}
                        </Badge>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {language === "bn" ? (
                            "দুর্দান্ত লোড ম্যানেজমেন্ট। আপনার বিদ্যুৎ বণ্টন ব্যবস্থা অত্যন্ত দক্ষ এবং জরিমানার কোনো ঝুঁকি নেই।"
                          ) : (
                            "Excellent load management. Your power distribution is optimized with negligible reactive power losses. Zero penalty risks."
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 font-mono italic">
                  {language === "bn" ? (
                    "সঠিক অ্যাক্টিভ ও অ্যাপ্যারেন্ট পাওয়ারের মান বসানোর জন্য অপেক্ষা করা হচ্ছে..."
                  ) : (
                    "Awaiting correct active/apparent power specifications..."
                  )}
                </div>
              )}
            </div>

            {/* Call to action for PFI */}
            <div className="pt-4 border-t border-slate-200">
              <Button
                variant={pfWarning === "danger" ? "gold" : "secondary"}
                className="w-full flex items-center justify-center space-x-2 text-xs uppercase font-bold tracking-wider py-3 cursor-pointer"
                onClick={() => {
                  const contact = document.getElementById("contact");
                  if (contact) {
                    // Pre-fill requirements if we want, or just scroll down
                    const textarea = document.getElementsByName("requirements")[0];
                    if (textarea) {
                      textarea.value = `We need a Power Factor Improvement (PFI) Plant quote. Our calculated Active Power is ${activePower} kW with an Apparent Power of ${apparentPower} kVA, resulting in a low Power Factor of ${calculatedPf}.`;
                    }
                    contact.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <span className="text-white">
                  {language === "bn" ? "কাস্টম PFI সলিউশন কোটেশন অনুরোধ করুন" : "Request Custom PFI Solution Quote"}
                </span>
              </Button>
            </div>

          </div>

        </div>

      </motion.section>

      {/* 5. INTERACTIVE PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          {/* Backdrop Click Close */}
          <div 
            className="absolute inset-0 cursor-default" 
            onClick={() => setSelectedProduct(null)}
          ></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 overflow-hidden shadow-2xl relative my-8 z-10"
          >
            {/* Modal Header Banner */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-brand-gold font-mono text-[10px] font-bold uppercase tracking-widest block mb-1">
                  {language === "bn" ? "কারিগরি স্পেসিফিকেশন ব্রোশিওর" : "Technical Specifications Brochure"}
                </span>
                <h3 className="text-xl font-display font-bold tracking-tight">
                  {selectedProduct.capacity} KVA {selectedProduct.category || "Distribution Transformer"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content Container */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Visual Representation (5 cols) */}
                <div className="md:col-span-5 space-y-4">
                  <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-4 relative">
                    {selectedProduct.image ? (
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.capacity}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-amber-50 text-brand-gold flex items-center justify-center border border-amber-100 mx-auto">
                          <Zap className="w-8 h-8" />
                        </div>
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">Transformer Matrix</div>
                          <div className="text-xl font-black text-slate-800 font-display mt-0.5">{selectedProduct.capacity} KVA</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational / Compliance Badges */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block tracking-wider">
                      {language === "bn" ? "কারিগরি সার্টিফিকেশন" : "ENGINEERING CERTIFICATION"}
                    </span>
                    <ul className="space-y-1 text-slate-600 font-mono">
                      <li className="flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{language === "bn" ? "IEC ৬০৭৬ স্ট্যান্ডার্ড কমপ্লায়েন্স" : "IEC 60076 Standard Compliance"}</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{language === "bn" ? "ডেসকো/ডিপিডিসি গ্রিড উপযোগী" : "DESCO/DPDC Grid Compatible"}</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{language === "bn" ? "ফ্যাক্টরি সার্টিফাইড কোয়ালিটি অ্যাসুরেন্স" : "Factory Certified Quality Assurance"}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Column: Full specifications Sheets (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {language === "bn" ? "ইলেক্ট্রোমেকানিক্যাল ডাটা শিট" : "ELECTROMECHANICAL DATA"}
                  </h4>

                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 text-sm">
                    {/* Capacity Row */}
                    <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "ক্যাপাসিটি রেটিং" : "Capacity Rating"}</span>
                      <span className="font-semibold text-slate-900 font-mono text-right">{selectedProduct.capacity} KVA</span>
                    </div>

                    {/* Category Row */}
                    <div className="grid grid-cols-2 p-3">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "প্রোডাক্ট ক্যাটাগরি" : "Product Category"}</span>
                      <span className="font-semibold text-brand-gold text-right">{selectedProduct.category || "Distribution Transformer"}</span>
                    </div>

                    {/* Losses Row */}
                    <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "লস সমূহ (নো-লোড / লোড)" : "Losses (No-Load / Load)"}</span>
                      <span className="font-semibold text-slate-800 font-mono text-right">{selectedProduct.losses || "N/A"}</span>
                    </div>

                    {/* Voltage Regulation Row */}
                    <div className="grid grid-cols-2 p-3">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "ভোল্টেজ রেগুলেশন %" : "% Voltage Regulation"}</span>
                      <span className="font-semibold text-slate-800 font-mono text-right">{selectedProduct.regulation || "N/A"}</span>
                    </div>

                    {/* Efficiency Row */}
                    <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "বৈদ্যুতিক দক্ষতা" : "Electrical Efficiency"}</span>
                      <span className="font-semibold text-emerald-600 font-mono text-right">{selectedProduct.efficiency || "98.9%"}</span>
                    </div>

                    {/* Insulating Oil Vol Row */}
                    <div className="grid grid-cols-2 p-3">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "ইনসুলেটিং তেল" : "Insulating Oil Vol"}</span>
                      <span className="font-semibold text-slate-800 font-mono text-right">{selectedProduct.oil || "N/A"}</span>
                    </div>

                    {/* Total Gross Weight Row */}
                    <div className="grid grid-cols-2 p-3 bg-slate-50/50">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "মোট ওজন" : "Total Gross Weight"}</span>
                      <span className="font-semibold text-slate-800 font-mono text-right">{selectedProduct.weight || "N/A"}</span>
                    </div>

                    {/* Phase / Frequency / Cooling Row */}
                    <div className="grid grid-cols-2 p-3">
                      <span className="text-slate-500 font-medium">{language === "bn" ? "অপারেটিং ফ্রিকোয়েন্সি" : "Operating Frequency"}</span>
                      <span className="font-semibold text-slate-800 font-mono text-right">3-Phase / 50 Hz</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs text-slate-500 leading-relaxed font-mono bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                    <Info className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span>
                      {language === "bn" ? (
                        "স্পেসিফিকেশন সমূহ ফ্যাক্টরি টেস্টের মাধ্যমে যাচাইকৃত। প্রকৌশলীদের পরামর্শ অনুযায়ী কাস্টম টার্মিনাল ডিজাইন, সোলার কানেকশন এডাপ্টার এবং টেম্পারেচার ইন্ডিকেটর কনফিগারেশন সরবরাহ করা যাবে।"
                      ) : (
                        "Specifications are verified under factory tests. Custom terminal designs, solar connection adapters, and temperature indicator configurations are available upon engineering inquiry."
                      )}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {language === "bn" ? "বন্ধ করুন" : "Close Specs"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedProduct;
                  setSelectedProduct(null); // close modal
                  const contact = document.getElementById("contact");
                  if (contact) {
                    const textarea = document.getElementsByName("requirements")[0];
                    if (textarea) {
                      textarea.value = `Dear Engineering Team,\n\nWe would like to request an official quote and technical design drawing for this specific model:\n\n- Category: ${target.category || "Distribution Transformer"}\n- Capacity Rating: ${target.capacity}\n- Losses (No-Load/Load): ${target.losses || "N/A"}\n- Voltage Regulation: ${target.regulation || "N/A"}\n- Efficiency: ${target.efficiency || "N/A"}\n- Insulating Oil Volume: ${target.oil || "N/A"}\n- Gross Weight: ${target.weight || "N/A"}\n\nPlease reach back to us with availability and estimated delivery times.`;
                      // Dispatch change
                      const event = new Event('input', { bubbles: true });
                      textarea.dispatchEvent(event);
                    }
                    contact.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex items-center space-x-1.5 px-5 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer bg-brand-gold text-white hover:bg-brand-gold-hover shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{language === "bn" ? "কমার্শিয়াল প্রপোজাল অনুরোধ করুন" : "Request Commercial Proposal"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
