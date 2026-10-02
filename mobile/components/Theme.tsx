import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from "@react-navigation/native";
import {
  Animated,
  Appearance,
  ColorSchemeName,
  StyleSheet,
} from "react-native";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const THEME_STORAGE_KEY = "appearance:theme-preference";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const lightColors: AppThemeColors = {
  background: "#F7F7F8",
  card: "#FFFFFF",
  border: "rgba(15,23,42,0.12)",
  text: "#0F172A",
  mutedText: "rgba(15,23,42,0.74)",
  subtleText: "rgba(15,23,42,0.56)",
  primaryButton: "#0F172A",
  primaryButtonText: "#F8FAFC",
  accent: "#6E7F95",
} as const;

const darkColors: AppThemeColors = {
  background: "#0E0E0E",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  text: "#F5F5F5",
  mutedText: "rgba(245,245,245,0.72)",
  subtleText: "rgba(245,245,245,0.56)",
  primaryButton: "#F5F5F5",
  primaryButtonText: "#0E0E0E",
  accent: "#9FB2C8",
} as const;

export type AppThemeColors = {
  background: string;
  card: string;
  border: string;
  text: string;
  mutedText: string;
  subtleText: string;
  primaryButton: string;
  primaryButtonText: string;
  accent: string;
};

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedScheme: ResolvedTheme;
  colors: AppThemeColors;
  navigationTheme: NavigationTheme;
  setPreference: (next: ThemePreference) => Promise<void>;
  isReady: boolean;
};

const defaultValue: ThemeContextValue = {
  preference: "system",
  resolvedScheme: "dark",
  colors: darkColors,
  navigationTheme: NavigationDarkTheme,
  setPreference: async () => {},
  isReady: false,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

function toResolvedScheme(preference: ThemePreference, systemScheme: ColorSchemeName): ResolvedTheme {
  if (preference === "dark") {
    return "dark";
  }
  if (preference === "light") {
    return "light";
  }
  return systemScheme === "light" ? "light" : "dark";
}

function toNavigationTheme(colors: AppThemeColors, scheme: ResolvedTheme): NavigationTheme {
  const base = scheme === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      border: colors.border,
      primary: colors.accent,
      text: colors.text,
      notification: colors.accent,
    },
  };
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [isReady, setIsReady] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;

    const hydratePreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!mounted || !stored) {
          return;
        }

        if (stored === "system" || stored === "light" || stored === "dark") {
          setPreferenceState(stored);
        }
      } catch (error) {
        console.error("[Theme] Failed to load preference", error);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    };

    void hydratePreference();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const resolvedScheme = useMemo(
    () => toResolvedScheme(preference, systemScheme),
    [preference, systemScheme]
  );
  const colors = resolvedScheme === "dark" ? darkColors : lightColors;
  const navigationTheme = useMemo(
    () => toNavigationTheme(colors, resolvedScheme),
    [colors, resolvedScheme]
  );

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, resolvedScheme]);

  const setPreference = async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.error("[Theme] Failed to save preference", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        preference,
        resolvedScheme,
        colors,
        navigationTheme,
        setPreference,
        isReady,
      }}
    >
      <Animated.View style={[styles.appRoot, { opacity: fade }]}>{children}</Animated.View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

// Backward-compatible export for files that still import `theme`.
export const theme = {
  colors: darkColors,
} as const;

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
});
