/**
 * Telegram notification utility for BountyX
 * Sends alerts to creator's bot channel
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export interface TelegramNotificationResult {
  success: boolean;
  error?: string;
}

/**
 * Send a notification to Telegram
 * @param message - The message to send (supports Telegram MarkdownV2)
 */
export async function notifyTelegram(
  message: string
): Promise<TelegramNotificationResult> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram credentials not configured - skipping notification");
    return {
      success: false,
      error: "Telegram credentials not configured",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || "Telegram API error");
    }

    console.log("Telegram notification sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format and send a new submission notification
 */
export async function notifyNewSubmission(
  bountyTitle: string,
  bountyId: string,
  hunterAddress: string,
  prize: string
): Promise<TelegramNotificationResult> {
  const message = `
🎯 <b>NEW SUBMISSION ON BOUNTYX</b>

<b>Bounty:</b> ${escapeHtml(bountyTitle)}
<b>Prize:</b> ${prize} ETH
<b>Hunter:</b> <code>${hunterAddress}</code>

<a href="https://bountyx.app/bounties/${bountyId}">View Submission →</a>
`;

  return notifyTelegram(message);
}

/**
 * Format and send a payout notification
 */
export async function notifyPayout(
  bountyTitle: string,
  winnerAddress: string,
  prize: string,
  txHash: string
): Promise<TelegramNotificationResult> {
  const message = `
💰 <b>BOUNTY PAID ON BOUNTYX</b>

<b>Bounty:</b> ${escapeHtml(bountyTitle)}
<b>Amount:</b> ${prize} ETH
<b>Winner:</b> <code>${winnerAddress}</code>
<b>TX:</b> <code>${txHash}</code>

Another one shipped! 🚀
`;

  return notifyTelegram(message);
}

/**
 * Escape HTML special characters for Telegram
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
