import {
  verifyTransaction,
  PLATFORM_WALLET_ADDRESS,
  CREATION_FEE_WEI,
} from "./arbitrum";

// x402 Payment Verification for Bounty Creation
// Implements HTTP 402 Payment Required flow

export interface PaymentRequirement {
  status: 402;
  message: string;
  paymentDetails: {
    recipient: string;
    amount: string;
    amountWei: string;
    chain: string;
    chainId: number;
  };
}

export interface PaymentVerificationResult {
  valid: boolean;
  error?: string;
  from?: string;
  amount?: bigint;
}

// Generate 402 Payment Required response
export function generatePaymentRequired(): PaymentRequirement {
  return {
    status: 402,
    message:
      "Payment Required. Send 0.001 ETH to platform wallet to create bounty.",
    paymentDetails: {
      recipient: PLATFORM_WALLET_ADDRESS,
      amount: "0.001",
      amountWei: CREATION_FEE_WEI.toString(),
      chain: "Arbitrum Sepolia",
      chainId: 421614,
    },
  };
}

// Verify payment transaction for bounty creation
export async function verifyCreationPayment(
  txHash: `0x${string}`,
  expectedSender: string
): Promise<PaymentVerificationResult> {
  try {
    const result = await verifyTransaction(txHash);

    if (!result.success) {
      return {
        valid: false,
        error: result.error || "Transaction verification failed",
      };
    }

    // Verify sender matches expected address
    if (result.from?.toLowerCase() !== expectedSender.toLowerCase()) {
      return {
        valid: false,
        error: "Transaction sender does not match connected wallet",
      };
    }

    // Verify recipient is platform wallet
    if (result.to?.toLowerCase() !== PLATFORM_WALLET_ADDRESS.toLowerCase()) {
      return {
        valid: false,
        error: "Transaction recipient is not the platform wallet",
      };
    }

    // Verify amount is at least the creation fee
    if (result.value === undefined || result.value < CREATION_FEE_WEI) {
      return {
        valid: false,
        error: `Insufficient payment. Required: ${CREATION_FEE_WEI}, Got: ${result.value}`,
      };
    }

    return {
      valid: true,
      from: result.from,
      amount: result.value,
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Payment verification failed",
    };
  }
}

// Client-side: Build transaction params for creation payment
export function buildCreationPaymentTx(): {
  to: `0x${string}`;
  value: bigint;
  chainId: number;
} {
  return {
    to: PLATFORM_WALLET_ADDRESS,
    value: CREATION_FEE_WEI,
    chainId: 421614,
  };
}
