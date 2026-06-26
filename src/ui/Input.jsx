import React from "react";

export const Input = React.forwardRef(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition duration-150 text-sm ${
            error ? "border-red-500 focus:border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export const TextArea = React.forwardRef(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={4}
          className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/10 transition duration-150 text-sm resize-none ${
            error ? "border-red-500 focus:border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500 mt-1 block">{error}</span>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
