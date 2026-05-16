import { useState, useCallback, useEffect, useRef } from 'react';
import { loadContractAddress } from '@/lib/loadContract';

interface ContractState {
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  contractAddress: string | null;
  isLive: boolean;
  register: () => Promise<string | undefined>;
  login: () => Promise<{ nonce: string; txHash: string } | undefined>;
  verifySession: (nonce: string) => Promise<boolean | undefined>;
}

const EXPLORER_BASE = 'https://explorer.preview.midnight.network';

function mapCompactError(message: string): string {
  if (message.includes('User not registered')) {
    return 'You must register before logging in.';
  }
  if (message.toLowerCase().includes('proof') && message.toLowerCase().includes('server')) {
    return 'Proof server offline. Start Docker and retry.';
  }
  if (message.toLowerCase().includes('dust') || message.toLowerCase().includes('insufficient')) {
    return 'Get testnet tDUST from the Midnight faucet.';
  }
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('testnet')) {
    return 'Switch Lace to Midnight Testnet in wallet settings.';
  }
  return message;
}

export function useContract(walletAddress: string | null): ContractState {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const providersRef = useRef<any>(null);
  const contractRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsInitializing(true);
      try {
        const address = await loadContractAddress();
        if (cancelled) return;

        if (address) {
          setContractAddress(address);
          try {
            const { CompiledContract } = await import('@midnight-ntwrk/compact-js');
            const { ShadowKeyContract } = await import('@eddalabs/shadowkey-contract');

            const compiledContract = CompiledContract.make('shadowkey', ShadowKeyContract).pipe(
              CompiledContract.withVacantWitnesses,
              CompiledContract.withCompiledFileAssets('/midnight/shadowkey'),
            );

            providersRef.current = { compiledContract, address };
            setIsLive(true);
          } catch (err: any) {
            console.warn('Contract initialization failed, using mock mode:', err.message);
            setIsLive(false);
          }
        } else {
          console.warn('No contract address found. Deploy contract first.');
          setIsLive(false);
        }
      } catch (err: any) {
        console.warn('Contract initialization failed:', err.message);
        setIsLive(false);
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const register = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isLive && providersRef.current) {
        const { deployContract, findDeployedContract, createCircuitCallTxInterface, submitTx } = await import('@midnight-ntwrk/midnight-js-contracts');
        const { getUserSecret } = await import('@eddalabs/shadowkey-contract');

        const { compiledContract, address } = providersRef.current;

        const contract = await findDeployedContract(providersRef.current.providers, {
          contractAddress: address,
          compiledContract,
          privateStateId: 'shadowKeyPrivateState',
          initialPrivateState: { privateShadowKey: 0 },
        });

        const callTx = contract.callTx;
        const finalizedTxData = await callTx.register();
        return finalizedTxData.public.txId;
      }

      // Mock fallback
      await new Promise(r => setTimeout(r, 2000));
      return 'mock-tx-hash-register';
    } catch (err: any) {
      const userMessage = mapCompactError(err.message || 'Registration failed');
      setError(userMessage);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isLive]);

  const login = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isLive && providersRef.current) {
        const { compiledContract, address } = providersRef.current;

        const contract = await findDeployedContract(providersRef.current.providers, {
          contractAddress: address,
          compiledContract,
          privateStateId: 'shadowKeyPrivateState',
          initialPrivateState: { privateShadowKey: 0 },
        });

        const callTx = contract.callTx;
        const finalizedTxData = await callTx.login();
        const nonce = Buffer.from(finalizedTxData.private.result).toString('hex');
        return { nonce, txHash: finalizedTxData.public.txId };
      }

      // Mock fallback
      await new Promise(r => setTimeout(r, 2000));
      const mockNonce = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return { nonce: mockNonce, txHash: 'mock-tx-hash-login' };
    } catch (err: any) {
      const userMessage = mapCompactError(err.message || 'Login failed');
      setError(userMessage);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isLive]);

  const verifySession = useCallback(async (nonce: string) => {
    if (!walletAddress || !nonce) return;
    setIsLoading(true);
    setError(null);
    try {
      if (isLive && providersRef.current) {
        const { compiledContract, address } = providersRef.current;

        const contract = await findDeployedContract(providersRef.current.providers, {
          contractAddress: address,
          compiledContract,
          privateStateId: 'shadowKeyPrivateState',
          initialPrivateState: { privateShadowKey: 0 },
        });

        const callTx = contract.callTx;
        const nonceBytes = new Uint8Array(Buffer.from(nonce, 'hex'));
        const result = await callTx.verifySession(nonceBytes);
        return result.private.result;
      }

      // Mock fallback
      await new Promise(r => setTimeout(r, 1500));
      return true;
    } catch (err: any) {
      const userMessage = mapCompactError(err.message || 'Verification failed');
      setError(userMessage);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, isLive]);

  return { isLoading, isInitializing, error, contractAddress, isLive, register, login, verifySession };
}
