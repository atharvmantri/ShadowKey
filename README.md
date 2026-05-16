# ShadowKey — Zero-Knowledge Authentication Layer

> Prove you are who you say you are — without revealing your identity, wallet address, or transaction history.

**[Live Demo →](https://shadowkey.nebula.builders)** · **[MLH Midnight Hackathon 2026](https://hackathon.midnight.network/)**

## What is ShadowKey?

ShadowKey is a **fully private authentication system** built on the Midnight Network. Instead of exposing credentials, passwords, or wallet signatures, users generate **zero-knowledge proofs** that attest to their identity — and nothing more.

### The Problem

Traditional authentication leaks data:
- **OAuth** shares your profile with every relying party
- **Wallet signatures** publicly link your address to every login
- **Password databases** are honeypots for attackers

### The ShadowKey Solution

1. **Register** — Generate a ZK credential tied to your wallet, stored on-chain as a commitment
2. **Prove** — Generate a proof that you hold a valid credential, without revealing which one
3. **Verify** — Any service can verify the proof against the contract, with zero data exposure

All proof generation happens **client-side**. No trusted servers. No data collection. No tracking.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Lace Wallet  │──▶│  ShadowKey   │──▶│  ZK Proof Generator  │ │
│  │  (Signing)    │   │    UI        │   │  (client-side WASM)  │ │
│  └──────────────┘   └──────────────┘   └──────────┬───────────┘ │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                                    ┌───────────────▼─────────────┐
                                    │    Midnight Network         │
                                    │  ┌───────────────────────┐  │
                                    │  │  ShadowKey Contract   │  │
                                    │  │  (Compact / ZK Logic) │  │
                                    │  └───────────────────────┘  │
                                    │              ▲              │
                                    │  ┌───────────┴───────────┐  │
                                    │  │   Proof Server        │  │
                                    │  │   (Docker / Groth16)  │  │
                                    │  └───────────────────────┘  │
                                    └─────────────────────────────┘
```

### Data Flow

```
REGISTER:  Wallet ──sign──▶ UI ──deploy tx──▶ Contract ──store commitment──▶ On-chain registry
PROVE:     Wallet ──sign──▶ UI ──generate proof──▶ Proof Server ──verify──▶ Contract
VERIFY:    UI ──query contract──▶ Check proof validity ──return result──▶ User
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contract** | Compact 0.31.0 (Midnight's ZK DSL) |
| **Proof System** | Groth16 via Midnight Proof Server |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind + shadcn/ui |
| **Wallet** | Lace Wallet (Midnight Preview) |
| **Network** | Midnight Preview (testnet) |
| **CLI** | Node.js + Midnight SDK |
| **Animations** | Framer Motion |

## Quick Start

### Prerequisites

- **Node.js** v23+ and **npm** v11+
- **Docker** (for local proof server)
- **Lace Wallet** — [Chrome Web Store](https://chromewebstore.google.com/detail/hgeekaiplokcnmakghbdfbgnlfheichg)
- **Git LFS** (for large contract files)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/shadowkey.git
cd shadowkey
npm install
npm run build
```

### 2. Start Proof Server

```bash
docker run -d -p 6300:6300 midnightnetwork/proof-server:latest
```

### 3. Run the UI

```bash
cd shadowkey-ui
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app runs in **Demo mode** by default with mock proofs.

### 4. Deploy to Preview Network (Optional)

```bash
# Get tDUST from the Midnight faucet, then:
SHADOWKEY_DEPLOYER_MNEMONIC="word1 word2 ..." npm run deploy --workspace=@eddalabs/shadowkey-cli
```

## Project Structure

```
shadowkey/
├── shadowkey-contract/     # Compact ZK smart contract
│   └── src/
│       └── shadowkey.compact
├── shadowkey-cli/          # Deployment & interaction CLI
│   └── src/
│       ├── api.ts          # Midnight SDK integration
│       ├── deploy.ts       # Deployment script
│       └── config.ts       # Network configurations
├── shadowkey-ui/           # React frontend
│   └── src/
│       ├── hooks/          # useWallet, useContract
│       ├── components/     # WalletConnect, RegisterCard, etc.
│       └── App.tsx         # Main application
└── SHADOWKEY_PRD.md        # Product Requirements Document
```

## Demo Script (2-Minute Walkthrough)

**0:00** — Open the app. Show the hero section: "Authentication Without Exposure."

**0:15** — Connect Lace Wallet. Explain: "This is our Midnight identity wallet."

**0:30** — **Tab 1: Register.** Enter a username, click Register. Explain: "This creates a ZK credential — a hash of your identity + a random salt. Only the commitment goes on-chain. Your actual identity never leaves your browser."

**1:00** — **Tab 2: Prove.** Enter the same username, click Prove. Explain: "The app generates a Groth16 proof that you know the preimage of a registered commitment. The proof server runs locally — no data is sent to any third party."

**1:30** — **Tab 3: Verify.** The session token auto-fills. Click Verify. Explain: "The contract verifies the proof mathematically. No database lookup. No session cookies. Just pure cryptography."

**1:50** — Show the code. Point to `shadowkey.compact`: "This is the entire contract — 27 lines of Compact. The ZK logic is declarative and auditable."

## Why Midnight?

Midnight is the only L1 designed for **selective disclosure**. Unlike Ethereum (everything public) or Monero (everything private), Midnight lets you prove exactly what you need — and nothing else. ShadowKey demonstrates this with a real authentication flow that would be impossible on any other chain.

## License

Apache-2.0

---

<div align="center">
  <p>Built for the <a href="https://hackathon.midnight.network/">MLH Midnight Hackathon 2026</a></p>
  <p>By the ShadowKey Team</p>
</div>
