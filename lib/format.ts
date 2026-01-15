/**
 * Format USDC values to a readable format
 * e.g., "1000.50" -> "1,000.50 USDC"
 */
export function formatUSDC(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "0 USDC";

  // Handle very small numbers (between 0 and 0.01)
  if (numValue > 0 && numValue < 0.01) {
    return "< 0.01 USDC";
  }
  
  // Remove trailing zeros and unnecessary decimals
  const formatted = numValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2, // Standard currency display
  });
  
  return `${formatted} USDC`;
}

/**
 * Truncate long numbers for display
 * e.g., "0.001000000000000000" -> "0.001"
 */
export function truncateNumber(value: string | number, decimals: number = 6): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return "0";
  
  return numValue.toFixed(decimals).replace(/\.?0+$/, "");
}
