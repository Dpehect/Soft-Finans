import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Compass, BookOpen, RotateCcw, X, Sparkles } from "lucide-react";
import { useGuideStore } from "./guideStore";

export function FloatingHelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { startTour, openHelp, resetOnboarding } = useGuideStore();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="fixed bottom-8 right-4 z-[9980] hidden sm:block">
      {/* Popover Menu */}
      {isOpen && (
        <div className="mb-2 w-64 overflow-hidden rounded-lg border border-terminal-border bg-terminal-panel shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-terminal-border bg-terminal-canvas px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-terminal-accent flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Rehber &amp; Destek
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-terminal-muted hover:text-terminal-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-1.5 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                startTour(0);
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-terminal-text transition-colors hover:bg-terminal-accent/15 hover:text-terminal-accent"
            >
              <Compass className="h-4 w-4 text-terminal-accent" />
              <div>
                <div>İnteraktif Rehber</div>
                <div className="text-[10px] font-normal text-terminal-muted">Adım adım site tanıtım turu</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                openHelp("sections");
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-semibold text-terminal-text transition-colors hover:bg-terminal-accent/15 hover:text-terminal-accent"
            >
              <BookOpen className="h-4 w-4 text-sky-400" />
              <div>
                <div>Yardım &amp; Sözlük</div>
                <div className="text-[10px] font-normal text-terminal-muted">Bölümler ve finans terimleri</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                resetOnboarding();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-[11px] text-terminal-muted transition-colors hover:bg-terminal-bg hover:text-terminal-text"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Giriş Sorusunu Sıfırla</span>
            </button>
          </div>
        </div>
      )}

      {/* Main trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-1.5 rounded-full border border-terminal-border/80 bg-terminal-panel/95 px-3 py-1.5 text-xs font-semibold text-terminal-text shadow-xl backdrop-blur-md transition-all hover:border-terminal-accent hover:bg-terminal-panel hover:text-terminal-accent hover:shadow-terminal-accent/20"
        title="Yardım ve İnteraktif Rehber"
        aria-label="Yardım ve Rehber"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terminal-accent opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-terminal-accent" />
        </span>
        <HelpCircle className="h-4 w-4" />
        <span className="font-bold">Rehber &amp; Yardım</span>
      </button>
    </div>
  );
}
