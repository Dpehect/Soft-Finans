import { create } from "zustand";

export type HelpTab = "sections" | "dictionary" | "shortcuts" | "start";

export interface GuideState {
  // Welcome onboarding prompt
  isWelcomePromptOpen: boolean;
  hasAnsweredWelcome: boolean;

  // Interactive Tour
  isTourOpen: boolean;
  currentTourStep: number;

  // Help & Knowledge Center
  isHelpOpen: boolean;
  activeHelpTab: HelpTab;

  // Actions
  answerWelcome: (knowsTerminal: boolean) => void;
  openWelcomePrompt: () => void;
  closeWelcomePrompt: () => void;

  startTour: (stepIndex?: number) => void;
  nextTourStep: (totalSteps: number) => void;
  prevTourStep: () => void;
  goToTourStep: (stepIndex: number) => void;
  closeTour: () => void;

  openHelp: (tab?: HelpTab) => void;
  closeHelp: () => void;
  setActiveHelpTab: (tab: HelpTab) => void;

  resetOnboarding: () => void;
}

const STORAGE_KEY = "sb_finans_onboarding_answered";

export const useGuideStore = create<GuideState>((set) => {
  // Check if user previously made a choice
  const hasAnswered = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) === "true" : false;

  return {
    // If user has not answered yet, show prompt on first load
    isWelcomePromptOpen: !hasAnswered,
    hasAnsweredWelcome: hasAnswered,

    isTourOpen: false,
    currentTourStep: 0,

    isHelpOpen: false,
    activeHelpTab: "sections",

    answerWelcome: (knowsTerminal: boolean) => {
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        // storage disabled or private mode
      }
      set({
        isWelcomePromptOpen: false,
        hasAnsweredWelcome: true,
        // If user doesn't know, automatically launch the tour!
        isTourOpen: !knowsTerminal,
        currentTourStep: 0,
      });
    },

    openWelcomePrompt: () => set({ isWelcomePromptOpen: true }),
    closeWelcomePrompt: () => set({ isWelcomePromptOpen: false }),

    startTour: (stepIndex = 0) =>
      set({
        isTourOpen: true,
        currentTourStep: stepIndex,
        isWelcomePromptOpen: false,
        isHelpOpen: false,
      }),

    nextTourStep: (totalSteps: number) =>
      set((state) => ({
        currentTourStep: Math.min(state.currentTourStep + 1, totalSteps - 1),
      })),

    prevTourStep: () =>
      set((state) => ({
        currentTourStep: Math.max(state.currentTourStep - 1, 0),
      })),

    goToTourStep: (stepIndex: number) =>
      set({
        currentTourStep: Math.max(0, stepIndex),
      }),

    closeTour: () => set({ isTourOpen: false }),

    openHelp: (tab = "sections") =>
      set({
        isHelpOpen: true,
        activeHelpTab: tab,
        isWelcomePromptOpen: false,
        isTourOpen: false,
      }),

    closeHelp: () => set({ isHelpOpen: false }),

    setActiveHelpTab: (tab: HelpTab) => set({ activeHelpTab: tab }),

    resetOnboarding: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      set({
        hasAnsweredWelcome: false,
        isWelcomePromptOpen: true,
        isTourOpen: false,
        currentTourStep: 0,
        isHelpOpen: false,
      });
    },
  };
});
