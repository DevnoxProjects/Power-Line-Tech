import React from "react";

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  type = "button",
  disabled = false,
  onClick,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md focus:ring-blue-500",
    secondary: "bg-brand-slate hover:bg-slate-700 text-white focus:ring-slate-500",
    outline: "border-2 border-brand-slate hover:border-brand-gold hover:text-brand-gold text-slate-300 bg-transparent",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    gold: "bg-brand-gold hover:bg-brand-gold-hover text-brand-dark font-semibold shadow-md border border-brand-gold/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs tracking-wide",
    md: "px-5 py-2.5 text-sm tracking-wide",
    lg: "px-7 py-3 text-base font-semibold tracking-wide"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
