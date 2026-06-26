import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { defaultAppContent } from "./data/defaultContent.js";
import { Navbar } from "./components/Layout/Navbar.jsx";
import { Home } from "./pages/Home.jsx";
import { Admin } from "./pages/Admin.jsx";
import { Footer } from "./components/Layout/Footer.jsx";
import { Cpu, Loader2 } from "lucide-react";

export default function App() {
  const [content, setContent] = useState(defaultAppContent);
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("eplt_lang") || "en";
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("eplt_lang", lang);
  };

  const fetchAppContent = async () => {
    try {
      const response = await fetch("/api/content");
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        console.warn("Backend API not fully resolved. Defaulting to standard configurations.");
      }
    } catch (e) {
      console.warn("Express server offline or client pre-build environment. Defaulting to fallback configurations.", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppContent();
  }, []);

  // Sync state with url path/hash for direct admin access
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/admin" || hash === "#/admin" || hash === "#admin") {
        setView("admin");
      } else {
        setView("home");
      }
    };
    handleRouteSync();
    window.addEventListener("popstate", handleRouteSync);
    window.addEventListener("hashchange", handleRouteSync);
    return () => {
      window.removeEventListener("popstate", handleRouteSync);
      window.removeEventListener("hashchange", handleRouteSync);
    };
  }, []);

  const handleViewChange = (v) => {
    setView(v);
    if (v === "admin") {
      window.history.pushState({}, "", "/admin");
    } else {
      window.history.pushState({}, "", "/");
    }
  };

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center text-slate-800 z-50">
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm p-1.5 animate-pulse">
            <img
              src="/logo.png"
              alt="EPLT Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className = "w-full h-full flex items-center justify-center bg-plt-purple text-white font-bold font-mono text-lg rounded-xl";
                  fallback.innerText = "PLT";
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <div className="text-center">
            <h3 className="font-display font-bold text-xl text-slate-900">
              <span className="text-plt-green">Power Line Tech</span> <span className="text-plt-purple">(EPLT)</span>
            </h3>
            <p className="text-xs font-mono text-plt-purple uppercase tracking-widest mt-1 font-bold">
              Loading Electrical Engineering Catalog
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono pt-4">
            <Loader2 className="w-4 h-4 animate-spin text-plt-purple" />
            <span>Connecting to service...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="root-app" className="min-h-screen w-full flex flex-col bg-white text-slate-800 antialiased overflow-x-hidden selection:bg-brand-gold/20 selection:text-brand-gold">
      {/* Sticky header glassmorphism */}
      {view === "home" && (
        <Navbar
          currentView={view}
          onViewChange={handleViewChange}
          brandName={content.brandName}
          brandAbbr={content.brandAbbr}
          hotline={content.headerHotline}
          language={language}
          setLanguage={setLanguage}
        />
      )}

      {/* Main Container */}
      <main className={`flex-grow ${view === "home" ? "pt-[84px]" : ""}`}>
        <AnimatePresence mode="wait">
          {view === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <Home content={content} language={language} />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <Admin content={content} onRefresh={fetchAppContent} onViewChange={handleViewChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer is only rendered on public site. On admin site, let's keep it empty or simple. */}
      {view === "home" && (
        <Footer contactData={content.contact} headings={content.headings} language={language} />
      )}
    </div>
  );
}
