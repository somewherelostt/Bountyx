"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PRIVY_APP_ID, privyConfig } from "@/lib/privy";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Wrap children in a fragment with a key to avoid React warnings
  // The key warning is likely from Privy's internal rendering, but this helps
  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <>{children}</>
    </PrivyProvider>
  );
}
