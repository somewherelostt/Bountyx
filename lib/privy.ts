import { PrivyClientConfig } from "@privy-io/react-auth";
import { arbitrumSepolia } from "./arbitrum";

// Privy App ID from environment
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

// Privy configuration for BountyX
export const privyConfig: PrivyClientConfig = {
  // Appearance - Brutal theme
  appearance: {
    theme: "light",
    accentColor: "#00FF00", // Brutal green
    logo: undefined, // Use text logo
    showWalletLoginFirst: true,
  },
  // Login methods
  loginMethods: ["email", "wallet", "google"],
  // Embedded wallet configuration
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  // Default chain
  defaultChain: arbitrumSepolia,
  // Supported chains
  supportedChains: [arbitrumSepolia],
};

// Type for wallet with address
export interface ConnectedWallet {
  address: string;
  chainId: number;
}
