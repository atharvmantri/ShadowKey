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
        const shielded = await api.getShieldedBalance();
        const unshielded = await api.getUnshieldedBalance();
        const dust = await api.getDustBalance();

        setBalances({
          shielded: (Number(shielded) / 1e9).toFixed(4),
          unshielded: (Number(unshielded) / 1e9).toFixed(4),
          dust: (Number(dust) / 1e9).toFixed(4),
        });
      }

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
