import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Always use light mode - no dark mode option
  const isDark = false;

  useEffect(() => {
    // Always apply light mode
    document.documentElement.classList.add('light-mode');
    document.documentElement.classList.remove('dark-mode');
  }, []);

  // Keep toggleTheme function for API compatibility, but it does nothing
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
