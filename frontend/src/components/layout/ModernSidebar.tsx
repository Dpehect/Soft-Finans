import { useContext, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Brain,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  Filter,
  HelpCircle,
  Home,
  Layers,
  LineChart,
  LogOut,
  Newspaper,
  Settings,
  Sparkles,
  Star,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AuthContextRef } from "../../contexts/AuthContext";
import { SoftBridgeLogo } from "../common/SoftBridgeLogo";
import { UmayFoxLogo } from "../crypto/UmayFoxLogo";
import { useGuideStore } from "../guide/guideStore";
import { useTranslation } from "../../lib/i18n";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  badge?: string;
  badgeColor?: string;
  isUmay?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function ModernSidebar() {
  const navigate = useNavigate();
  const authCtx = useContext(AuthContextRef);
  const user = authCtx?.user ?? null;
  const logout = authCtx?.logout;
  const { startTour, openHelp } = useGuideStore();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("ot_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ot_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: "ANA MASALAR",
        items: [
          { id: "home", label: t("home", "Ana Sayfa"), icon: Home, to: "/home" },
          {
            id: "umy",
            label: "Umay (UMY)",
            icon: Sparkles,
            to: "/equity/umy",
            badge: "+24%",
            badgeColor: "bg-gradient-to-r from-amber-500 to-cyan-400 text-slate-950 font-black",
            isUmay: true,
          },
          { id: "stocks", label: t("stocks", "Hisseler"), icon: TrendingUp, to: "/equity/stocks" },
          { id: "crypto", label: t("crypto", "Kripto Piyasaları"), icon: Coins, to: "/equity/crypto" },
          { id: "portfolio", label: t("portfolio", "Portföy Masası"), icon: Briefcase, to: "/equity/portfolio" },
        ],
      },
      {
        title: "ANALİZ & RADAR",
        items: [
          { id: "screener", label: t("screener", "Varlık Tarayıcısı"), icon: Filter, to: "/equity/screener" },
          { id: "fno", label: t("fno", "Vadeli & Opsiyon"), icon: Activity, to: "/fno" },
          { id: "compare", label: t("compare", "Kıyaslama"), icon: BarChart3, to: "/equity/compare" },
          { id: "heatmap", label: t("heatmap", "Isı Haritası"), icon: Layers, to: "/equity/heatmap" },
          { id: "news", label: t("news", "Canlı Haberler"), icon: Newspaper, to: "/equity/news" },
          { id: "watchlist", label: t("watchlist", "İzleme Listesi"), icon: Star, to: "/equity/watchlist" },
        ],
      },
      {
        title: "GELİŞMİŞ LAB",
        items: [
          { id: "brain", label: "AI Finans Analisti", icon: Brain, to: "/equity/intelligence-timeline" },
          { id: "chart-workstation", label: "Grafik İstasyonu", icon: LineChart, to: "/equity/chart-workstation" },
          { id: "backtesting", label: "Backtest Lab", icon: Sparkles, to: "/backtesting" },
          { id: "settings", label: t("settings", "Ayarlar"), icon: Settings, to: "/equity/settings" },
        ],
      },
    ],
    [t],
  );

  const initials = useMemo(() => {
    if (!user?.email) return "SB";
    const local = user.email.split("@")[0] || "";
    const bits = local.split(/[._-]+/).filter(Boolean);
    if (bits.length >= 2) return `${bits[0][0] || ""}${bits[1][0] || ""}`.toUpperCase();
    return (local.slice(0, 2) || "SB").toUpperCase();
  }, [user?.email]);

  return (
    <aside
      className={`relative hidden h-full shrink-0 border-r border-terminal-border bg-terminal-panel md:flex md:flex-col shadow-sm select-none transition-all duration-200 z-30 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
      aria-label="Ana Gezinme Menüsü"
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-terminal-border/80 px-3.5">
        <NavLink to="/home" className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500/20 via-sky-500/10 to-amber-500/20 border border-orange-500/30 shadow-xs">
            <SoftBridgeLogo size={22} className="shrink-0" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-terminal-panel" />
          </div>
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wider bg-gradient-to-r from-sky-500 via-indigo-400 to-amber-400 bg-clip-text text-transparent">
                SOFTBRIDGE
              </span>
              <span className="text-[10px] font-semibold text-terminal-muted leading-none">
                Finans & Kripto
              </span>
            </div>
          ) : null}
        </NavLink>

        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-terminal-border/70 bg-terminal-bg/50 text-terminal-muted hover:border-terminal-accent hover:text-terminal-accent transition-colors"
          title={collapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          aria-label={collapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed ? (
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-terminal-muted/80">
                {group.title}
              </p>
            ) : (
              <div className="my-1 border-t border-terminal-border/50" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-150 relative",
                      isActive
                        ? item.isUmay
                          ? "bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-400 border border-amber-500/40 shadow-xs font-bold"
                          : "bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30 shadow-xs font-bold"
                        : item.isUmay
                        ? "text-amber-500/90 hover:bg-amber-500/10 hover:text-amber-400 border border-transparent"
                        : "text-terminal-muted hover:bg-terminal-bg/80 hover:text-terminal-text border border-transparent",
                      collapsed ? "justify-center px-0" : "",
                    ].join(" ")
                  }
                >
                  {item.isUmay ? (
                    <UmayFoxLogo size={18} className="shrink-0 transition-transform duration-150 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                  ) : (
                    <Icon
                      className="shrink-0 transition-transform duration-150 group-hover:scale-110 h-4 w-4"
                    />
                  )}

                  {!collapsed ? (
                    <span className="flex-1 truncate leading-tight">{item.label}</span>
                  ) : null}

                  {item.badge && !collapsed ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wide shrink-0 ${
                        item.badgeColor || "bg-terminal-accent/20 text-terminal-accent"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : item.badge && collapsed ? (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Interactive Actions & User Profile */}
      <div className="border-t border-terminal-border/80 p-2.5 space-y-2">
        {/* Guide & Help Quick Links */}
        {!collapsed ? (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => startTour(0)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-terminal-accent/40 bg-terminal-accent/10 px-2 py-1.5 text-[11px] font-bold text-terminal-accent hover:bg-terminal-accent/20 transition-all shadow-xs"
              title="İnteraktif Tanıtım Rehberini Başlat"
            >
              <Compass className="h-3 w-3 animate-pulse" />
              <span>{t("guide", "REHBER")}</span>
            </button>
            <button
              type="button"
              onClick={() => openHelp("sections")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-bg/60 px-2 py-1.5 text-[11px] font-medium text-terminal-text hover:border-terminal-accent/60 transition-all"
              title="Yardım ve Terimler Sözlüğü"
            >
              <HelpCircle className="h-3 w-3" />
              <span>{t("help", "YARDIM")}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => startTour(0)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-terminal-accent/40 bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 transition-all"
              title="Rehber"
            >
              <Compass className="h-4 w-4 animate-pulse" />
            </button>
            <button
              type="button"
              onClick={() => openHelp("sections")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-terminal-border bg-terminal-bg/60 text-terminal-text hover:border-terminal-accent/60 transition-all"
              title="Yardım"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* User Profile Card */}
        <div className="flex items-center justify-between rounded-xl border border-terminal-border/80 bg-terminal-bg/40 p-2">
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="flex items-center gap-2 overflow-hidden text-left focus:outline-none flex-1"
            title={user?.email || "Hesap"}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-xs">
              {initials}
            </span>
            {!collapsed ? (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-terminal-text truncate leading-tight">
                  {user?.email?.split("@")[0] || "Yunus Emre"}
                </span>
                <span className="text-[10px] text-terminal-muted capitalize">
                  {user?.role || "Trader"}
                </span>
              </div>
            ) : null}
          </button>

          {!collapsed && logout ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="p-1 text-terminal-muted hover:text-rose-500 transition-colors"
              title="Çıkış Yap"
              aria-label="Çıkış Yap"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
