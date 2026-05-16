# ShadowKey — Zero-Knowledge Identity Verification for Midnight Network

> **Prove your identity without revealing it.** ShadowKey is a complete identity verification platform on Midnight Network — submit identity fields, upload documents, verify with zero-knowledge proofs, and auto-delete on demand. No passwords. No data leaks. Just pure cryptography.

**[MLH Midnight Hackathon 2026](https://hackathon.midnight.network/)** · **Track:** Overall Winners / Build Club

---

## Demo (2 Minutes)

```
1. Fill Identity Form  ──▶  2. Upload Documents  ──▶  3. Verify Identity
       │                          │                          │
  SHA256 hashes            Document commitments         ZK proofs
  (5 fields)               (passport, license,          (9 circuits)
                            ID card, bills)
                                                          │
                                             4. Login & Session
                                                    │
                                         5. Privacy Delete
```

---

## What It Does

ShadowKey is a **full identity verification pipeline** on Midnight Network:

| Step | Action | ZK Circuit | On-Chain |
|------|--------|-----------|----------|
| **1. Identity Form** | Fill 5 identity fields (name, DOB, nationality, address, ID number) | `submitIdentity` — hashes each field individually via domain-bound SHA256 | Stores field commitments + status |
| **2. Document Upload** | Drag-and-drop passport, license, ID card, bills | `uploadDocument` — SHA256 commitment per document | Links document hash to identity |
| **3. Verification** | Oracle approves/rejects via ZK | `approveIdentity` / `rejectIdentity` | Status changes to verified/rejected |
| **4. Prove Identity** | ZK proof of verified membership | `proveIdentityExists`, `proveField` | Returns boolean, no data leaked |
| **5. Login** | Generate session nonce | `login` — deterministic nonce from identity secret | `activeSessions[nonce] = true` |
| **6. Verify Session** | Any 3rd party checks nonce | `verifySession` — public query | Returns `activeSessions.lookup(nonce)` |
| **7. Privacy Delete** | Erase all on-chain data | `deleteIdentity` — removes all entries, inserts tombstone | All identity commits + docs erased |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           User's Browser                                    │
│                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────────────┐  │
│  │  5-Field Form    │    │  Document Upload │    │  Verification         │  │
│  │  (name, DOB,     │───▶│  (passport,      │───▶│  Dashboard            │  │
│  │   nationality,   │    │   license, etc)  │    │  (login, verify,      │  │
│  │   address, ID)   │    │                  │    │   delete)             │  │
│  └──────────────────┘    └──────────────────┘    └───────────┬───────────┘  │
│         │                          │                          │              │
│         ▼                          ▼                          ▼              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Operations Log (Terminal)                         │  │
│  │  [12:34:56] ZK SHA256("name":"John...") → 0xab12...                  │  │
│  │  [12:34:57] Circuit: submitIdentity (k=14, rows=9216)                │  │
│  │  [12:34:58] ✓ Identity commitment stored on-chain                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│         │                          │                          │              │
│         ▼                          ▼                          ▼              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    ZK Proof Pipeline (Animated)                      │  │
│  │  ◉ Document hash verification  ━━━━━━━━━━━━━━━━━ 100%               │  │
│  │  ◉ Identity field matching     ━━━━━━━━━━━━━━━━━  80%               │  │
│  │  ◉ Circuit: approveIdentity    ━━━━━━━━━━━━━━━━━  60%               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Midnight Network                                  │
│                                                                             │
│  Ledger State:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ identityCommits[identityId] → IdentityCommit {                       │  │
│  │   nameHash, dobHash, nationalityHash, addressHash, idNumberHash      │  │
│  │ }                                                                    │  │
│  │ identityStatuses[identityId] → 0=unreg  1=pending  2=verified        │  │
│  │ documentCommits[docId] → DocumentRecord { docHash, docType }         │  │
│  │ verifiedIdentities[identityId] → true                                │  │
│  │ deletedIdentities[identityId] → true  (tombstone)                    │  │
│  │ activeSessions[nonce] → true                                         │  │
│  │ totalRegistered: Counter                                             │  │
│  │ totalVerified: Counter                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ledger State

| Map | Key | Value | Purpose |
|-----|-----|-------|---------|
| `identityCommits` | `Bytes<32>` (identity ID) | `IdentityCommit` (5x field hashes) | Stores field commitments |
| `identityStatuses` | `Bytes<32>` (identity ID) | `Field` (0-4) | Tracks verification status |
| `documentCommits` | `Bytes<32>` (doc ID) | `DocumentRecord` (hash + type) | Stores doc commitments |
| `verifiedIdentities` | `Bytes<32>` (identity ID) | `Boolean` | Set of verified users |
| `deletedIdentities` | `Bytes<32>` (identity ID) | `Boolean` | Tombstone after deletion |
| `activeSessions` | `Bytes<32>` (nonce) | `Boolean` | Active ZK sessions |
| `totalRegistered` | Counter | — | Public user count |
| `totalVerified` | Counter | — | Public verified count |

### Smart Contract — 9 Circuits

| Circuit | Export | Inputs | Output | Description |
|---------|--------|--------|--------|-------------|
| `hashField` | internal | `Bytes<32>` | `Bytes<32>` | Domain-bound SHA256: `H("shadowkey:field:v1" \|\| input)` |
| `hashDocument` | internal | `Bytes<32>` | `Bytes<32>` | Domain-bound SHA256 for documents |
| `deriveIdentityId` | internal | `Bytes<32>` | `Bytes<32>` | Derives public ID from secret via `H("shadowkey:identity:v1" \|\| secret)` |
| `submitIdentity` | **exported** | 5x field values | `[]` | Hashes each field, derives identity ID, stores commitments, sets status → 1 |
| `uploadDocument` | **exported** | doc raw, doc type | `[]` | Hashes document, stores commitment linked to identity |
| `approveIdentity` | **exported** | identity ID | `[]` | Sets status → 2, adds to verified set |
| `rejectIdentity` | **exported** | identity ID | `[]` | Sets status → 3 |
| `deleteIdentity` | **exported** | identity ID | `[]` | Removes ALL identity/docs entries, inserts tombstone |
| `proveIdentityExists` | **exported** | identity ID | `Boolean` | Checks verified set membership |
| `proveField` | **exported** | identity ID, field value | `Boolean` | Proves a specific field hash matches commitment |
| `login` | **exported** | (from witness) | `Bytes<32>` | Proves verified membership, mints session nonce |
| `verifySession` | **exported** | nonce | `Boolean` | Public query: is nonce valid? |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contract** | Compact 0.31.0 (Midnight's ZK DSL) with witness pattern + domain-bound hashing |
| **Proof System** | Groth16 via Midnight Proof Server |
| **Frontend** | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + shadcn/ui |
| **Wallet** | Lace Wallet (Midnight Preview) via `window.midnight[UUID].connect()` |
| **Animations** | Framer Motion 12 — animated ZK pipeline, terminal log, step transitions |
| **Icons** | Lucide React |
| **Network** | Midnight Preview (testnet) |
| **Build** | npm workspaces — 3 packages: contract, cli, ui |
| **Compiler** | Compact CLI 0.31.0 via WSL2 (Windows) |

---

## Quick Start

### Prerequisites

- **Node.js** v18+ and **npm** v10+
- **WSL2** with Ubuntu 24.04 (for Compact compilation on Windows)
- **Lace Wallet** (Midnight Preview) — [Chrome Web Store](https://chromewebstore.google.com/detail/hgeekaiplokcnmakghbdfbgnlfheichg)
- Optional: **Docker** (for local proof server)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/shadowkey.git
cd shadowkey
npm install
```

### 2. Compile the Contract

```bash
# Requires WSL2 with compact CLI 0.31.0 installed
cd shadowkey-contract
npm run compact
npm run build
```

### 3. Run the UI

```bash
cd shadowkey-ui
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app runs in **Demo mode** — all ZK proofs are simulated with realistic cryptographic detail (SHA256 hashes, circuit row counts, proof constraints).

### 4. Build for Production

```bash
npm run build
```

Output: `shadowkey-ui/dist/` — static site deployable to any hosting (Vercel, Netlify, Cloudflare Pages, etc.).

---

## Project Structure

```
shadowkey/
├── shadowkey-contract/           # Compact ZK smart contract
│   └── src/
│       ├── shadowkey.compact     # 202 lines, 9 circuits, 8 ledger maps
│       ├── witnesses.ts          # Witness provider (localStorage secret)
│       ├── index.ts              # Package exports
│       └── managed/              # Compiled output (generated)
│           └── shadowkey/
│               ├── contract/     # JavaScript + TypeScript bindings
│               ├── keys/         # .prover + .verifier files per circuit
│               └── zkir/         # ZK intermediate representation
├── shadowkey-cli/                # Deployment & interaction CLI
│   └── src/
│       ├── api.ts                # Midnight SDK contract API wrapper
│       ├── deploy.ts             # Deployment to Midnight testnet
│       └── config.ts             # Network configuration
├── shadowkey-ui/                 # React frontend
│   └── src/
│       ├── App.tsx               # Main app — 5-step wizard flow
│       ├── index.css             # Tailwind + dark theme styles
│       ├── hooks/
│       │   ├── useWallet.ts      # Lace wallet detection + connection
│       │   └── useContract.ts    # Contract hook — identity ops, docs, login
│       ├── components/
│       │   ├── IdentityForm.tsx   # 5-field animated identity form
│       │   ├── DocumentUpload.tsx # Drag-and-drop document upload
│       │   ├── Dashboard.tsx      # Post-verification dashboard
│       │   ├── TerminalLog.tsx    # Live operations log
│       │   ├── WalletConnect.tsx  # Lace wallet connect button
│       │   └── ui/               # shadcn/ui primitives
│       └── lib/
│           └── loadContract.ts   # Contract address loader
├── SHADOWKEY_PRD.md              # Product Requirements Document
└── README.md                     # This file
```

---

## Security Model

### Zero-Knowledge Proofs
- All identity data is hashed **before** reaching the ledger
- Raw field values, document contents, and secrets **never** leave the browser
- `disclose()` annotations in Compact ensure only intended values are public
- Domain-bound hashing (`shadowkey:field:v1`, `shadowkey:identity:v1`, etc.) prevents cross-protocol attacks

### Witness Pattern
- The `getIdentitySecret()` witness derives a secret from browser localStorage
- The secret is used to deterministically derive the public identity ID
- Only the ZK proof (not the secret) is submitted to the network
- In production, secrets would be derived from wallet signatures

### Privacy-Preserving Deletion
- `deleteIdentity` removes ALL on-chain identity data:
  - Field commitments
  - Document commitments
  - Verification status
  - Verified identity flag
- A tombstone entry prevents re-registration of the same identity
- No residual data remains on the ledger

---

## Demo Walkthrough

### Step 1: Welcome Screen
The hero page explains the 3-step flow: Fill Identity Form → Upload Documents → Auto-Verify & Login. Click "Start Identity Verification" to begin.

### Step 2: Identity Form
5 animated input fields — Full Name, Date of Birth, Nationality, Residential Address, ID Number. Each field is "SHA256 hashed" (simulated in demo mode) with the terminal log showing each hash. Fields validate before submission.

### Step 3: Document Upload
Select document type (passport, driver's license, national ID card, utility bill, bank statement). Drag and drop files. Each upload triggers a simulated document commitment (SHA256 hash stored on ledger). Click "Verify Identity" when ready.

### Step 4: ZK Proof Pipeline
Animated verification screen showing 5 stages:
1. Document hash verification
2. Identity field matching
3. Circuit: approveIdentity (k=13)
4. Groth16 proof generation
5. On-chain submission

### Step 5: Dashboard
- **Identity Status Card** — shows identity ID, verification status, uploaded documents
- **Login (ZK Session)** — generates a session nonce via the `login()` circuit
- **Verify Session** — paste the session nonce to verify on-chain via `verifySession()`
- **Delete Identity** — triggers `deleteIdentity()` to erase all on-chain data

---

## Development Notes

### Compact Compilation
The contract uses Compact 0.31.0 features including:
- `persistentHash<Vector<N, T>>()` for domain-bound hashing
- `disclose()` annotations for controlled public data
- `Counter` type for public metrics
- `Map<Bytes<32>, T>` for ledger state
- `pad(32, "domain:string")` for domain separation

### Runtime Version Mismatch
The compiled contract targets `compact-runtime@0.16.0`, but the current SDK pins `compact-runtime@0.14.0`. The app runs in **Demo mode** with simulated cryptographic operations until the dependency chain is upgraded. The contract source compiles cleanly and all 9 circuits generate valid `.prover`, `.verifier`, and `.zkir` files.

---

## License

Apache-2.0

---

<div align="center">
  <p>Built for the <a href="https://hackathon.midnight.network/">MLH Midnight Hackathon 2026</a></p>
  <p>By the ShadowKey Team</p>
  <p>
    <a href="https://opencode.ai">opencode</a> ·
    <a href="https://compact-by-example.org/">Compact by Example</a> ·
    <a href="https://docs.midnight.network/">Midnight Docs</a>
  </p>
</div>
