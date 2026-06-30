// Typed view of the `window.__wnHarness` bag the shared vanilla scripts own.
// The scripts (public/shared/*.js) are the source of truth for the runtime
// shape; this is just a typed accessor so the Next/TSX side stays `any`-free.

// Host API captured by embed-bootstrap.js's onReady; methods optional — read
// defensively across widget versions.
export type WnHarnessWidgetApi = {
  open?: () => void;
  close?: () => void;
  submitUserMessage?: (msg: { text: string; meta?: Record<string, unknown> }) => Promise<void>;
};

export type WnHarness = {
  section?: { id: string; label: string };
  config?: Record<string, string>;
  configError?: string;
  onReadyFired?: boolean;
  embedInjected?: boolean;
  aiHelperCount?: number;
  cspNonce?: string;
  widgetApi?: WnHarnessWidgetApi;
  applyContext?: (groupingId: string, customContext?: Record<string, unknown>) => void;
  session?: {
    visitor?: { id?: string; kind?: string; visits?: number };
    appSession?: { id?: string; status?: string; user?: { email?: string } | null };
    actions?: {
      loginAs?: (email: string) => void;
      logout?: () => void;
      expireSession?: () => void;
      resetVisitor?: () => void;
      simulateReload?: () => void;
    };
  };
  consoleCollapsed?: boolean;
  __consoleInjected?: boolean;
  __sharedScriptsInjected?: boolean;
  onConfig?: () => void;
};

export function getWnHarness(): WnHarness {
  const w = window as unknown as { __wnHarness?: WnHarness };
  w.__wnHarness = w.__wnHarness ?? {};
  return w.__wnHarness;
}
