import { useState, useEffect, useCallback } from 'react';

interface WalletState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
  balances: {
    shielded: string;
    unshielded: string;
    dust: string;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
}

function findLaceProvider(): any {
  const w = window as any;
  const midnight = w.midnight;
  if (!midnight || typeof midnight !== 'object') return null;
  for (const key of Object.keys(midnight)) {
    const provider = midnight[key];
    if (provider && (typeof provider.connect === 'function' || provider.enable || provider.apiVersion)) {
      return provider;
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

  useEffect(() => {
    const checkWallet = () => {
      setIsInstalled(!!findLaceProvider());
    };
    checkWallet();
    const interval = setInterval(checkWallet, 500);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const lace = findLaceProvider();
      if (!lace) {
        setError('Lace wallet not found');
        return;
      }

      if (typeof lace.connect !== 'function') {
        setError('Wallet provider has no connect method');
        return;
      }

      const networks = ['preview', 'preprod', undefined];
      let api: any = null;
      for (const net of networks) {
        try {
          api = await lace.connect(net);
          if (api) break;
        } catch { continue; }
      }
      if (!api) {
        api = await lace.enable?.() ?? await lace.connect();
      }
      if (!api) {
        setError('Could not connect to any network');
        return;
      }

      try {
        const addresses = await api.getShieldedAddresses();
        setAddress(addresses.shieldedAddress);
      } catch {
        const addr = await api.getChangeAddress();
        setAddress(addr);
      }

      try {
        const shieldedBal = await api.getShieldedBalances();
        const unshieldedBal = await api.getUnshieldedBalances();
        const dustBal = await api.getDustBalance();

        const shieldedValue = Object.values(shieldedBal).reduce((sum: bigint, val: bigint) => sum + val, 0n);
        const unshieldedValue = Object.values(unshieldedBal).reduce((sum: bigint, val: bigint) => sum + val, 0n);

        setBalances({
          shielded: (Number(shieldedValue) / 1e9).toFixed(4),
          unshielded: (Number(unshieldedValue) / 1e9).toFixed(4),
          dust: (Number(dustBal.balance) / 1e9).toFixed(4),
        });
      } catch {
        try {
          const shielded = await api.getShieldedBalance();
          const unshielded = await api.getUnshieldedBalance();
          const dust = await api.getDustBalance();

          setBalances({
            shielded: (Number(shielded) / 1e9).toFixed(4),
            unshielded: (Number(unshielded) / 1e9).toFixed(4),
            dust: (Number(dust) / 1e9).toFixed(4),
          });
        } catch {
          // Balances not available — ignore
        }
      }

      setIsConnected(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setError(null);
    setBalances({ shielded: '0', unshielded: '0', dust: '0' });
  }, []);

  return { isInstalled, isConnected, address, error, balances, connect, disconnect };
}
