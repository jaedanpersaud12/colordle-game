"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { getReadableTextColor } from "@/lib/color-utils";

interface ThemeContextType {
  profileColor: string | null;
  textColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  profileColor: null,
  textColor: "#000000",
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: dbUser } = trpc.auth.getCurrentUser.useQuery();
  const [textColor, setTextColor] = useState("#000000");

  useEffect(() => {
    if (dbUser?.profileColor) {
      // Update CSS custom properties
      document.documentElement.style.setProperty(
        "--user-primary-color",
        dbUser.profileColor
      );

      const calculatedTextColor = getReadableTextColor(dbUser.profileColor);
      document.documentElement.style.setProperty(
        "--user-primary-text-color",
        calculatedTextColor
      );
      setTextColor(calculatedTextColor);
    } else {
      // Use default primary color from tailwind
      document.documentElement.style.removeProperty("--user-primary-color");
      document.documentElement.style.removeProperty("--user-primary-text-color");
    }
  }, [dbUser?.profileColor]);

  return (
    <ThemeContext.Provider
      value={{
        profileColor: dbUser?.profileColor ?? null,
        textColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
