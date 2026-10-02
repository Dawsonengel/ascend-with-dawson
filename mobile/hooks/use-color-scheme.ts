import { useColorScheme as useRNColorScheme } from "react-native";

import { useAppTheme } from "@/components/Theme";

export function useColorScheme() {
  const rnScheme = useRNColorScheme();
  const { resolvedScheme } = useAppTheme();
  return resolvedScheme ?? rnScheme ?? "light";
}
