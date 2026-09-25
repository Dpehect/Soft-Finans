import React from "react";
import { useLocation } from "react-router-dom";
import { WelcomePromptModal } from "./WelcomePromptModal";
import { InteractiveTourModal } from "./InteractiveTourModal";
import { HelpCenterModal } from "./HelpCenterModal";
import { FloatingHelpWidget } from "./FloatingHelpWidget";

export function TerminalGuideManager() {
  const location = useLocation();
  const isAuthRoute =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-access";

  if (isAuthRoute) return null;

  return (
    <>
      <WelcomePromptModal />
      <InteractiveTourModal />
      <HelpCenterModal />
      <FloatingHelpWidget />
    </>
  );
}

export { useGuideStore } from "./guideStore";
