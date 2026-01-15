# BOUNTYX

**The Trustless Bounty Marketplace on Arbitrum.**

BountyX is a decentralized platform where builders compete for bounties, and creators pay instantly using onchain protocols. We replace the "middleman trust" of Web2 freelancing with "cryptographic truth."

---

## ⚡ Core Features

### 🔐 Trustless x402 Payments
BountyX uses the **x402 Protocol** (HTTP 402 Payment Required) to treat payments as native web primitives.
*   **Pre-Funded Escrow**: When a creator posts a bounty, the full prize pool is locked onchain in USDC. No "I'll pay you later."
*   **Instant Settlement**: Winners are paid programmatically in USDC on Arbitrum Sepolia. Payouts take seconds, not weeks.
*   **Zero Fees**: We don't take a 20% cut. You pay verified network gas and a minimal protocol fee.

### 🛡️ Protocol Hardening (Security)
The platform is built to resist economic exploits and trust leaks.
*   **Strict Funding Integrity**: The backend enforces a strict equality check (`AmountPaid === Sum(Prizes) + Fee`). Every cent is accounted for before a bounty goes live.
*   **Submission Anchoring**: Every submission is hashed (`SHA-256`) and anchored to the current Arbitrum block number. This proves *exactly* what was submitted and *when*, preventing timestamp spoofing or retroactive edits.
*   **Clawback Mechanism**: Creators can cancel and refund their own bounties if they are expired (> 30 days) or have zero interaction, protecting their funds from being stuck in dead bounties.

### 🏆 Multi-Prize Architecture
Not just "winner takes all." BountyX supports complex prize structures.
*   **Prize Tiers**: Creators can define multiple winners (e.g., 1st Place: $1000, 2nd: $500, 3rd: $200).
*   **Flexibility**: Perfect for hackathons, design contests, or audit contests where multiple contributions add value.

### 👤 Onchain Reputation V2
A meritocratic identity system that rewards skill, not just volume.
*   **Weighted Reputation Score**: Your score isn't just points. It's calculated as `Total Earnings × Win Rate`. This penalizes spammers who submit low-quality work (low win rate) and rewards consistent high-performers.
*   **Verified Badge**: Pro-hunters with a Reputation Score > 500 receive a protocol verification badge (✓), signaling reliability to creators.
*   **Public Profiles**: All history—created bounties, wins, and losses—is public and onchain.

### 🤖 Auditable AI Evaluation
We use **Gemini 2.0 Flash** to provide instant, objective feedback on submissions.
*   **Code Analysis**: AI reviews code for security, efficiency, and cleanliness immediately upon submission.
*   **Transparent Logs**: Unlike "black box" algorithms, every AI review, prompt, and reasoning score is logged to a public database table. You can audit exactly *why* the AI gave a certain score.

---

## 🏗️ Technical Architecture

BountyX is built on a modern "Local-First, Cloud-Last" stack:

-   **Frontend**: Next.js 14 (App Router) with TypeScript.
-   **Styling**: **Neo-Brutalism**. Hard shadows, thick borders, high-contrast colors (Neon Green/Pink). Designed for maximum clarity.
-   **Auth**: **Privy** for seamless embedded wallets. Login with Email/Socials, get a wallet instantly.
-   **Database**: **Supabase** (PostgreSQL) with Row Level Security (RLS).
-   **Chain**: **Arbitrum Sepolia** testnet.

---

## 🚀 Getting Started

### Installation
```bash
# 1. Clone the repo
git clone https://github.com/yourusername/bountyx.git

# 2. Install dependencies
npm install

# 3. Setup Environment
# Copy .env.example to .env.local and fill in your keys (Privy, Supabase, Gemini)
```

### Running Locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📜 License
MIT Open Source. Built for the **Arbitrum** ecosystem.
