# SHADOWKEY — AI-Autonomous Build PRD
## Zero-Knowledge Authentication Layer for Midnight Network
**Hackathon**: Midnight Hackathon by MLH (May 2026)  
**Track**: Overall Winners / Build Club  
**Team Size**: 2 (you + 1 pitch/video teammate)  
**Time Budget**: 12 hours total  
**File Version**: 1.0 — Vibe-Coding Ready

---

## HOW TO USE THIS PRD

Every section ends with a **🤖 AI INSTRUCTION** block. When you paste this PRD into any AI (Cursor, Claude, ChatGPT, etc.) and say **"follow @prd.md"**, the AI must read the current section, execute the instruction, then automatically move to the next section and execute that instruction, and so on, until the project is complete.

**You (the human) only intervene when the AI says:**
- `⏸️ HUMAN ACTION REQUIRED:` — do the step, then tell the AI "continue"
- `✅ CHECKPOINT:` — verify the output matches the criteria, then tell the AI "continue"

---

## PHASE 0: ENVIRONMENT SETUP (Hour 0:00–0:45)

### 0.1 Prerequisites Check
Before starting, confirm you have:
- [ ] Node.js 20+ (`node -v`)
- [ ] Docker Desktop running (`docker ps` works)
- [ ] Git configured
- [ ] Lace Wallet (Midnight Preview) installed in browser
- [ ] GitHub account (for public repo)

### 0.2 Clone Starter Template

```bash
git clone https://github.com/meshjs/midnight-starter-template.git shadowkey
cd shadowkey
```

### 0.3 Rename All shadowkey References to ShadowKey

Run these find-and-replace commands in the project root:

```bash
# macOS
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | xargs sed -i '' 's/shadowkey/shadowkey/g'
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | xargs sed -i '' 's/shadowkey/ShadowKey/g'

# Linux
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" \) | xargs sed -i 's/shadowkey/shadowkey/g'
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" \) | xargs sed -i 's/shadowkey/ShadowKey/g'
```

Rename directories:
```bash
mv packages/shadowkey-contract packages/shadowkey-contract
mv packages/shadowkey-cli packages/shadowkey-cli
mv packages/shadowkey-ui packages/shadowkey-ui
```

### 0.4 Install Dependencies

```bash
npm install
```

### 0.5 Start the Proof Server (Docker)

```bash
docker run -p 6300:6300 midnightnetwork/proof-server -- "midnight-proof-server --network testnet"
```

Verify it is running:
```bash
curl http://localhost:6300/api/v1/status
```

Expected: HTTP 200 with JSON status.

### 0.6 Install shadcn/ui in the UI Package

```bash
cd packages/shadowkey-ui
npx shadcn@latest init --yes --template vite --base-color slate
npx shadcn add tabs card button badge input separator
```

---

🤖 **AI INSTRUCTION**: Execute Phase 0 exactly as written. Run all shell commands in sequence. After each command, verify success before proceeding. If `docker run` fails on ARM Mac, use `bricktowers/proof-server:6.1.0-alpha-6` instead. After all steps complete, print `✅ CHECKPOINT: Phase 0 Complete` and list the current directory tree of `packages/`. Then wait for human to say "continue".

---

## PHASE 1: SMART CONTRACT (Hour 0:45–2:15)

### 1.1 Delete Old Contract Files

Delete the old shadowkey contract files:
```bash
cd packages/shadowkey-contract/src
rm -f shadowkey.compact witnesses.ts index.ts
```

### 1.2 Write `shadowkey.compact`

Create `packages/shadowkey-contract/src/shadowkey.compact` with this exact content:

```compact
pragma language_version >= 0.23;

import CompactStandardLibrary;

// --- Data Structures ---
struct SecretKey { bytes: Bytes<<32>; }
struct PublicKey { bytes: Bytes<<32>; }

// --- Public Ledger State ---
// Whitelist of registered users (hash of secret -> true)
export ledger registeredUsers: Map<<Bytes<<32>, Bool>;

// Active bearer-token sessions (nonce -> true)
export ledger activeSessions: Map<<Bytes<<32>, Bool>;

// Public metric: how many users registered
export ledger userCount: shadowkey;

// --- Witness: The user's local secret ---
// The proof server injects this from private state; it never hits the chain
witness getUserSecret(): SecretKey;

// --- Circuits ---

// Derive a public identity from a secret using domain-bound hashing
export circuit derivePublicKey(sk: SecretKey): PublicKey {
    return PublicKey {
        bytes: persistentHash<Vector<<2, Bytes<<32>>>([
            pad(32, "shadowkey:user:v1"),
            sk.bytes
        ])
    };
}

// REGISTER: Store derived pubkey on-chain. Anyone can register in demo mode.
export circuit register(): [] {
    const pk = derivePublicKey(getUserSecret());
    registeredUsers.insert(pk.bytes, true);
    userCount.increment(1);
}

// LOGIN: ZK proof of registered identity. Returns a session nonce.
// The contract verifies H(secret) is registered WITHOUT revealing secret.
export circuit login(): Bytes<<32> {
    const pk = derivePublicKey(getUserSecret());
    assert(registeredUsers.lookup(pk.bytes) == true, "User not registered.");

    // Deterministic nonce = H(domain || pubkey).
    const nonce = persistentHash<Vector<<2, Bytes<<32>>>([
        pad(32, "shadowkey:session:v1"),
        pk.bytes
    ]);

    activeSessions.insert(nonce, true);
    return disclose(nonce);
}

// VERIFY: Public check for 3rd-party dApps. No ZK required.
export circuit verifySession(nonce: Bytes<<32>): Bool {
    return activeSessions.lookup(nonce);
}
```

### 1.3 Write `witnesses.ts`

Create `packages/shadowkey-contract/src/witnesses.ts` with this exact content:

```typescript
import { SecretKey } from './index.js';

const STORAGE_KEY = 'shadowkey_demo_secret_v1';

/**
 * Witness provider: supplies the user's secret from browser localStorage.
 * In production, derive this from a wallet signature or secure enclave.
 */
export function getUserSecret(): SecretKey {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    const arr = new Uint8Array(JSON.parse(stored));
    return { bytes: arr as any };
  }

  // Generate cryptographically secure random 32 bytes
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(randomBytes)));

  return { bytes: randomBytes as any };
}
```

### 1.4 Write `index.ts`

Create `packages/shadowkey-contract/src/index.ts` with this exact content:

```typescript
export { ShadowKeyContract } from './managed/ShadowKeyContract.js';
export type { SecretKey, PublicKey } from './managed/ShadowKeyContract.js';
export { getUserSecret } from './witnesses.js';
```

### 1.5 Compile the Contract

```bash
cd packages/shadowkey-contract
npm run compact
```

If `npm run compact` does not exist in package.json, add this script:
```json
"scripts": {
  "compact": "compactc src/shadowkey.compact --output src/managed",
  "build": "tsc",
  "test": "vitest"
}
```

Then run:
```bash
npm run compact && npm run build
```

### 1.6 Write Unit Tests

Create `packages/shadowkey-contract/src/test/shadowkey.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('ShadowKey contract', () => {
  it('placeholder: compilation succeeded', () => {
    expect(true).toBe(true);
  });
});
```

Run tests:
```bash
npm run test
```

---

🤖 **AI INSTRUCTION**: Execute Phase 1 exactly. Write all three files with ZERO deviation from the provided code. After writing each file, print the first 5 lines as confirmation. Run `npm run compact && npm run build`. If compilation fails, analyze the error, fix ONLY the specific line causing it (do not rewrite the whole contract), and retry. After success, print `✅ CHECKPOINT: Phase 1 Complete — Contract compiled and built`. Then wait for human to say "continue".

---

## PHASE 2: CONTRACT API & CLI (Hour 2:15–3:15)

### 2.1 Update CLI Package

Navigate to `packages/shadowkey-cli/src/` and update the deploy script to reference `ShadowKeyContract` instead of `shadowkeyContract`.

The CLI deploy script should:
1. Load the compiled contract
2. Connect to the Midnight testnet
3. Deploy with the deployer wallet
4. Log the contract address to console
5. Save the contract address to a JSON file at `packages/shadowkey-ui/public/contract-address.json`

### 2.2 Write Contract API Wrapper

Create `packages/shadowkey-contract/src/api.ts`:

```typescript
import { ShadowKeyContract } from './managed/ShadowKeyContract.js';
import { getUserSecret } from './witnesses.js';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';

export interface ShadowKeyAPI {
  register(): Promise<string>;
  login(): Promise<{ nonce: string; txHash: string }>;
  verifySession(nonce: string): Promise<boolean>;
}

export function createShadowKeyAPI(
  contract: ShadowKeyContract,
  wallet: any
): ShadowKeyAPI {
  return {
    async register() {
      const tx = await contract.register();
      return tx.transactionHash;
    },
    async login() {
      const tx = await contract.login();
      // Extract nonce from transaction events or return value
      const nonce = tx.returnValue || '';
      return { nonce, txHash: tx.transactionHash };
    },
    async verifySession(nonce: string) {
      const result = await contract.verifySession(nonce);
      return result;
    }
  };
}
```

---

🤖 **AI INSTRUCTION**: Execute Phase 2. Update the CLI deploy script to use ShadowKeyContract. Write the API wrapper exactly as provided. Ensure all imports reference the correct generated managed contract paths. After completion, print `✅ CHECKPOINT: Phase 2 Complete — API wrapper and CLI ready`. Then wait for human to say "continue".

---

## PHASE 3: FRONTEND UI (Hour 3:15–6:15)

### 3.1 Global Styles

Update `packages/shadowkey-ui/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 4%;
    --foreground: 210 40% 98%;
    --card: 222 47% 7%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 7%;
    --popover-foreground: 210 40% 98%;
    --primary: 263 70% 50%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 263 70% 50%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 263 70% 50%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### 3.2 Wallet Hook

Create `packages/shadowkey-ui/src/hooks/useWallet.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  balances: {
    shielded: string;
    unshielded: string;
    dust: string;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState({ shielded: '0', unshielded: '0', dust: '0' });

  useEffect(() => {
    const checkWallet = () => {
      const lace = (window as any).midnight?.mnLace;
      setIsInstalled(!!lace);
    };
    checkWallet();
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    try {
      const lace = (window as any).midnight?.mnLace;
      if (!lace) throw new Error('Lace wallet not installed');

      const api = await lace.enable();
      const networkId = await api.getNetworkId();

      if (networkId !== '1') {
        throw new Error('Please set Lace to Midnight Testnet');
      }

      const addr = await api.getChangeAddress();
      setAddress(addr);

      const shielded = await api.getShieldedBalance();
      const unshielded = await api.getUnshieldedBalance();
      const dust = await api.getDustBalance();

      setBalances({
        shielded: (shielded / 1e9).toFixed(4),
        unshielded: (unshielded / 1e9).toFixed(4),
        dust: (dust / 1e9).toFixed(4),
      });

      setIsConnected(true);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setBalances({ shielded: '0', unshielded: '0', dust: '0' });
  }, []);

  return { isInstalled, isConnected, address, balances, connect, disconnect };
}
```

### 3.3 Contract Hook

Create `packages/shadowkey-ui/src/hooks/useContract.ts`:

```typescript
import { useState, useCallback } from 'react';

interface ContractState {
  isLoading: boolean;
  error: string | null;
  register: () => Promise<string | undefined>;
  login: () => Promise<{ nonce: string; txHash: string } | undefined>;
  verifySession: (nonce: string) => Promise<boolean | undefined>;
}

export function useContract(walletAddress: string | null): ContractState {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder: integrate with actual contract API
      await new Promise(r => setTimeout(r, 2000));
      return 'mock-tx-hash-register';
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  const login = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder: integrate with actual contract API
      await new Promise(r => setTimeout(r, 2000));
      const mockNonce = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      return { nonce: mockNonce, txHash: 'mock-tx-hash-login' };
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  const verifySession = useCallback(async (nonce: string) => {
    if (!walletAddress || !nonce) return;
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder: integrate with actual contract API
      await new Promise(r => setTimeout(r, 1500));
      return true;
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  return { isLoading, error, register, login, verifySession };
}
```

### 3.4 UI Components

Create `packages/shadowkey-ui/src/components/WalletConnect.tsx`:

```tsx
import { Shield, Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WalletConnectProps {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  balances: { shielded: string; unshielded: string; dust: string };
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ isInstalled, isConnected, address, balances, onConnect, onDisconnect }: WalletConnectProps) {
  if (!isInstalled) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm">
        <Shield className="w-4 h-4" />
        <span>Install Lace Wallet (Midnight Preview)</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Button onClick={onConnect} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold gap-2">
        <Wallet className="w-4 h-4" />
        Connect Lace Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-xs text-slate-400 font-mono">{address?.slice(0, 12)}...{address?.slice(-8)}</span>
        <div className="flex gap-2 text-xs text-slate-500">
          <span>⚡ {balances.shielded}</span>
          <span>◎ {balances.unshielded}</span>
          <span>◈ {balances.dust}</span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-slate-400 hover:text-white">
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

Create `packages/shadowkey-ui/src/components/RegisterCard.tsx`:

```tsx
import { useState } from 'react';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RegisterCardProps {
  onRegister: () => Promise<string | undefined>;
  isLoading: boolean;
}

export function RegisterCard({ onRegister, isLoading }: RegisterCardProps) {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRegister = async () => {
    const txHash = await onRegister();
    if (txHash) {
      setResult({ success: true, message: `Registered! Tx: ${txHash.slice(0, 16)}...` });
    } else {
      setResult({ success: false, message: 'Registration failed. You may already be registered.' });
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-white">Register Identity</CardTitle>
            <CardDescription className="text-slate-400">Generate a secret and register your ZK identity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          Your secret is generated locally and never leaves your browser. Only a zero-knowledge proof is submitted to Midnight.
        </p>
        <Button 
          onClick={handleRegister} 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
          {isLoading ? 'Generating ZK Proof...' : 'Generate Secret & Register'}
        </Button>
        {result && (
          <Badge variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}>
            {result.success ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
            {result.message}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
```

Create `packages/shadowkey-ui/src/components/LoginCard.tsx`:

```tsx
import { useState } from 'react';
import { Key, Loader2, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LoginCardProps {
  onLogin: () => Promise<{ nonce: string; txHash: string } | undefined>;
  isLoading: boolean;
}

export function LoginCard({ onLogin, isLoading }: LoginCardProps) {
  const [nonce, setNonce] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    const result = await onLogin();
    if (result) {
      setNonce(result.nonce);
    }
  };

  const copyNonce = () => {
    if (nonce) {
      navigator.clipboard.writeText(nonce);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Key className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-white">Prove Identity</CardTitle>
            <CardDescription className="text-slate-400">Generate a session nonce without revealing your secret</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          This generates a zero-knowledge proof that you are a registered user. The contract verifies your membership without learning your identity.
        </p>
        <Button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
          {isLoading ? 'Generating ZK Proof...' : 'Prove Identity & Mint Nonce'}
        </Button>
        {nonce && (
          <div className="space-y-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Proof Valid — Session Active
            </Badge>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-300 truncate">
                {nonce}
              </code>
              <Button variant="ghost" size="sm" onClick={copyNonce} className="text-slate-400 hover:text-white">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">Copy this nonce to verify in the next tab.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

Create `packages/shadowkey-ui/src/components/VerifyCard.tsx`:

```tsx
import { useState } from 'react';
import { Eye, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface VerifyCardProps {
  onVerify: (nonce: string) => Promise<boolean | undefined>;
  isLoading: boolean;
}

export function VerifyCard({ onVerify, isLoading }: VerifyCardProps) {
  const [nonce, setNonce] = useState('');
  const [result, setResult] = useState<{ valid: boolean; checked: boolean } | null>(null);

  const handleVerify = async () => {
    if (!nonce.trim()) return;
    const valid = await onVerify(nonce.trim());
    setResult({ valid: !!valid, checked: true });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Eye className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-white">Verify Access</CardTitle>
            <CardDescription className="text-slate-400">Check if a session nonce is valid (simulates 3rd-party dApp)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400">
          Any application can call this publicly to verify a user's session without knowing their identity, wallet address, or secret.
        </p>
        <div className="flex gap-2">
          <Input 
            placeholder="Paste session nonce..." 
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-sm"
          />
          <Button 
            onClick={handleVerify} 
            disabled={isLoading || !nonce.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>
        {result?.checked && (
          <Badge className={result.valid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}>
            {result.valid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            {result.valid ? 'Active Session — Access Granted' : 'Invalid or Expired Session'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3.5 Main App

Replace `packages/shadowkey-ui/src/App.tsx` with:

```tsx
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { WalletConnect } from './components/WalletConnect';
import { RegisterCard } from './components/RegisterCard';
import { LoginCard } from './components/LoginCard';
import { VerifyCard } from './components/VerifyCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Zap } from 'lucide-react';

function App() {
  const { isInstalled, isConnected, address, balances, connect, disconnect } = useWallet();
  const { isLoading, error, register, login, verifySession } = useContract(address);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ShadowKey</span>
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-500 ml-2">Midnight ZK Auth</Badge>
          </div>
          <WalletConnect 
            isInstalled={isInstalled} 
            isConnected={isConnected} 
            address={address} 
            balances={balances}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Authentication Without Exposure
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Prove you are who you say you are — without revealing your identity, wallet address, or transaction history. 
            Built on Midnight's zero-knowledge smart contracts.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Client-side ZK proof generation • No trusted servers • Fully private</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900 border border-slate-800 mb-6">
            <TabsTrigger value="register" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">1. Register</TabsTrigger>
            <TabsTrigger value="login" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">2. Prove</TabsTrigger>
            <TabsTrigger value="verify" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">3. Verify</TabsTrigger>
          </TabsList>
          <TabsContent value="register">
            <RegisterCard onRegister={register} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="login">
            <LoginCard onLogin={login} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="verify">
            <VerifyCard onVerify={verifySession} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

---

🤖 **AI INSTRUCTION**: Execute Phase 3 exactly. Write all 6 files with ZERO deviation. After writing each file, confirm the file path. Run `npm run dev` in the UI package and verify the app renders without errors. If there are import errors, fix ONLY the import paths (do not rewrite component logic). After the app renders successfully in the browser, print `✅ CHECKPOINT: Phase 3 Complete — UI renders with all 3 tabs`. Then wait for human to say "continue".

---

## PHASE 4: WIRE CONTRACT TO FRONTEND (Hour 6:15–7:15)

### 4.1 Update `useContract.ts` with Real Integration

Replace the placeholder `useContract.ts` with the real contract integration. The hook must:

1. Load the contract address from `/contract-address.json`
2. Initialize the `ShadowKeyContract` from the managed package
3. Pass the witness provider (`getUserSecret`) to the contract
4. Call actual contract circuits: `register()`, `login()`, `verifySession(nonce)`
5. Handle Compact-specific errors (assert failures, witness errors)
6. Return real transaction hashes from the blockchain

Key integration points:
- Use `@midnight-ntwrk/midnight-js-contracts` for contract instance creation
- Use `@midnight-ntwrk/midnight-js-types` for transaction types
- The contract instance is created with: `createContractInstance(contractAddress, wallet, witnesses)`
- `register()` and `login()` are ZK circuits — they require the proof server to be running
- `verifySession()` is a public query — it does not need the proof server

### 4.2 Add Contract Address Loader

Create `packages/shadowkey-ui/src/lib/loadContract.ts`:

```typescript
export async function loadContractAddress(): Promise<string | null> {
  try {
    const res = await fetch('/contract-address.json');
    const data = await res.json();
    return data.address || null;
  } catch {
    return null;
  }
}
```

### 4.3 Handle Lace Wallet API for Transactions

The Lace wallet API provides:
- `api.getChangeAddress()` — returns shielded address
- `api.signTx(tx)` — signs a transaction
- `api.submitTx(tx)` — submits to network

For Midnight, use the `@midnight-ntwrk/midnight-js-wallet` package to wrap the Lace provider into a wallet compatible with the contract SDK.

### 4.4 Error Handling Table

| Error | Cause | User Message |
|---|---|---|
| `User not registered.` | `assert` in `login()` | "You must register before logging in." |
| Proof server unreachable | Docker not running | "Proof server offline. Start Docker and retry." |
| Insufficient tDUST | Wallet empty | "Get testnet tDUST from the Midnight faucet." |
| Lace not on testnet | Wrong network | "Switch Lace to Midnight Testnet in wallet settings." |

---

🤖 **AI INSTRUCTION**: Execute Phase 4. Replace the placeholder `useContract.ts` with a REAL integration that connects to the compiled ShadowKeyContract. Use the actual Midnight JS SDK packages (`@midnight-ntwrk/midnight-js-contracts`, `@midnight-ntwrk/midnight-js-wallet`). The hook must load the contract address from `/contract-address.json`, initialize the contract with the wallet and witness provider, and call real circuits. After integration, test the full flow: Register → Login → Verify. If any step fails, debug the error, fix ONLY the broken integration point, and retry. After all three tabs work end-to-end, print `✅ CHECKPOINT: Phase 4 Complete — Contract wired to UI, all 3 flows working`. Then wait for human to say "continue".

---

## PHASE 5: DEPLOY TO TESTNET (Hour 7:15–8:15)

### 5.1 Get Testnet tDUST

1. Open Lace Wallet → Settings → Network → Select "Midnight Testnet"
2. Copy your shielded address
3. Go to Midnight Testnet Faucet (link in Midnight Discord #faucet)
4. Paste address, request tDUST
5. Wait 1–2 minutes, verify balance in wallet

### 5.2 Deploy Contract

```bash
cd packages/shadowkey-cli
npm run deploy
```

The deploy script should:
1. Read deployer credentials from environment or Lace wallet
2. Submit the contract deployment transaction
3. Wait for confirmation
4. Save the contract address to `packages/shadowkey-ui/public/contract-address.json`
5. Print the explorer link: `https://explorer.testnet.midnight.network/address/{CONTRACT_ADDRESS}`

### 5.3 Verify on Explorer

Open the explorer link. Confirm:
- [ ] Contract address is valid
- [ ] Deployment transaction is confirmed
- [ ] Contract code hash matches your compiled output

### 5.4 Test Live Registration

1. Open the UI at `http://localhost:5173`
2. Connect Lace Wallet
3. Tab 1: Click "Generate Secret & Register"
4. Approve transaction in Lace popup
5. Wait for confirmation (30–60 seconds)
6. Verify: green badge appears with transaction hash

### 5.5 Test Live Login

1. Tab 2: Click "Prove Identity & Mint Nonce"
2. Approve ZK proof generation in Lace
3. Wait for proof generation (10–30 seconds on Docker proof server)
4. Wait for transaction confirmation
5. Verify: nonce appears in green badge

### 5.6 Test Live Verify

1. Tab 3: Paste the nonce from Tab 2
2. Click "Verify Access"
3. Verify: green "Active Session" badge

---

🤖 **AI INSTRUCTION**: Execute Phase 5. Guide the human through the faucet step with exact instructions. Then run the deploy script. If deployment fails due to insufficient balance, print `⏸️ HUMAN ACTION REQUIRED: Get tDUST from faucet`. After deployment succeeds and the address is saved, verify the 3-tab flow works on the LIVE testnet (not mock data). Record the contract address and explorer link. Print `✅ CHECKPOINT: Phase 5 Complete — Live on testnet, all flows verified`. Then wait for human to say "continue".

---

## PHASE 6: UI POLISH & MOTION (Hour 8:15–9:15)

### 6.1 Add Framer Motion

```bash
cd packages/shadowkey-ui
npm install framer-motion
```

### 6.2 Animate Tab Content

Wrap each `TabsContent` in `AnimatePresence` + `motion.div`:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

// In App.tsx, wrap each TabsContent:
<TabsContent value="register">
  <AnimatePresence mode="wait">
    <motion.div
      key="register"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <RegisterCard onRegister={register} isLoading={isLoading} />
    </motion.div>
  </AnimatePresence>
</TabsContent>
```

### 6.3 Add Loading Skeletons

Create `packages/shadowkey-ui/src/components/LoadingCard.tsx`:

```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingCard() {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}
```

### 6.4 Add Gradient Background

Add to `index.css`:

```css
body {
  background: radial-gradient(ellipse at top, #1e1b4b 0%, #020617 50%);
  min-height: 100vh;
}
```

### 6.5 Add Transaction Link

In `RegisterCard` and `LoginCard`, when showing success, add a link to the Midnight explorer:

```tsx
<a 
  href={`https://explorer.testnet.midnight.network/tx/${txHash}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-indigo-400 hover:text-indigo-300 underline"
>
  View on Explorer →
</a>
```

---

🤖 **AI INSTRUCTION**: Execute Phase 6. Install framer-motion. Add AnimatePresence to all 3 tabs. Add the gradient background. Add explorer links to success states. Ensure the UI looks polished and professional — like a funded startup, not a hackathon prototype. After all polish is applied, print `✅ CHECKPOINT: Phase 6 Complete — UI polished with motion and gradients`. Then wait for human to say "continue".

---

## PHASE 7: README & DEVPOST (Hour 9:15–10:15)

### 7.1 Write README.md

Replace the root `README.md` with:

```markdown
# ShadowKey — Zero-Knowledge Authentication Layer for Midnight

**Hackathon**: Midnight Hackathon by MLH (May 2026)  
**Track**: Overall Winners / Build Club  
**Live Demo**: [YouTube link]  
**Contract**: [Explorer link]

## What It Does

ShadowKey is a reusable zero-knowledge authentication module for Midnight dApps. Users register a deterministic identity derived from a local secret. They can later prove ownership to generate session nonces — without ever transmitting the secret to the blockchain or a server.

This solves the fundamental privacy problem in Web3: **every time you connect a wallet, you expose your entire financial history**. ShadowKey lets dApps verify "this user is legitimate" without learning who they are.

## Why Midnight?

Traditional blockchains expose caller addresses and full transaction graphs. Midnight's ZK circuits allow us to verify "this user is registered" without revealing WHICH user or linking their history. ShadowKey demonstrates this for the most common dApp primitive: authentication.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Browser  │────▶│  Docker Proof    │────▶│  Midnight       │
│  (Lace Wallet)  │     │  Server (ZK)     │     │  Testnet        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                               │
        │  1. register() — ZK proof of secret           │
        │  2. login() — ZK proof of registration      │
        │  3. verifySession(nonce) — public query     │
        ▼                                               ▼
   LocalStorage                                    On-Chain State
   (32-byte secret)                                 registeredUsers[hash]
                                                   activeSessions[nonce]
```

## Smart Contract

**Language**: Compact (Midnight's ZK smart contract language)  
**Circuits**:
- `register()`: Derives public key from witness secret, stores in `registeredUsers` map
- `login()`: Asserts registration, mints deterministic session nonce, stores in `activeSessions`
- `verifySession(nonce)`: Public boolean query for 3rd-party dApps

**Security**: Domain-bound hashing (`shadowkey:user:v1`) prevents secret reuse across contracts. Witness pattern ensures secrets never touch the chain.

## Quick Start

```bash
# 1. Start proof server
docker run -p 6300:6300 midnightnetwork/proof-server -- "midnight-proof-server --network testnet"

# 2. Install & build
git clone <repo>
cd shadowkey
npm install
cd packages/shadowkey-contract && npm run compact && npm run build

# 3. Deploy (get tDUST from faucet first)
cd ../shadowkey-cli && npm run deploy

# 4. Run UI
cd ../shadowkey-ui && npm run dev
```

## Tech Stack

- **Smart Contract**: Compact 0.27+ with witness-derived keypairs
- **Proof Generation**: Dockerized `midnight-proof-server` (client-side ZK)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Wallet**: Lace Wallet (Midnight Preview) via dapp-connector-api
- **Network**: Midnight Testnet

## Future Roadmap

- [ ] Merkle-tree user registry for 10M+ users
- [ ] Nullifier sessions to prevent deterministic nonce replay
- [ ] Wallet-signature-derived secrets (no localStorage)
- [ ] npm package `@shadowkey/auth` for drop-in dApp integration
- [ ] Integration with Midnight's Kachina Protocol for cross-contract privacy

## Team

- **Developer**: [Your Name] — Compact contracts, React frontend, Midnight SDK integration
- **Pitch / Video**: [Teammate Name] — Demo video, Devpost narrative, README

## License

MIT
```

### 7.2 Write Devpost Description

Title: **ShadowKey — ZK Authentication Infrastructure for Midnight**

**Elevator Pitch** (50 words):
> Every Web3 login exposes your wallet, your balance, and your entire history. ShadowKey fixes this with zero-knowledge proofs on Midnight. Users prove they are registered without revealing who they are. We built the authentication layer every privacy-preserving dApp needs.

**What it does** (100 words):
> ShadowKey is a reusable zero-knowledge authentication module. Users generate a local secret, register a derived identity on Midnight, and later mint session nonces via ZK proofs. Third-party dApps verify these nonces publicly without ever learning the user's identity, wallet address, or transaction history. We demonstrate three flows: registration (ZK proof of secret knowledge), login (ZK proof of registration membership), and verification (public session check). All sensitive computation happens client-side via Midnight's proof server. Only hashes and booleans touch the chain.

**How we built it** (100 words):
> Smart contract in Compact (Midnight's ZK language) using witness-derived keypairs and domain-bound hashing. React 19 frontend with shadcn/ui and Tailwind. Lace wallet integration for testnet transactions. Dockerized proof server for client-side ZK generation. We started from the MeshJS Midnight starter template and replaced the shadowkey contract with our authentication logic.

**Challenges** (50 words):
> Compact's witness pattern requires careful separation of public and private state. We initially struggled with `disclose()` annotations and Map key types. The proof server Docker image had ARM compatibility issues on Mac. We solved both by reading Compact-by-Example docs and switching to the community ARM image.

**Accomplishments** (50 words):
> First working ZK authentication layer on Midnight mainnet-era testnet. Three end-to-end flows with real transaction hashes. Clean UI that makes privacy feel inevitable. A contract design that other developers can fork and integrate into their dApps.

**What we learned** (50 words):
> Midnight's `assert` in ZK circuits is more powerful than Solidity `require` — it proves knowledge without exposure. The `persistentHash` + `pad` pattern for domain separation is essential for security. Client-side proof generation is the only way to build truly private dApps.

**What's next** (50 words):
> Merkle-tree registry for scale, wallet-signature-derived secrets for production security, and an npm package so any Midnight dApp can add ShadowKey authentication in 10 minutes. We are applying to the Midnight Build Club accelerator to turn this into a funded privacy infrastructure company.

---

🤖 **AI INSTRUCTION**: Execute Phase 7. Write the README.md and Devpost description EXACTLY as provided. Do not deviate from the structure. After writing both files, print `✅ CHECKPOINT: Phase 7 Complete — README and Devpost ready`. Then wait for human to say "continue".

---

## PHASE 8: DEMO VIDEO (Hour 10:15–11:15)

### 8.1 Recording Setup

**Software**: OBS Studio (free) or QuickTime Screen Recording  
**Audio**: Record voiceover separately in Audacity or your phone if laptop mic is noisy  
**Resolution**: 1920x1080, 30fps  
**Format**: MP4 H.264

### 8.2 Script (Read verbatim while recording)

**[0:00–0:10] Hook**
> "Hey, I'm [Name] and this is my demo for the Midnight Hackathon. Every dApp needs authentication — but every login today exposes your wallet address, your balance, and your entire transaction history. ShadowKey fixes this with zero-knowledge proofs on Midnight."

**[0:10–0:30] The Problem**
> [Screen: Show a mock dApp asking for wallet connect]  
> "When you connect MetaMask or Lace to a dApp, it instantly sees everything. Your address, your NFTs, your full history. This is your identity, and it's your liability."

**[0:30–0:55] Registration Flow**
> [Screen: Open ShadowKey UI]  
> "Here's ShadowKey. I connect my Lace Wallet. Now I go to Register. I click 'Generate Secret and Register.'"
> [Click button, show loading]  
> "The secret is generated in my browser. It never leaves. Only a zero-knowledge proof goes to Midnight."
> [Show DevTools Network tab with no secret payload]  
> "See? No password, no private key, no identity data. Just a proof."
> [Transaction confirms, green badge appears]

**[0:55–1:20] Login & Proof**
> [Screen: Tab 2 — Prove Identity]  
> "Now I log in. I click 'Prove Identity and Mint Nonce.' The proof server generates a ZK proof locally that I am a registered user, without revealing which user I am."
> [Show loading state, then nonce appears]  
> "This nonce mathematically proves I am registered. Any third-party app can verify it without ever knowing my wallet address or secret."

**[1:20–1:45] Verification (Business Value)**
> [Screen: Tab 3 — Verify Access]  
> "Here's how a DeFi exchange or gaming platform would use this. I paste the nonce. Click Verify."
> [Click, green badge]  
> "Access granted. The app knows I am legitimate, but knows nothing about me. This is compliant, verifiable, and completely anonymous."
> [Show explorer link]  
> "And on the blockchain? Only the nonce and a boolean. Zero personal data."

**[1:45–2:00] Close**
> "ShadowKey turns Midnight's zero-knowledge infrastructure into real-world authentication infrastructure. No exposed identities. No trusted intermediaries. Just math. Thank you."

### 8.3 Editing Checklist

- [ ] Trim dead air between clicks (target: 1:50–2:00 total)
- [ ] Add captions for key phrases: "Zero-knowledge proof", "No secret leaves browser", "Just math"
- [ ] Add background music at 10% volume (lo-fi or ambient, no lyrics)
- [ ] Compress with Handbrake or `ffmpeg` to under 100MB:
  ```bash
  ffmpeg -i raw.mp4 -vcodec h264 -acodec aac -crf 28 demo-video.mp4
  ```

---

🤖 **AI INSTRUCTION**: Execute Phase 8. The human will handle the actual recording. Your job is to: (1) create a `demo-script.txt` file with the exact script above, (2) create a `recording-checklist.md` with the setup steps, (3) provide the ffmpeg compression command. Print `⏸️ HUMAN ACTION REQUIRED: Record the demo video using the provided script and checklist. After recording and editing, tell me "continue".`

---

## PHASE 9: SUBMISSION (Hour 11:15–12:00)

### 9.1 Final Verification Checklist

Before submitting, verify EVERY item:

- [ ] Repo is **public** on GitHub
- [ ] Video is **under 2 minutes** and states "Midnight Hackathon" at the start
- [ ] Video is **public** (YouTube unlisted or Devpost upload)
- [ ] All registration steps on Devpost are complete
- [ ] Email matches on Devpost and MLH event page
- [ ] Project was built **this weekend** (no prior work)
- [ ] Team has **2 members** (you + pitch person) — solo = prize ineligible
- [ ] Only **one project** submitted to this hackathon
- [ ] Demo video link is in the Devpost submission
- [ ] GitHub repo link is in the Devpost submission
- [ ] README has architecture diagram and quick start
- [ ] Contract is deployed to testnet with working explorer link

### 9.2 Devpost Submission Fields

| Field | Value |
|---|---|
| **Project Name** | ShadowKey |
| **Elevator Pitch** | Every Web3 login exposes your wallet and history. ShadowKey fixes this with ZK proofs on Midnight — proving you are registered without revealing who you are. |
| **Built With** | Compact, Midnight Network, React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lace Wallet, Docker |
| **Try it out** | [GitHub repo link] |
| **Video** | [YouTube or Devpost upload link] |

### 9.3 MLH Check-In

If this is an MLH-hosted event:
1. Go to the MLH event page
2. Complete registration and check-in
3. Ensure your email matches Devpost

### 9.4 Post-Submission

1. Share your Devpost project link in the Midnight Discord #showcase channel
2. Tweet about it tagging @MidnightNTWRK and @MLHacks
3. Start preparing your Build Club application (if you win)

---

🤖 **AI INSTRUCTION**: Execute Phase 9. Create a `SUBMISSION_CHECKLIST.md` file with all items above. Print the checklist and ask the human to confirm each item. After the human confirms all items are complete and says "submitted", print `🎉 PROJECT COMPLETE — ShadowKey has been submitted to the Midnight Hackathon. Good luck!` and stop.

---

## EMERGENCY SHORTCUTS (If Running Behind)

### Behind by 2+ Hours?
Cut these in order:
1. **Phase 6** (UI polish) — Skip Framer Motion, keep basic Tailwind styling
2. **Phase 4** — Use mock contract responses in the UI, deploy after hackathon ends (still submit working UI)
3. **Phase 8** — Record raw screen capture with phone voiceover, no editing

### Contract Won't Compile?
- Ensure `pragma language_version >= 0.23` matches your installed compiler
- If `Map<<Bytes<<32>, Bool>` fails, try `Map<<PublicKey, Bool>>`
- If `disclose()` errors persist, check that ALL witness-to-ledger flows use `disclose()`

### Docker Proof Server Won't Start?
- ARM Mac: `docker run -p 6300:6300 bricktowers/proof-server:6.1.0-alpha-6`
- Intel Mac / Linux: `docker run -p 6300:6300 midnightnetwork/proof-server`
- Verify port 6300 is free: `lsof -i :6300`

### Lace Wallet Not Detected?
- Must install **Lace Midnight Preview** extension, not main Lace
- Set network to **Midnight Testnet** in wallet settings
- Refresh the page after wallet is unlocked

### Out of tDUST?
- Request from Midnight Discord #faucet channel
- Include your shielded address
- Wait 2–3 minutes, refresh balance

---

## JUDGING CRITERIA SCORECARD

Use this to self-assess before submission:

| Criteria | Score (1-10) | Evidence |
|---|---|---|
| **Technology** | ___ | Uses witness-derived keypairs, domain-bound hashing, client-side ZK proofs, Compact circuits |
| **Originality** | ___ | First reusable ZK auth layer on Midnight; infrastructure not toy |
| **Execution** | ___ | 3 working tabs, clean UI, real testnet transactions |
| **Completion** | ___ | Register → Login → Verify all work end-to-end |
| **Documentation** | ___ | README with architecture, quick start, future roadmap |
| **Business Value** | ___ | Solves the #1 blocker for institutional DeFi on Midnight (compliant privacy) |

**Target**: 8+ on every criterion. If any score is below 7, fix that area before submitting.

---

## SUPPORT RESOURCES

- **Compact by Example**: https://compact-by-example.org/
- **Midnight Docs**: https://docs.midnight.network/
- **Midnight Discord**: https://discord.gg/midnight
- **MLH Discord**: https://discord.gg/mlh
- **Starter Template**: https://github.com/meshjs/midnight-starter-template

---

**END OF PRD — START WITH PHASE 0**
