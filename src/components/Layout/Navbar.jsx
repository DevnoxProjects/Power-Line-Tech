import React, { useState, useEffect } from "react";
import { Menu, X, PhoneCall, Cpu, ShieldAlert, LogIn, LayoutDashboard } from "lucide-react";
import { translations } from "../../data/translations.js";

export function Navbar({ currentView, onViewChange, brandName, brandAbbr, hotline, language = "en", setLanguage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const t = translations[language] || translations.en;

  // Track scrolling to add glassmorphism backgrounds
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Simple scroll spy logic
      if (currentView === "home") {
        const sections = ["home", "about", "scope", "tech-data", "contact"];
        const scrollPosition = window.scrollY + 120;

        for (const section of sections) {
          const el = document.getElementById(section);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setActiveSection(section);
              break;
            }
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentView]);

  const handleLinkClick = (sectionId) => {
    setIsOpen(false);
    if (currentView !== "home") {
      onViewChange("home");
      // Delay slightly to allow the DOM to switch back and mount sections
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navLinks = [
    { label: t.navHome, id: "home" },
    { label: t.navAbout, id: "about" },
    { label: t.navScope, id: "scope" },
    { label: t.navTechData, id: "tech-data" },
    { label: t.navContact, id: "contact" }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm py-3"
          : "bg-white border-b border-slate-100 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo Brand Title */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => handleLinkClick("home")}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-transparent flex items-center justify-center overflow-hidden p-0.5">
              <img
                src="/logo.png"
                alt="EPLT Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = document.createElement("div");
                    fallback.className = "w-full h-full flex items-center justify-center bg-plt-purple text-white font-bold font-mono text-xs rounded";
                    fallback.innerText = brandAbbr;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <div>
              <span className="font-display font-bold text-base sm:text-lg text-plt-green block leading-tight tracking-tight">
                {brandName}
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-plt-purple uppercase tracking-widest block">
                {language === "bn" ? `${brandAbbr} সাবস্টেশন সিস্টেমস` : `${brandAbbr} Substation Systems`}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`px-3.5 py-2 text-sm font-medium transition-colors rounded hover:text-brand-gold ${
                  currentView === "home" && activeSection === link.id
                    ? "text-brand-gold bg-slate-100"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </button>
            ))}


          </div>

          {/* Right actions: Language Switcher & Hotline */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-inner">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white text-plt-purple shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("bn")}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  language === "bn"
                    ? "bg-white text-plt-purple shadow-sm font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="বাংলায় পরিবর্তন করুন"
              >
                বাংলা
              </button>
            </div>

            {/* Hotline / Call Badge */}
            <a
              href={`tel:${hotline}`}
              className="flex items-center space-x-2 bg-slate-50 border border-slate-200 hover:border-brand-gold/50 px-4 py-2 rounded-full text-sm font-semibold text-slate-800 transition-all duration-200 shadow-sm group"
            >
              <PhoneCall className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
              <span className="text-slate-500 font-normal">{language === "bn" ? "হটলাইন:" : "Sales Hotline:"}</span>
              <span className="text-brand-gold font-mono">{hotline}</span>
            </a>
          </div>

          {/* Mobile Hamburguer Toggle & Language Toggle */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* Quick Mobile Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white text-plt-purple shadow-xs"
                    : "text-slate-500"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("bn")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  language === "bn"
                    ? "bg-white text-plt-purple shadow-xs"
                    : "text-slate-500"
                }`}
              >
                বাং
              </button>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 py-6 px-4 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`text-left px-4 py-3 rounded text-base font-medium transition-all ${
                  currentView === "home" && activeSection === link.id
                    ? "bg-slate-50 text-brand-gold font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </button>
            ))}

            {/* Mobile hotline support */}
            <div className="pt-4 border-t border-slate-100">
              <a
                href={`tel:${hotline}`}
                className="flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow"
              >
                <PhoneCall className="w-4 h-4 text-brand-gold" />
                <span>{language === "bn" ? "হটলাইন:" : "Sales Hotline:"} {hotline}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
