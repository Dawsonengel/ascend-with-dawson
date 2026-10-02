import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

type MembershipContextValue = {
  isPaid: boolean;
  hasPremiumAccess: boolean;
  setIsPaid: (next: boolean) => void;
  togglePaid: () => void;
  isAdmin: boolean;
  setIsAdmin: (next: boolean) => void;
  isDevPremiumOverride: boolean;
  setIsDevPremiumOverride: (next: boolean) => void;
};

const MembershipContext = createContext<MembershipContextValue | undefined>(undefined);
const DEV_PREMIUM_OVERRIDE_KEY = "devPremiumOverrideEnabled";

export function MembershipProvider({ children }: PropsWithChildren) {
  const [isPaid, setIsPaid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [isDevPremiumOverride, setIsDevPremiumOverride] = useState(false);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    let mounted = true;
    AsyncStorage.getItem(DEV_PREMIUM_OVERRIDE_KEY)
      .then((value) => {
        if (mounted) {
          setIsDevPremiumOverride(value === "true");
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    AsyncStorage.setItem(DEV_PREMIUM_OVERRIDE_KEY, String(isDevPremiumOverride)).catch(() => undefined);
  }, [isDevPremiumOverride]);

  const value = useMemo(
    () => ({
      isPaid,
      hasPremiumAccess: isPaid || (__DEV__ && isDevPremiumOverride),
      setIsPaid,
      togglePaid: () => setIsPaid((prev) => !prev),
      isAdmin,
      setIsAdmin,
      isDevPremiumOverride,
      setIsDevPremiumOverride,
    }),
    [isPaid, isAdmin, isDevPremiumOverride],
  );

  return <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>;
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error("useMembership must be used within a MembershipProvider");
  }
  return context;
}
