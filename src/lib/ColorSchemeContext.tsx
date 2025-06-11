"use client";

import { createContext, useContext, useState } from "react";

type ColorScheme = "fire" | "blue" | "green";

const ThemeColorContext = createContext<{
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}>({
  colorScheme: "fire",
  setColorScheme: () => {},
});

export const ThemeColorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("fire");

  return (
    <ThemeColorContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeColorContext.Provider>
  );
};

export const useThemeColor = () => useContext(ThemeColorContext);
