import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Carregar tema do localStorage ou usar 'dark' como padrão
    const savedTheme = localStorage.getItem('editor-theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Salvar tema no localStorage quando mudar
    localStorage.setItem('editor-theme', theme);
    
    // Aplicar classe no documento para tema light
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: 'dark', setTheme: () => {}, toggleTheme: () => {} };
  }
  return context;
};

