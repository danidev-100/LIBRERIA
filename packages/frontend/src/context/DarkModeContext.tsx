import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface DarkModeContextType {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | null>(null);

const STORAGE_KEY = "darkMode";

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";
  } catch {
    // localStorage unavailable
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyDarkClass(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(getInitialDark);

  // Apply class on mount and on change
  useEffect(() => {
    applyDarkClass(isDark);
  }, [isDark]);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(e: MediaQueryListEvent) {
      // Only follow system if user hasn't manually set a preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        setIsDark(e.matches);
      }
    }
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  return (
    <DarkModeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode(): DarkModeContextType {
  const ctx = useContext(DarkModeContext);
  if (!ctx) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return ctx;
}
