import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { RunningFox } from "./RunningFox";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Ana Masaya Koşuluyor...",
  "/home": "Ana Masaya Geçiliyor...",
  "/equity/stocks": "Hisse Masasına Koşuluyor...",
  "/equity/crypto": "Kripto Masasına Koşuluyor...",
  "/equity/umy": "Umay Token Merkezine Koşuluyor...",
  "/fno": "Vadeli & Opsiyon Masasına Geçiliyor...",
  "/equity/portfolio": "Portföy Masasına Koşuluyor...",
  "/equity/screener": "Hisse Tarayıcısına Koşuluyor...",
  "/equity/heatmap": "Piyasa Isı Haritasına Koşuluyor...",
  "/equity/chart-workstation": "Çalışma İstasyonuna Koşuluyor...",
  "/account": "Kullanıcı Profiline Koşuluyor...",
  "/settings": "Platform Ayarlarına Koşuluyor...",
};

export function RouteTransitionFox() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [currentLabel, setCurrentLabel] = useState("Sayfa Yükleniyor...");
  const isFirstRender = useRef(true);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Listen for custom trigger (e.g. from login or button clicks)
    const handleCustomTrigger = (e: Event) => {
      const detail = (e as CustomEvent<{ label?: string }>).detail;
      startTransition(detail?.label || "Platforma Bağlanıyor...");
    };

    window.addEventListener("sb-fox-transition", handleCustomTrigger);
    return () => {
      window.removeEventListener("sb-fox-transition", handleCustomTrigger);
    };
  }, []);

  const startTransition = (label: string) => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    setCurrentLabel(label);
    setVisible(true);
    setExiting(false);

    hideTimerRef.current = window.setTimeout(() => {
      setExiting(true);
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 250);
    }, 600);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Determine label for current route
    const label = ROUTE_LABELS[location.pathname] || "Sayfaya Geçiliyor...";
    startTransition(label);

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center transition-all duration-300 ${
        exiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
      aria-hidden="true"
    >
      {/* Gentle dark backdrop blur */}
      <div className="absolute inset-0 bg-[#06080c]/60 backdrop-blur-[3px]" />

      {/* Floating high-tech fox transition card */}
      <div className="relative z-10 flex flex-col items-center justify-center rounded-2xl border border-orange-500/30 bg-[#0b101b]/90 px-8 py-5 shadow-[0_12px_40px_rgba(249,115,22,0.25)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <RunningFox size="md" showTrack={true} showParticles={true} />
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-ping" />
          <span className="text-xs font-semibold tracking-wider text-orange-300">
            {currentLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export default RouteTransitionFox;
