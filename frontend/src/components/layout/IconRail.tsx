import { useContext, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Compass,
  HelpCircle,
  Home,
  TrendingUp,
  LineChart,
  Sparkles,
  Coins,
  Filter,
  Briefcase,
  Activity,
  Brain,
  Star,
  Newspaper,
  Settings,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { AuthContextRef } from "../../contexts/AuthContext";
import { SoftBridgeLogo } from "../common/SoftBridgeLogo";
import { useGuideStore } from "../guide/guideStore";

type RailItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  badge?: string;
};

const RAIL_ITEMS: RailItem[] = [
  { id: "home", label: "Ana Sayfa", icon: Home, to: "/home" },
  { id: "market", label: "Hisseler", icon: TrendingUp, to: "/equity/stocks" },
  { id: "umy", label: "Umay Token", icon: Sparkles, to: "/equity/umy", badge: "NEW" },
  { id: "crypto", label: "Kripto", icon: Coins, to: "/equity/crypto" },
  { id: "portfolio", label: "Portföy", icon: Briefcase, to: "/equity/portfolio" },
  { id: "wallet", label: "Cüzdan", icon: WalletCards, to: "/equity/wallet" },
  { id: "screener", label: "Tarayıcı", icon: Filter, to: "/equity/screener" },
  { id: "fno", label: "Vadeli", icon: Activity, to: "/fno" },
  { id: "watchlist", label: "İzleme", icon: Star, to: "/equity/watchlist" },
  { id: "news", label: "Haberler", icon: Newspaper, to: "/equity/news" },
  { id: "brain", label: "AI Beyin", icon: Brain, to: "/equity/brain" },
  { id: "settings", label: "Ayarlar", icon: Settings, to: "/equity/settings" },
];

export function IconRail() {
  const navigate = useNavigate();
  const authCtx = useContext(AuthContextRef);
  const user = authCtx?.user ?? null;
  const { startTour, openHelp } = useGuideStore();
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const items = useMemo(() => RAIL_ITEMS, []);

  const initials = useMemo(() => {
    if (!user?.email) return "U";
    const local = user.email.split("@")[0] || "";
    const bits = local.split(/[._-]+/).filter(Boolean);
    if (bits.length >= 2) return `${bits[0][0] || ""}${bits[1][0] || ""}`.toUpperCase();
    return (local.slice(0, 2) || "U").toUpperCase();
  }, [user?.email]);

  const focusIndex = (index: number) => {
    if (!items.length) return;
    const bounded = ((index % items.length) + items.length) % items.length;
    linkRefs.current[bounded]?.focus();
  };

  const onRailKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const focusedIndex = linkRefs.current.findIndex((el) => el === document.activeElement);
    if (focusedIndex < 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusIndex(focusedIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusIndex(focusedIndex - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusIndex(items.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = items[focusedIndex];
      if (item) {
        navigate(item.to);
      }
    }
  };

  return (
    <aside
      className="hidden h-full w-16 shrink-0 border-r border-terminal-border bg-terminal-panel md:flex md:flex-col shadow-sm select-none"
      aria-label="Primary icon rail"
      onKeyDown={onRailKeyDown}
    >
      <div className="flex items-center justify-center border-b border-terminal-border px-2 py-2.5">
        <SoftBridgeLogo size={26} />
      </div>
      <nav className="flex-1 space-y-1 overflow-auto p-1.5 scrollbar-thin">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              ref={(element) => {
                linkRefs.current[index] = element;
              }}
              to={item.to}
              aria-label={item.label}
              title={item.label}
              className={({ isActive }) =>
                [
                  "group flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-center outline-none transition-all duration-150",
                  "focus-visible:border-terminal-accent focus-visible:text-terminal-accent",
                  isActive
                    ? "border-terminal-accent/70 bg-terminal-accent/15 text-terminal-accent font-semibold shadow-sm"
                    : "border-transparent text-terminal-muted hover:border-terminal-border/70 hover:bg-terminal-border/25 hover:text-terminal-text hover:translate-x-0.5",
                ].join(" ")
              }
            >
              <div className="relative">
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] leading-tight font-medium tracking-tight truncate w-full text-center">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-terminal-border p-1.5 space-y-1.5">
        <button
          type="button"
          className="flex w-full flex-col items-center gap-0.5 rounded-lg border border-terminal-accent/50 bg-terminal-accent/10 px-1 py-1.5 text-center text-terminal-accent transition-all hover:bg-terminal-accent/25 hover:border-terminal-accent shadow-sm"
          onClick={() => startTour(0)}
          title="İnteraktif Tanıtım Rehberini Başlat"
        >
          <Compass className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-[8px] font-bold tracking-tight">REHBER</span>
        </button>
        <button
          type="button"
          className="flex w-full flex-col items-center gap-0.5 rounded-lg border border-terminal-border/80 bg-terminal-bg/40 px-1 py-1.5 text-center text-terminal-muted transition-all hover:border-terminal-text hover:text-terminal-text hover:bg-terminal-border/30"
          onClick={() => openHelp("sections")}
          title="Yardım ve Terimler Sözlüğü"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="text-[8px] font-medium tracking-tight">YARDIM</span>
        </button>
        <button
          type="button"
          className="w-full rounded-md border border-terminal-border/70 bg-terminal-bg/30 px-1 py-1 text-[9px] uppercase tracking-wider text-terminal-muted hover:border-terminal-accent hover:text-terminal-accent transition-colors"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
            );
          }}
          title="Komut Masası (Ctrl + K)"
        >
          ⌘ K
        </button>
        <button
          type="button"
          className="flex w-full flex-col items-center gap-1 rounded-lg border border-transparent px-1 py-1.5 text-terminal-muted hover:border-terminal-border/60 hover:bg-terminal-border/20 hover:text-terminal-text transition-all"
          onClick={() => navigate("/account")}
          title={user ? `${user.email} (${user.role})` : "Giriş yap"}
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-terminal-accent/40 bg-terminal-accent/10 text-[9px] font-bold text-terminal-accent shadow-sm">
            {user ? initials : "?"}
          </span>
          <span className="text-[8px] leading-tight truncate w-full text-center capitalize font-medium">
            {user ? user.role : "Giriş"}
          </span>
        </button>
      </div>
    </aside>
  );
}
