import * as React from "react";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";

function useTheme(): ThemeContextValue {
    const ctx = React.useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return ctx;
}

export { useTheme };
