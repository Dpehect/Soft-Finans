import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useTranslation, LanguageCode } from "../../lib/i18n";

type LanguageSelectorProps = {
  compact?: boolean;
  className?: string;
  align?: "left" | "right";
};

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
        className="flex items-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-panel/90 px-2.5 py-1 text-terminal-text shadow-sm transition-all hover:border-terminal-accent hover:bg-terminal-bg active:scale-95"
        aria-label="Dil Seçimi / Select Language"
        title="Dil Seçenekleri (TR, EN, DE, ES, PT)"
      >
        <span className="text-sm leading-none">{currentMeta.flag}</span>
        {!compact && <span className="font-bold tracking-wider">{currentMeta.code.toUpperCase()}</span>}
        <ChevronDown className={`h-3 w-3 text-terminal-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute ${alignClass} top-full mt-1.5 z-[999] min-w-[155px] overflow-hidden rounded-xl border border-terminal-border bg-terminal-panel/95 py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}>
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-terminal-muted border-b border-terminal-border/50">
            DİL / LANGUAGE
          </div>
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
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-terminal-accent/15 text-terminal-accent font-bold"
                    : "text-terminal-text hover:bg-terminal-bg"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-terminal-muted">
                  {lang.code}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
