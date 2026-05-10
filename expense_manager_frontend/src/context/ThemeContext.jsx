import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("theme");
        return saved ? saved === "dark" : true; // default to dark
    });

    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.remove("light");
        } else {
            html.classList.add("light");
        }
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    function toggleTheme() {
        setIsDark(prev => !prev);
    }

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
