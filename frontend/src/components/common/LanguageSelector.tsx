import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

type LanguageSelectorProps = {
  compact?: boolean;
  className?: string;
  align?: "left" | "right";
};

function FlagIcon({ code, className = "w-5 h-3.5" }: { code: string; className?: string }) {
  switch (code) {
    case "tr":
      return (
        <svg className={`${className} rounded-xs shadow-xs shrink-0`} viewBox="0 0 1200 800" aria-hidden="true">
          <rect width="1200" height="800" fill="#E30A17" />
          <circle cx="425" cy="400" r="200" fill="#ffffff" />
          <circle cx="475" cy="400" r="160" fill="#E30A17" />
          <polygon points="583,400 706,440 630,336 630,464 706,360" fill="#ffffff" />
        </svg>
      );
    case "en":
      return (
        <svg className={`${className} rounded-xs shadow-xs shrink-0`} viewBox="0 0 60 30" aria-hidden="true">
          <clipPath id="uk-clip"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
          <clipPath id="uk-diag"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
          <g clipPath="url(#uk-clip)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-diag)" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      );
    case "de":
      return (
        <svg className={`${className} rounded-xs shadow-xs shrink-0`} viewBox="0 0 5 3" aria-hidden="true">
          <rect width="5" height="1" y="0" fill="#111111" />
          <rect width="5" height="1" y="1" fill="#DD0000" />
          <rect width="5" height="1" y="2" fill="#FFCE00" />
        </svg>
      );
    case "es":
      return (
        <svg className={`${className} rounded-xs shadow-xs shrink-0`} viewBox="0 0 750 500" aria-hidden="true">
          <rect width="750" height="500" fill="#AA151B" />
          <rect width="750" height="250" y="125" fill="#F1BF00" />
        </svg>
      );
    case "pt":
      return (
        <svg className={`${className} rounded-xs shadow-xs shrink-0`} viewBox="0 0 600 400" aria-hidden="true">
          <rect width="240" height="400" fill="#006600" />
          <rect width="360" height="400" x="240" fill="#FF0000" />
          <circle cx="240" cy="200" r="50" fill="#FFFF00" />
          <circle cx="240" cy="200" r="38" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
        </svg>
      );
    default:
      return <Globe className={className} />;
  }
}

export function LanguageSelector({ compact = false, className = "", align = "left" }: LanguageSelectorProps) {
  const { language, setLanguage, languages, currentMeta } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div ref={containerRef} className={`relative inline-block text-xs font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-2.5 py-1 text-slate-800 dark:text-slate-100 shadow-sm transition-all hover:border-cyan-500 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95"
        aria-label="Dil Seçimi / Select Language"
        title="Dil Seçenekleri (TR, EN, DE, ES, PT)"
      >
        <FlagIcon code={language} className="w-4 h-3 rounded-xs ring-1 ring-black/10 dark:ring-white/20" />
        {!compact && (
          <span className="font-bold tracking-wider text-xs text-slate-800 dark:text-slate-100">
            {currentMeta.code.toUpperCase()}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute ${alignClass} top-full mt-2 z-[9999] min-w-[190px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <Globe className="h-3 w-3 text-cyan-500" />
            <span>DİL SEÇİMİ / LANGUAGE</span>
          </div>

          <div className="p-1 space-y-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-all ${
                    isSelected
                      ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold border border-cyan-500/30"
                      : "text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <FlagIcon code={lang.code} className="w-5 h-3.5 rounded-xs ring-1 ring-black/10 dark:ring-white/20" />
                    <span className="font-semibold text-xs tracking-wide">{lang.nativeName}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                      {lang.code}
                    </span>
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
