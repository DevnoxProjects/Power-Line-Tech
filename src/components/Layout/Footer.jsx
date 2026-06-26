import React, { useState } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../ui/Button.jsx";
import { Input, TextArea } from "../../ui/Input.jsx";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase.js";
import { collection, addDoc } from "firebase/firestore";

export function Footer({ contactData, headings, language }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    requirements: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setError(
        language === "bn"
          ? "দয়া করে প্রয়োজনীয় সকল ঘর পূরণ করুন (নাম, ইমেইল, মোবাইল নম্বর)।"
          : "Please fill in all required fields (Name, Email, Mobile)."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Try to record inquiry in Firestore directly as documented in database.md
      let docLogged = false;
      try {
        const payload = {
          ...formData,
          status: "New",
          adminNotes: "",
          timestamp: new Date().toISOString()
        };
        await addDoc(collection(db, "inquiries"), payload);
        docLogged = true;
      } catch (firestoreErr) {
        try {
          handleFirestoreError(firestoreErr, OperationType.CREATE, "inquiries");
        } catch (diagErr) {
          console.warn("Direct Firestore lead submission blocked or offline. Falling back to backend local registry...");
        }
      }

      // 2. Fallback to API route (also registers sheets integration if configured)
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();
      if ((response.ok && resData.success) || docLogged) {
        setSuccess(
          language === "bn"
            ? "ধন্যবাদ! আপনার কমার্শিয়াল ইনকোয়ারি সফলভাবে নথিভুক্ত হয়েছে। আমাদের ইঞ্জিনিয়ারিং টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।"
            : "Thank you! Your commercial inquiry has been logged. Our engineering desk will contact you shortly."
        );
        setFormData({ name: "", email: "", phone: "", requirements: "" });
      } else {
        setError(
          resData.error ||
            (language === "bn"
              ? "আবেদন জমা দেওয়া যায়নি। দয়া করে আবার চেষ্টা করুন বা সরাসরি হটলাইনে যোগাযোগ করুন।"
              : "Failed to submit inquiry. Please try again or contact hotlines.")
        );
      }
    } catch (e) {
      setError(
        language === "bn"
          ? "নেটওয়ার্ক ত্রুটি। দয়া করে আমাদের হটলাইন নম্বরে সরাসরি কল করুন।"
          : "Network error. Your inquiry is recorded locally but transmission failed. Please call our hotline."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer id="contact" className="bg-slate-50 border-t border-slate-200 pt-20 pb-8 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Corporate Metadata (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-brand-gold font-mono text-xs font-semibold uppercase tracking-widest block mb-2">
                {language === "bn" ? "কর্পোরেট হেডকোয়ার্টার্স" : "CORPORATE HEADQUARTERS"}
              </span>
              <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                {headings ? (
                  language === "bn" ? (headings.contactHeadingBn || headings.contactHeading || "আমাদের ইঞ্জিনিয়ারিং ডেস্কের সাথে যোগাযোগ করুন") : (headings.contactHeading || "Connect with our Engineering Desk")
                ) : (
                  language === "bn" ? "আমাদের ইঞ্জিনিয়ারিং ডেস্কের সাথে যোগাযোগ করুন" : "Connect with our Engineering Desk"
                )}
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed max-w-md">
                {headings ? (
                  language === "bn" ? (headings.contactSubBn || headings.contactSub || "টার্নকি সাবস্টেশন, বৈদ্যুতিক নকশা পরামর্শ, শক্তি অডিট, সোলার প্যানেল ডিজাইন বা প্যানেল তৈরির স্পেসিফিকেশনের জন্য সরাসরি যোগাযোগ করুন।") : (headings.contactSub || "Reach out for turnkey substations, electrical design consulting, energy audits, solar array design, or panel fabrication specifications.")
                ) : (
                  language === "bn" ? (
                    "টার্নকি সাবস্টেশন, বৈদ্যুতিক নকশা পরামর্শ, শক্তি অডিট, সোলার প্যানেল ডিজাইন বা প্যানেল তৈরির স্পেসিফিকেশনের জন্য সরাসরি যোগাযোগ করুন।"
                  ) : (
                    "Reach out for turnkey substations, electrical design consulting, energy audits, solar array design, or panel fabrication specifications."
                  )
                )}
              </p>
            </div>

            <div className="space-y-6">
              {/* Address Row */}
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-brand-gold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                    {language === "bn" ? "নিবন্ধিত ঠিকানা" : "Registered Address"}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {language === "bn" ? (
                      contactData.addressBn || "হাউজ # ২৯/বি, রোড # ১/ডি, নিকুঞ্জ-২, খিলক্ষেত, ঢাকা-১২২৯"
                    ) : (
                      contactData.address || "House # 29/B, Road # 1/D, Nikunja-2, Khilkhet, Dhaka-1229"
                    )}
                  </p>
                </div>
              </div>

              {/* Hotlines Row */}
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-brand-gold shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                    {language === "bn" ? "ইঞ্জিনিয়ারিং হটলাইন" : "Engineering Hotlines"}
                  </h4>
                  <p className="mt-1 text-sm text-brand-gold font-mono font-semibold">
                    {contactData.hotline1 || "01304-742061"} <span className="text-slate-400">/</span> {contactData.hotline2 || "01401-672628"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === "bn" ? "সকাল ৯:০০ টা - রাত ৮:০০ টা পর্যন্ত (শনিবার - বৃহস্পতিবার)" : "Available 9:00 AM - 8:00 PM (GMT +6)"}
                  </p>
                </div>
              </div>

              {/* Email Row */}
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-brand-gold shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                    {language === "bn" ? "সরাসরি ইমেইল" : "Direct Email"}
                  </h4>
                  <a
                    href={`mailto:${contactData.email || "sadiajahanbristy2019@gmail.com"}`}
                    className="mt-1 text-sm text-slate-700 hover:text-brand-gold font-mono block transition-colors"
                  >
                    {contactData.email || "sadiajahanbristy2019@gmail.com"}
                  </a>
                </div>
              </div>
            </div>

            {/* Industrial Geographic Compliance Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-xl relative overflow-hidden shadow-sm">
              <h4 className="text-xs font-mono font-semibold text-slate-800 tracking-wider uppercase mb-1">
                {language === "bn" ? "আঞ্চলিক গ্রিড কমপ্লায়েন্স" : "Regional Grid Compliance"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === "bn" ? (
                  "আমাদের সকল সাবস্টেশন ও প্যানেল পণ্য লাইন ডেসকো (DESCO), ডিপিডিসি (DPDC), আরইবি (REB) এবং পিডিবি (PDB)-এর নিরাপত্তা মানদণ্ড ও অপারেশনাল বিধিমালা কঠোরভাবে মেনে তৈরি করা হয়।"
                ) : (
                  "All manufacturing lines strictly adhere to DESCO, DPDC, REB, and PDB power utility specifications for heavy substation safety and standard operational regulations."
                )}
              </p>
            </div>
          </div>

          {/* Right Column: Inquiry Submission Form (7 cols) */}
          <div id="inquiry-form" className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 relative shadow-sm">
            <h3 className="text-xl font-display font-semibold text-slate-900 mb-1">
              {language === "bn" ? "কমার্শিয়াল স্পেসিফিকেশন ও কোটেশন ফর্ম" : "Submit Commercial Specification Request"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {language === "bn" ? (
                "নিচে আপনার প্রয়োজনীয় সাবস্টেশন বা স্পেসিফিকেশন সমূহ লিখুন। আমাদের লিড ইঞ্জিনিয়ারিং কো-অর্ডিনেটর সরাসরি আপনার সাথে যোগাযোগ করবেন।"
              ) : (
                "Complete the specification details below. Inquiries are processed securely and dispatched directly to our lead engineering coordinators."
              )}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label={language === "bn" ? "গ্রাহকের নাম / প্রতিষ্ঠানের নাম *" : "Client Name *"}
                  name="name"
                  type="text"
                  placeholder={language === "bn" ? "উদা: রহিম গ্রুপ ইঞ্জিনিয়ারিং" : "e.g. Rahim Group Engineering"}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label={language === "bn" ? "কর্পোরেট ইমেইল *" : "Corporate Email *"}
                  name="email"
                  type="email"
                  placeholder={language === "bn" ? "উদা: desk@corporation.com" : "e.g. desk@corporation.com"}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Input
                label={language === "bn" ? "মোবাইল / হটলাইন নম্বর *" : "Mobile / Hotline Number *"}
                name="phone"
                type="tel"
                placeholder={language === "bn" ? "উদা: +৮৮০১৭১২৩৪৫৬৭৮" : "e.g. +88017XXXXXXXX"}
                value={formData.phone}
                onChange={handleInputChange}
                required
              />

              <TextArea
                label={language === "bn" ? "সাবস্টেশন / প্ল্যান্ট স্পেসিফিকেশন / কাজের বিবরণ *" : "Substation / Plant Specifications / Project Scope *"}
                name="requirements"
                placeholder={
                  language === "bn"
                    ? "আপনার সাবস্টেশন বা প্যানেলের প্রয়োজনীয়তা, লোড সাইজ, সোলার লক্ষ্যমাত্রা ইত্যাদি বিস্তারিত লিখুন..."
                    : "Describe your substation requirements, panels needed, peak loads, solar capacity targets, or custom BBTS requirements..."
                }
                value={formData.requirements}
                onChange={handleInputChange}
                required
              />

              {/* Status Indicator Toasts */}
              {success && (
                <div className="flex items-start space-x-2.5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm leading-relaxed">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start space-x-2.5 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full flex items-center justify-center space-x-2 text-white font-semibold cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{language === "bn" ? "প্রসেস করা হচ্ছে..." : "Processing Submission..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>{language === "bn" ? "স্পেসিফিকেশন ইনকোয়ারি জমা দিন" : "Submit Specification Inquiry"}</span>
                  </>
                )}
              </Button>
            </form>
          </div>

        </div>

        {/* Brand Signoff */}
        <div className="border-t border-slate-200 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-slate-400">
          <p>
            {language === "bn" ? (
              `© ${new Date().getFullYear()} পাওয়ার লাইন টেক (EPLT)। সর্বস্বত্ব সংরক্ষিত।`
            ) : (
              `© ${new Date().getFullYear()} Power Line Tech (EPLT). All Technical Specifications Reserved.`
            )}
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span>{language === "bn" ? "আইএসও ৯০০১:২০১৫ সার্টিফাইড" : "ISO 9001:2015 Certified"}</span>
            <span>•</span>
            <span>{language === "bn" ? "বুয়েট কোয়ালিটি সার্টিফাইড" : "BUET Quality Certified"}</span>
            <span>•</span>
            <span>{language === "bn" ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
