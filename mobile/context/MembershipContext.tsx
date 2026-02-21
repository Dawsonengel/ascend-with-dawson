import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type MembershipContextValue = {
  isPaid: boolean;
  setIsPaid: (next: boolean) => void;
  togglePaid: () => void;
  isAdmin: boolean;
  setIsAdmin: (next: boolean) => void;
};

const MembershipContext = createContext<MembershipContextValue | undefined>(undefined);

export function MembershipProvider({ children }: PropsWithChildren) {
  const [isPaid, setIsPaid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  const value = useMemo(
    () => ({
      isPaid,
      setIsPaid,
      togglePaid: () => setIsPaid((prev) => !prev),
      isAdmin,
      setIsAdmin,
    }),
    [isPaid, isAdmin],
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
