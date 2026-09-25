import { useEffect } from "react";

import { useSettingsStore } from "../../store/settingsStore";

export function ThemeRuntime() {
  const themeVariant = useSettingsStore((s) => s.themeVariant);
  const customAccentColor = useSettingsStore((s) => s.customAccentColor);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-ot-theme", themeVariant);
    root.style.setProperty("--ot-custom-accent", customAccentColor);
    if (themeVariant === "dark" || themeVariant === "classic-bloomberg") {
      root.classList.add("dark");
      root.style.setProperty("color-scheme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.setProperty("color-scheme", "light");
    }
  }, [themeVariant, customAccentColor]);

  return null;
}
