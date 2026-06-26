import React from "react";

export function Badge({ variant = "info", children, className = "" }) {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    gold: "bg-brand-gold/10 text-brand-gold border border-brand-gold/30",
    purple: "bg-[#4a3b80] text-white border border-[#4a3b80]"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
