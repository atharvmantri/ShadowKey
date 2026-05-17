# ShadowKey

> Zero-Knowledge Identity Verification on Midnight Network

ShadowKey is a privacy-preserving identity verification protocol built on Midnight Network. It enables users to prove their verified identity status to third-party applications without revealing any personal data. Using nine Groth16 zero-knowledge circuits written in Compact, ShadowKey ensures that identity commitments are stored on-chain while raw personal information never leaves the user's browser.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Smart Contract](#smart-contract)
- [User Interface](#user-interface)
- [Getting Started](#getting-started)
- [Developer Integration](#developer-integration)
- [Security Model](#security-model)
- [Project Structure](#project-structure)

---

## Overview

Traditional identity verification systems operate on a dangerous premise: they require users to surrender their personal data to a third party, who then stores it indefinitely on centralized servers. This creates honeypots for attackers, exposes users to data breaches, and fundamentally violates the principle of data minimization.

ShadowKey inverts this model. Instead of transmitting personal data for verification, users generate zero-knowledge proofs in their browser that demonstrate they meet the verification criteria -- without ever revealing the underlying data. The Midnight Network ledger stores only SHA256 commitments, domain-bound hashes, and verification status flags. Raw identity data is never transmitted, never stored on a server, and never accessible to any third party.

The system implements a complete identity lifecycle:

- **Identity Submission**: Five identity fields (name, date of birth, nationality, address, ID number) are individually hashed in the browser. Only the SHA256 commitments reach the ledger.
- **Document Commitment**: Supporting documents (passport, driver's license, ID card, utility bill, bank statement) are committed via hash. Raw files never leave the user's device.
- **Verification Workflow**: A trusted verifier oracle reviews documents out-of-band and approves or rejects the identity via dedicated ZK circuits.
- **ZK Authentication**: Verified users generate session nonces by proving membership in the verified set without revealing their specific identity.
- **Privacy Erasure**: Users can delete all on-chain data with a single circuit call. Identity commitments, document records, verification status, and session tokens are removed. A tombstone prevents re-registration.

---

## Architecture

ShadowKey follows a three-layer architecture that separates concerns between the user interface, the zero-knowledge proof system, and the ledger state.

### Layer 1: Browser Application

The React frontend runs entirely in the browser and handles all user interaction. It is built with:

- **React 19** for component rendering and state management
- **Framer Motion** for animation and scroll-driven effects
- **Tailwind CSS** for styling with a dark, professional theme
- **Lace Wallet SDK** for connectivity to Midnight Network

The application is structured as a five-step wizard:

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | LandingPage | Marketing page with particles, typewriter, parallax, 3D tilt cards, stats counters, architecture diagram, security model, call-to-action |
| 2 | IdentityForm | Five-field form with client-side validation, per-field SHA256 hashing visualization, security notice |
| 3 | DocumentUpload | Document type selector, drag-and-drop zone with acceptance overlay, upload tracking with status per document |
| 4 | Verifying | Animated ZK proof pipeline showing five stages: document hash verification, field matching, circuit execution, Groth16 proof generation, on-chain submission |
| 5 | Dashboard | Identity status card with animated state badge, document list with verification status, session login, session nonce copy/verify, privacy-preserving delete button |

A live terminal log in the sidebar displays every cryptographic operation in real time, including circuit invocations, hash computations, ledger inserts, and proof generation steps.

### Layer 2: Zero-Knowledge Proof System

The proof system consists of nine circuits compiled with Compact 0.31.0. Each circuit targets a specific operation in the identity lifecycle:

| Circuit | Purpose | Rows |
|---------|---------|------|
| submitIdentity | Hash and commit five identity fields | 9,216 |
| uploadDocument | Commit a document hash to the ledger | 4,096 |
| approveIdentity | Mark an identity as verified | 7,168 |
| rejectIdentity | Mark an identity as rejected | 4,096 |
| deleteIdentity | Erase all identity data, insert tombstone | 3,072 |
| proveIdentityExists | Prove identity is in the verified set | 2,048 |
| proveField | Prove a specific field matches a known value | 4,096 |
| login | Generate a deterministic session nonce | 8,080 |
| verifySession | Verify a session nonce is active | 305 |

The smallest circuit is verifySession at 305 rows, designed for efficient on-chain verification by third-party applications. The largest is submitIdentity at 9,216 rows, reflecting the five simultaneous SHA256 hash verifications.

All circuits use the Groth16 proving system with witness-derived secret keys. Domain separation is enforced through distinct `persistentHash` prefixes for each data type: `field:v1`, `doc:v1`, `identity:v1`, and `session:v1`.

### Layer 3: Midnight Ledger

The ledger stores only hashed commitments and status flags. The complete on-chain state consists of:

- **identityCommits**: Mapping from disclosed identity ID to a struct of five SHA256 field hashes
- **identityStatuses**: Mapping from identity ID to status field (0=unregistered, 1=pending, 2=verified, 3=rejected, 4=deleted)
- **documentCommits**: Mapping from document ID to document hash and type
- **verifiedIdentities**: Set of verified identity IDs
- **verificationRecords**: Mapping from identity ID to verification metadata (timestamp, expiry)
- **deletedIdentities**: Tombstone set preventing re-registration
- **activeSessions**: Set of valid session nonces
- **totalRegistered / totalVerified**: Counter metrics

---

## Smart Contract

The contract is written in Compact and consists of 202 lines across nine circuits. It imports the Compact Standard Library and uses the following primitives:

- `persistentHash` for domain-separated hashing
- `disclose` for selective public revelation of private values
- `Map<Bytes<32>, T>` for ledger storage
- `Counter` for aggregate metrics
- `assert` for constraint enforcement
- `pad` for domain prefix alignment

### Circuit: submitIdentity

```compact
export circuit submitIdentity(
  nameRaw: Bytes<32>,
  dobRaw: Bytes<32>,
  nationalityRaw: Bytes<32>,
  addressRaw: Bytes<32>,
  idNumberRaw: Bytes<32>
): [] {
  const identityId = deriveIdentityId(getIdentitySecret());
  const disclosedId = disclose(identityId);
  assert(deletedIdentities.lookup(disclosedId) != true, "Deleted.");
  identityCommits.insert(disclosedId, IdentityCommit {
    nameHash: disclose(hashField(nameRaw)),
    dobHash: disclose(hashField(dobRaw)),
    nationalityHash: disclose(hashField(nationalityRaw)),
    addressHash: disclose(hashField(addressRaw)),
    idNumberHash: disclose(hashField(idNumberRaw))
  });
  identityStatuses.insert(disclosedId, 1);
  totalRegistered.increment(1);
}
```

The identity is derived from a secret witness rather than being passed as an input. This binds the identity to the caller's secret without requiring explicit address-based authentication. Each field is individually hashed through `hashField`, which applies the domain prefix `field:v1` before the SHA256 computation.

### Circuit: login

```compact
export circuit login(): Bytes<32> {
  const identityId = deriveIdentityId(getIdentitySecret());
  const disclosedId = disclose(identityId);
  assert(verifiedIdentities.lookup(disclosedId) == true, "Not verified.");
  assert(deletedIdentities.lookup(disclosedId) != true, "Deleted.");
  const nonce = persistentHash<Vector<2, Bytes<32>>>([
    pad(32, "shadowkey:session:v1"),
    identityId
  ]);
  const disclosedNonce = disclose(nonce);
  activeSessions.insert(disclosedNonce, true);
  return disclose(nonce);
}
```

The login circuit generates a deterministic session nonce bound to the user's identity without revealing which identity it belongs to. The session prefix `shadowkey:session:v1` ensures domain separation from identity and field hashes.

### Circuit: verifySession

```compact
export circuit verifySession(nonce: Bytes<32>): Boolean {
  const disclosedNonce = disclose(nonce);
  return activeSessions.lookup(disclosedNonce) == true;
}
```

The smallest circuit at 305 rows. It performs a simple lookup against the active sessions map. This is the circuit that third-party applications call to verify a user's session token -- a single query returning a boolean.

### Circuit: deleteIdentity

```compact
export circuit deleteIdentity(
  identityId: Bytes<32>
): [] {
  const disclosedId = disclose(identityId);
  assert(verifiedIdentities.lookup(disclosedId) == true, "Not verified.");
  identityCommits.remove(disclosedId);
  identityStatuses.remove(disclosedId);
  verifiedIdentities.remove(disclosedId);
  verificationRecords.remove(disclosedId);
  deletedIdentities.insert(disclosedId, true);
}
```

The delete operation removes every record associated with the identity from all ledger maps and inserts a tombstone into the `deletedIdentities` set. Once deleted, the identity cannot be re-registered. This implements the right to erasure at the protocol level.

### Domain Separation

All hash operations use distinct domain prefixes to prevent cross-protocol collisions:

```compact
circuit hashField(input: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([ pad(32, "shadowkey:field:v1"), input ]);
}

circuit hashDocument(input: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([ pad(32, "shadowkey:doc:v1"), input ]);
}

circuit deriveIdentityId(secret: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([ pad(32, "shadowkey:identity:v1"), secret ]);
}

// In login:
const nonce = persistentHash<Vector<2, Bytes<32>>>([ pad(32, "shadowkey:session:v1"), identityId ]);
```

This ensures that a hash computed in one context cannot be reused in another. A field hash, document hash, identity ID, and session nonce are all mathematically distinct even if the underlying input bytes happen to be identical.

---

## User Interface

The application provides a complete user experience with seven major views, all rendered with consistent dark theming, animated transitions, and real-time feedback.

### Landing Page

The landing page is a full marketing site with seven sections:

1. **Hero**: 40 animated floating particles, a 3D tilt shield with glow effect, typewriter cycling through five phrases ("identity verification", "passwordless auth", "privacy layer", "KYC alternative", "ZK authentication"), a magnetic CTA button with shimmer overlay, and a scroll indicator.

2. **Stats Counters**: Animated count-up numbers showing 9 ZK circuits, 5 identity fields, 202 lines of Compact, and 8 ledger maps. Counters trigger on scroll into view.

3. **Feature Cards**: Six cards with independent 3D mouse-tilt effects, hover scaling, and color-coded icons describing zero-knowledge proofs, no PII storage, privacy-preserving deletion, nine ZK circuits, Groth16 on Midnight, and Lace Wallet readiness.

4. **How It Works Timeline**: A five-step vertical timeline with staggered slide-in reveals, color-coded by step type, connected by gradient divider lines.

5. **Architecture Blocks**: Three stacked sections for the browser layer, Midnight ledger, and ZK circuits, with smart alignment (left, center, right) based on semantic role.

6. **Security Model Grid**: Three-column grid covering ZK guarantees (zero-knowledge, soundness, completeness), domain separation with hash prefix examples, and the witness pattern.

7. **Call to Action**: Parallax gradient orbs, a CTA button with animated shimmer, and the same magnetic button effect from the hero section.

The landing page uses scroll-driven effects throughout: a fixed scroll progress bar at the top, a parallax grid at 0.3x speed, section fade-up reveals with `useInView`, and hero content that fades out as the user scrolls down.

### Identity Form

A five-field form (Full Name, Date of Birth, Nationality, Residential Address, ID Number) with:

- Per-field validation with animated error messages
- Focus-tracking with gradient bottom border animation
- Client-side SHA256 hashing visualization with hash preview
- Input icons and filled-state indicators
- Disabled inputs during loading to prevent double submission
- Security notice panel at the bottom

### Document Upload

A document management interface with:

- Document type selector (Passport, Driver's License, National ID Card, Utility Bill, Bank Statement)
- Drag-and-drop zone with visual acceptance highlight
- File type validation (PDF, PNG, JPG, WEBP)
- File size enforcement (10 MB maximum)
- Upload progress tracking with per-document status (pending, uploaded, verified)
- Error messages for invalid files or upload failures

### ZK Proof Pipeline

An animated verification screen that displays five sequential stages with:

- Rotating gradient icon with pulsing glow
- Progress bars that animate from 0 to 100%
- Spinning border color transitions
- Staggered entrance delays creating a pipeline visualization
- Circuit-specific information (name, row count, constraint count)

### Dashboard

A post-verification control panel with:

- Identity status card with animated badge (not submitted, pending, verified, rejected, deleted)
- Identity detail grid (ID, document count, verified document count, session status)
- Document list with verification status indicators
- Session login button with loading state
- Session nonce display with copy-to-clipboard
- Session verification playground (paste a nonce and verify)
- Privacy-preserving delete button with confirmation
- Real-time terminal log of all operations

### Developer Panel

An integration toolkit for third-party developers:

- One-click credential generation with cryptographic random API key
- Contract address display with copy button
- Pre-filled TypeScript code snippet with personalized credentials
- Live session verification test playground
- Architecture flow diagram
- Summary cards (No PII, 1 Function, Open Source)

### Terminal Log

A live operations log that displays every cryptographic operation:

- Color-coded log levels (info, success, warn, error, data, zk)
- Auto-scroll with timestamp display
- Clear button for log management
- Tab integration with developer panel in dashboard view

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- Lace Wallet (Midnight Preview) for live transactions

### Installation

```bash
# Clone the repository
git clone https://github.com/atharvmantri/ShadowKey.git
cd ShadowKey

# Install dependencies
npm install

# Build the smart contract (WSL with Compact 0.31.0)
cd shadowkey-contract
npm run compact

# Build the UI
cd ../shadowkey-ui
npm run build

# Start the development server
npm run dev
```

### Demo Mode

The application runs in demo mode out of the box without a wallet connection. Click "Demo" on the wallet button to simulate a connected wallet with mock balances. All identity operations, document uploads, verification workflows, and session management work in demo mode using in-memory state simulation.

### Lace Wallet Connection

For live Midnight testnet transactions, install Lace Wallet (Midnight Preview) from the Chrome Web Store. The application automatically detects the wallet provider using UUID key iteration and supports network fallback through preview, preprod, and devnet.

---

## Developer Integration

ShadowKey is designed for easy integration by third-party applications. The verification flow requires a single on-chain query.

### Architecture

```
Your dApp                    ShadowKey                   Midnight Ledger
   |                           |                              |
   |-- sessionNonce ---------->|                              |
   |                           |-- verifySession(nonce) ---->|
   |                           |                              |
   |<-- true/false ------------|                              |
   |                           |                              |
   |-- grantAccess()           |                              |
```

### Integration Example

```typescript
import { ShadowKeyContract } from '@shadowkey/contract';

const CONTRACT_ADDRESS = '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';

export async function verifyUserSession(
  sessionNonce: string
): Promise<boolean> {
  const contract = await ShadowKeyContract.deploy(
    wallet,
    { address: CONTRACT_ADDRESS }
  );
  const valid = await contract.verifySession(sessionNonce);
  return valid;
}

// Express.js API route
app.post('/api/auth/verify', async (req, res) => {
  const { sessionToken } = req.body;
  const authorized = await verifyUserSession(sessionToken);
  res.json({ authorized, timestamp: Date.now() });
});
```

### Integration Benefits

- **No PII Exposure**: `verifySession()` returns a boolean. No name, date of birth, address, or document data ever enters your application.
- **Single Function Call**: No complex SDK initialization, no state management, no webhook configuration. One query, one boolean.
- **Self-Sovereign Identity**: Users register once with ShadowKey and reuse their verified status across any integrated application. No repeated KYC submissions.
- **Open Source**: The full contract source code is available for audit, fork, and customization under the Apache 2.0 license.

---

## Security Model

### Zero-Knowledge Guarantees

- **Zero-Knowledge**: A proof reveals only the truth of the statement being proved. For verifySession, this means the verifier learns only whether the nonce is valid -- nothing about the user's identity, documents, or personal data.
- **Soundness**: No computationally bounded prover can produce a valid proof for a false statement. This is guaranteed by the Groth16 proving system and the NP-completeness of R1CS constraint satisfaction.
- **Completeness**: An honest prover with a valid witness always succeeds in generating an accepting proof.

### Data Protection

- All identity fields are SHA256-hashed in the browser before transmission
- Domain separation prevents hash reuse across different data types
- Raw personal data is never transmitted over the network
- Document files are hashed client-side before commitment
- Session nonces are derived from identity secrets through domain-separated hashing

### Privacy-Preserving Deletion

- The `deleteIdentity` circuit removes all records associated with an identity from every ledger map
- A tombstone entry prevents re-registration with the same identity
- No raw data existed on the ledger to begin with -- deletion removes the hashed commitments and status flags

---

## Project Structure

```
ShadowKey/
├── shadowkey-contract/          # Compact smart contract
│   ├── src/
│   │   ├── shadowkey.compact    # 202 lines, 9 ZK circuits
│   │   └── managed/             # Compiled contract artifacts
│   ├── package.json
│   └── tsconfig.json
├── shadowkey-ui/                # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.tsx       # 635-line marketing page
│   │   │   ├── IdentityForm.tsx      # 5-field form with validation
│   │   │   ├── DocumentUpload.tsx    # Drag-and-drop document upload
│   │   │   ├── Dashboard.tsx         # Post-verification controls
│   │   │   ├── DeveloperPanel.tsx    # Integration toolkit
│   │   │   ├── TerminalLog.tsx       # Live operations log
│   │   │   ├── WalletConnect.tsx     # Lace wallet connection
│   │   │   └── ui/                   # Base UI components
│   │   ├── hooks/
│   │   │   ├── useContract.ts        # Contract interaction layer
│   │   │   └── useWallet.ts          # Wallet connection management
│   │   ├── App.tsx                   # Application root with wizard
│   │   └── main.tsx                  # Entry point with lazy loading
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── vercel.json                  # Deployment configuration
└── package.json                 # Workspace root
```

### Key Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Smart Contract | Midnight Compact | 0.31.0 |
| Frontend | React | 19.1.0 |
| Animation | Framer Motion | 12.38.0 |
| Styling | Tailwind CSS | 4.1.10 |
| Icons | Lucide React | 0.517.0 |
| Build | Vite | 6.3.5 |
| Wallet | Lace Wallet SDK | 4.x |
| Package Manager | npm Workspaces | 10.x |

---

## License

Apache 2.0 -- see LICENSE for details.
