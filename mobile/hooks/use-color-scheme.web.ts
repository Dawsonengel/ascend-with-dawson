import { useColorScheme as useRNColorScheme } from "react-native";

import { useAppTheme } from "@/components/Theme";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const rnScheme = useRNColorScheme();
  const { resolvedScheme } = useAppTheme();
  return resolvedScheme ?? rnScheme ?? "light";
}
