import * as React from "react";
import { ThemeContext, type Theme } from "./ThemeContext";


const STORAGE_KEY = "ems-theme";

function getSystemTheme(): "light" | "dark" {
    if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }
    return "light";
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    const resolved = theme === "system" ? getSystemTheme() : theme;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
}

export default function ThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [theme, setThemeState] = React.useState<Theme>(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return stored ?? "light";
    });

    const isDark = React.useMemo(() => {
        if (theme === "system") {
            return getSystemTheme() === "dark";
        }
        return theme === "dark";
    }, [theme]);

    React.useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    React.useEffect(() => {
        if (theme !== "system") {
            return undefined;
        }
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => applyTheme("system");
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = React.useCallback((newTheme: Theme) => {
        localStorage.setItem(STORAGE_KEY, newTheme);
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}
