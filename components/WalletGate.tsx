"use client";

import { ReactNode } from "react";
import { BrutalButton } from "./BrutalButton";
import { BrutalCard } from "./BrutalCard";

interface WalletGateProps {
  children: ReactNode;
  isConnected: boolean;
  onConnect: () => void;
  title?: string;
  description?: string;
}

export function WalletGate({
  children,
  isConnected,
  onConnect,
  title = "WALLET REQUIRED",
  description = "CONNECT YOUR WALLET TO ACCESS THIS FEATURE",
}: WalletGateProps) {
  if (isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <BrutalCard
        variant="default"
        padding="lg"
        className="max-w-md text-center"
      >
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-brutal-black flex items-center justify-center border-4 border-brutal-black">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-black uppercase mb-2">{title}</h2>
          <p className="font-bold text-sm uppercase text-gray-600">
            {description}
          </p>
        </div>
        <BrutalButton variant="primary" size="lg" fullWidth onClick={onConnect}>
          CONNECT WALLET
        </BrutalButton>
        <p className="mt-4 text-xs font-bold uppercase text-gray-500">
          POWERED BY PRIVY • BASE SEPOLIA
        </p>
      </BrutalCard>
    </div>
  );
}
