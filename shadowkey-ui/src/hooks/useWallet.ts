import { useState, useEffect, useCallback, useRef } from 'react';

interface WalletState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
  balances: { shielded: string; unshielded: string; dust: string };
  connect: () => Promise<void>;
  connectDemo: () => void;
  disconnect: () => void;
}

function findLaceProvider(): any {
  const w = window as any;
  const midnight = w.midnight;
  if (!midnight || typeof midnight !== 'object') return null;
  for (const key of Object.keys(midnight)) {
    const p = midnight[key];
    if (p && typeof p === 'object') {
      if (typeof p.connect === 'function') return p;
      if (typeof p.enable === 'function') return p;
    }
  }
  return null;
}

export function useWallet(): WalletState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState({ shielded: '0', unshielded: '0', dust: '0' });
  const connectingRef = useRef(false);

  useEffect(() => {
    const check = () => setIsInstalled(!!findLaceProvider());
    check();
    window.addEventListener('midnight_provider_ready', check);
    return () => window.removeEventListener('midnight_provider_ready', check);
  }, []);

  const connect = useCallback(async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setError(null);
    setAddress(null);
    setBalances({ shielded: '0', unshielded: '0', dust: '0' });
    setIsConnected(false);
    try {
      const lace = findLaceProvider();
      if (!lace) { setError('Lace wallet not installed'); return; }

      const networks = ['preview', 'preprod', 'devnet', undefined] as const;
      let api: any = null;
      for (const net of networks) {
        try {
          api = await lace.connect(net);
          if (api) break;
        } catch { continue; }
      }
      if (!api) try { api = await lace.enable?.(); } catch { /* skip */ }
      if (!api) try { api = await lace.connect(); } catch { /* skip */ }
      if (!api) { setError('Could not connect. Ensure Lace is on Midnight Preview network.'); return; }

      // Extract address
      let addr: string | null = null;
      try {
        const addrs = await api.getShieldedAddresses?.();
        addr = addrs?.shieldedAddress || addrs?.[0] || null;
        if (!addr) throw new Error('no shielded');
      } catch {
        try {
          const raw = await api.getChangeAddress?.();
          addr = raw || null;
        } catch { /* address unavailable */ }
      }
      if (addr) setAddress(addr);

      // Extract balances
      try {
        const sb = await api.getShieldedBalances?.();
        const ub = await api.getUnshieldedBalances?.();
        const db = await api.getDustBalance?.();
        const s = sb ? Object.values(sb).reduce((a: bigint, b: bigint) => a + b, 0n) : 0n;
        const u = ub ? Object.values(ub).reduce((a: bigint, b: bigint) => a + b, 0n) : 0n;
        setBalances({
          shielded: (Number(s) / 1e12).toFixed(2),
          unshielded: (Number(u) / 1e12).toFixed(2),
          dust: db ? (Number(db.balance ?? db) / 1e12).toFixed(2) : '0',
        });
      } catch {
        try {
          const s = await api.getShieldedBalance?.();
          const u = await api.getUnshieldedBalance?.();
          const d = await api.getDustBalance?.();
          setBalances({
            shielded: s ? (Number(s) / 1e12).toFixed(2) : '0',
            unshielded: u ? (Number(u) / 1e12).toFixed(2) : '0',
            dust: d ? (Number(d.balance ?? d) / 1e12).toFixed(2) : '0',
          });
        } catch { /* balances unavailable */ }
      }

      setIsConnected(true);
    } catch (err: any) {
      setError(err?.message || 'Connection failed');
    } finally {
      connectingRef.current = false;
    }
  }, []);

  const connectDemo = useCallback(() => {
    setIsConnected(true);
    setAddress('0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''));
    setBalances({ shielded: '100.00', unshielded: '50.00', dust: '0.01' });
    setError(null);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setError(null);
    setBalances({ shielded: '0', unshielded: '0', dust: '0' });
  }, []);

  return { isInstalled, isConnected, address, error, balances, connect, connectDemo, disconnect };
}