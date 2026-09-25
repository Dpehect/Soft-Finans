import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
  Lightbulb,
  ExternalLink,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { useGuideStore } from "./guideStore";
import { TOUR_STEPS } from "./tourSteps";

export function InteractiveTourModal() {
  const navigate = useNavigate();
  const {
    isTourOpen,
    currentTourStep,
    nextTourStep,
    prevTourStep,
    goToTourStep,
    closeTour,
    openHelp,
  } = useGuideStore();

  const totalSteps = TOUR_STEPS.length;
  const step = TOUR_STEPS[currentTourStep] || TOUR_STEPS[0];
  const isFirst = currentTourStep === 0;
  const isLast = currentTourStep === totalSteps - 1;
  const progressPercent = Math.round(((currentTourStep + 1) / totalSteps) * 100);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeTour();
      } else if (e.key === "ArrowRight") {
        nextTourStep(totalSteps);
      } else if (e.key === "ArrowLeft") {
        prevTourStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourOpen, nextTourStep, prevTourStep, closeTour, totalSteps]);

  if (!isTourOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center bg-slate-900/35 dark:bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-terminal-accent/50 bg-terminal-panel shadow-2xl ring-1 ring-terminal-accent/30">
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-terminal-border/60">
          <div
            className="h-full bg-gradient-to-r from-terminal-accent via-sky-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal content */}
        <div className="p-6">
          {/* Top header strip */}
          <div className="flex items-center justify-between border-b border-terminal-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center gap-1 rounded bg-terminal-accent/15 px-2 text-[10px] font-bold uppercase tracking-wider text-terminal-accent">
                <Compass className="h-3.5 w-3.5" />
                {step.category}
              </span>
              <span className="text-xs font-mono text-terminal-muted">
                Adım {currentTourStep + 1} / {totalSteps}
              </span>
            </div>

            <button
              onClick={closeTour}
              className="rounded p-1 text-terminal-muted transition-colors hover:bg-terminal-bg hover:text-terminal-text"
              aria-label="Turu Kapat"
              title="Turu Kapat (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title & Body */}
          <div className="my-5">
            <h3 id="tour-step-title" className="text-lg font-bold text-terminal-text sm:text-xl">
              {step.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-terminal-text/90 whitespace-pre-line">
              {step.description}
            </p>
          </div>

          {/* Beginner Pro-Tip Card */}
          {step.beginnerTip && (
            <div className="mb-5 flex items-start gap-2.5 rounded border border-terminal-border bg-terminal-bg/80 p-3 text-xs leading-relaxed text-terminal-muted">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold text-terminal-text">İpucu: </span>
                {step.beginnerTip}
              </div>
            </div>
          )}

          {/* Optional Action / Navigate Button */}
          {step.pageLink && (
            <div className="mb-5">
              <button
                type="button"
                onClick={() => {
                  navigate(step.pageLink!.path);
                }}
                className="inline-flex items-center gap-1.5 rounded border border-terminal-accent/40 bg-terminal-accent/10 px-3 py-1.5 text-xs font-semibold text-terminal-accent transition-colors hover:bg-terminal-accent/20"
              >
                <span>{step.pageLink.label}</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Step dots */}
          <div className="mb-6 flex items-center justify-center gap-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => goToTourStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentTourStep
                    ? "w-6 bg-terminal-accent"
                    : "w-2 bg-terminal-border hover:bg-terminal-muted"
                }`}
                title={`Adım ${idx + 1}: ${s.category}`}
                aria-label={`Adım ${idx + 1}`}
              />
            ))}
          </div>

          {/* Bottom Buttons */}
          <div className="flex items-center justify-between border-t border-terminal-border/60 pt-4">
            <button
              type="button"
              onClick={prevTourStep}
              disabled={isFirst}
              className={`inline-flex items-center gap-1 rounded border border-terminal-border px-3 py-1.5 text-xs font-medium transition-colors ${
                isFirst
                  ? "opacity-30 cursor-not-allowed text-terminal-muted"
                  : "text-terminal-text hover:bg-terminal-bg hover:border-terminal-text/40"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Önceki</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  closeTour();
                  openHelp("sections");
                }}
                className="hidden sm:inline-flex items-center gap-1 text-xs text-terminal-muted hover:text-terminal-accent"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Sözlüğü Aç</span>
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={closeTour}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-500 px-4 py-1.5 text-xs font-bold text-black shadow-md transition-all hover:bg-emerald-400"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Turu Tamamla</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => nextTourStep(totalSteps)}
                  className="inline-flex items-center gap-1.5 rounded bg-terminal-accent px-4 py-1.5 text-xs font-bold text-black shadow-md transition-all hover:bg-terminal-accent-hover"
                >
                  <span>Sonraki</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
