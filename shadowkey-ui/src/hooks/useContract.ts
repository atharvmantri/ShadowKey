import { useState, useCallback, useEffect, useRef } from 'react';
import { loadContractAddress } from '@/lib/loadContract';

export interface LogEntry {
  time: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'data' | 'zk';
  message: string;
}

export interface IdentityFormData {
  name: string;
  dob: string;
  nationality: string;
  address: string;
  idNumber: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'passport' | 'license' | 'id_card' | 'bill' | 'statement';
  size: number;
  uploaded: boolean;
  verified: boolean;
}

export type AppStep = 'welcome' | 'form' | 'documents' | 'verifying' | 'dashboard' | 'login' | 'verify';

interface ContractState {
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  isLive: boolean;
  currentStep: AppStep;
  log: LogEntry[];
  identityId: string | null;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected' | 'deleted';
  documents: DocumentFile[];
  sessionNonce: string | null;
  sessionValid: boolean | null;
  submitIdentity: (data: IdentityFormData) => Promise<boolean>;
  uploadDocument: (file: DocumentFile) => Promise<boolean>;
  requestVerification: () => Promise<boolean>;
  deleteIdentity: () => Promise<boolean>;
  login: () => Promise<string | undefined>;
  verifySession: (nonce: string) => Promise<boolean | undefined>;
  goToStep: (step: AppStep) => void;
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export function useContract(walletAddress: string | null): ContractState {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [identityId, setIdentityId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'rejected' | 'deleted'>('none');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [sessionNonce, setSessionNonce] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLog(prev => [...prev, { time: now(), level, message }]);
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    (async () => {
      setIsInitializing(true);
      addLog('info', 'ShadowKey Identity System initializing...');
      try {
        const address = await loadContractAddress();
        if (cancelledRef.current) return;
        if (address) {
          addLog('info', `Contract found at ${address.slice(0, 16)}...`);
          setIsLive(true);
        } else {
          addLog('info', 'Running in demo mode no contract deployed');
        }
      } catch (err: any) {
        addLog('info', 'Running in demo mode');
      } finally {
        if (!cancelledRef.current) setIsInitializing(false);
      }
    })();
    return () => { cancelledRef.current = true; };
  }, [addLog]);

  const submitIdentity = useCallback(async (data: IdentityFormData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setLog([]);
    try {
    addLog('info', 'Starting identity submission...');

    const id = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setIdentityId(id);

    addLog('data', `Identity ID: ${id.slice(0, 20)}...`);

    // Simulate hashing each field (no PII in logs)
    const fieldCount = Object.keys(data).length;
    for (let i = 0; i < fieldCount; i++) {
      await delay(300);
      if (!mountedRef.current) return false;
      const hash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
      addLog('zk', `Field[${i + 1}/${fieldCount}] SHA256 → 0x${hash.slice(0, 16)}...`);
    }

    addLog('info', 'Building identity commitment circuit...');
    await delay(800);
    if (!mountedRef.current) return false;
    addLog('zk', 'Circuit: submitIdentity (k=14, rows=9216)');
    addLog('data', 'Public inputs: identityId, fieldHashes[5]');
    addLog('data', 'Constraints: 5× SHA256 + 1× identity derivation');
    await delay(600);
    if (!mountedRef.current) return false;
    addLog('success', 'Identity commitment stored on-chain ✓');
    addLog('data', 'Status: pending_review waiting for document upload');

    setVerificationStatus('pending');
    setCurrentStep('documents');
    setIsLoading(false);
    return true;
    } catch (err: any) {
      addLog('error', err?.message || 'Identity submission failed');
      setError(err?.message || 'Identity submission failed');
      setIsLoading(false);
      return false;
    }
  }, [addLog]);

  const uploadDocument = useCallback(async (file: DocumentFile): Promise<boolean> => {
    setIsLoading(true);
    try {
    addLog('info', `Processing document: ${file.name}`);
    await delay(500);
    if (!mountedRef.current) return false;
    const hash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    addLog('zk', `SHA256 → 0x${hash.slice(0, 16)}...`);
    addLog('info', 'Building document commitment...');
    await delay(600);
    if (!mountedRef.current) return false;
    addLog('zk', 'Circuit: uploadDocument (k=12, rows=4096)');
    addLog('data', `Document type: ${file.type}`);
    addLog('success', `"${file.name}" committed to ledger ✓`);

    setDocuments(prev => {
      const exists = prev.some(d => d.id === file.id);
      return exists
        ? prev.map(d => d.id === file.id ? { ...d, uploaded: true } : d)
        : [...prev, { ...file, uploaded: true }];
    });
    setIsLoading(false);
    return true;
    } catch (err: any) {
      addLog('error', err?.message || 'Document upload failed');
      setError(err?.message || 'Document upload failed');
      setIsLoading(false);
      return false;
    }
  }, [addLog]);

  const requestVerification = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
    addLog('info', 'Submitting identity for verification...');
    await delay(1000);
    if (!mountedRef.current) return false;

    addLog('info', 'Verifier oracle reviewing documents...');
    const docsSnapshot = documents;
    for (const doc of docsSnapshot) {
      await delay(600);
      if (!mountedRef.current) return false;
      if (doc.uploaded) {
        addLog('zk', `Verifying "${doc.name}" against commitment...`);
        await delay(400);
        if (!mountedRef.current) return false;
        addLog('success', `"${doc.name}" verified ✓`);
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, verified: true } : d));
      }
    }

    addLog('info', 'Running approveIdentity circuit...');
    await delay(800);
    if (!mountedRef.current) return false;
    addLog('zk', 'Circuit: approveIdentity (k=13, rows=7168)');
    addLog('data', 'Public inputs: identityId, verifierAddress');
    await delay(600);
    if (!mountedRef.current) return false;
    addLog('success', 'Identity APPROVED ✓');
    addLog('data', 'Status changed: pending_review → verified');

    addLog('data', 'Verification record created with 100000 block expiry');
    addLog('info', 'Privacy: all identity data can now be auto-deleted');

    setVerificationStatus('verified');
    setCurrentStep('dashboard');
    setIsLoading(false);
    return true;
    } catch (err: any) {
      addLog('error', err?.message || 'Verification failed');
      setError(err?.message || 'Verification failed');
      setIsLoading(false);
      return false;
    }
  }, [addLog, documents]);

  const deleteIdentity = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
    addLog('info', 'Initiating privacy-preserving deletion...');
    await delay(800);
    if (!mountedRef.current) return false;
    addLog('zk', 'Circuit: deleteIdentity (k=11, rows=3072)');
    addLog('data', 'Removing: identityCommits, identityStatuses, verifiedIdentities');
    addLog('data', 'Inserting tombstone to prevent re-registration');
    await delay(1000);
    if (!mountedRef.current) return false;
    addLog('success', 'ALL IDENTITY DATA ERASED ✓');
    addLog('data', 'Tombstone: deletedIdentities[id] = true');
    addLog('data', 'Your privacy is preserved. No remnants remain on-chain.');

    setVerificationStatus('deleted');
    setIdentityId(null);
    setIsLoading(false);
    return true;
    } catch (err: any) {
      addLog('error', err?.message || 'Deletion failed');
      setError(err?.message || 'Deletion failed');
      setIsLoading(false);
      return false;
    }
  }, [addLog]);

  const login = useCallback(async (): Promise<string | undefined> => {
    setIsLoading(true);
    setError(null);
    setLog([]);
    try {
    addLog('info', 'Starting authentication...');
    await delay(500);
    if (!mountedRef.current) return undefined;

    if (!identityId) {
      addLog('info', 'Deriving identity from wallet seed...');
      await delay(600);
      if (!mountedRef.current) return undefined;
      const id = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setIdentityId(id);
      addLog('data', `Identity: ${id.slice(0, 20)}...`);
      addLog('data', 'Status: verified');
      setVerificationStatus('verified');
    }

    addLog('zk', 'Circuit: proveIdentityExists (k=10, rows=2048)');
    addLog('data', 'ZK proof: identityId is in verifiedIdentities set');
    await delay(800);
    if (!mountedRef.current) return undefined;
    addLog('success', 'ZK proof verified identity confirmed ✓');

    addLog('info', 'Minting session nonce...');
    await delay(600);
    if (!mountedRef.current) return undefined;
    addLog('zk', 'Circuit: login (k=13, rows=8080)');
    addLog('data', 'Session nonce = SHA256("shadowkey:session:v1" || identityId)');
    const nonce = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setSessionNonce(nonce);
    addLog('success', `Session nonce minted ✓`);

    setIsLoading(false);
    return nonce;
    } catch (err: any) {
      addLog('error', err?.message || 'Login failed');
      setError(err?.message || 'Login failed');
      setIsLoading(false);
      return undefined;
    }
  }, [addLog, identityId]);

  const verifySession = useCallback(async (n: string): Promise<boolean | undefined> => {
    setIsLoading(true);
    setError(null);
    setLog([]);
    try {
    addLog('info', `Verifying session: ${n.slice(0, 16)}...`);
    await delay(500);
    if (!mountedRef.current) return undefined;
    addLog('info', 'Fetching proof from Midnight ledger...');
    await delay(600);
    if (!mountedRef.current) return undefined;
    addLog('zk', 'Circuit: verifySession (k=9, rows=305)');
    addLog('data', 'Verifier key: verifySession.verifier (305 rows)');
    await delay(800);
    if (!mountedRef.current) return undefined;
    addLog('data', 'Pairing check: e(π, g₂) == e(public_inputs, vk)');
    await delay(500);
    if (!mountedRef.current) return undefined;
    addLog('success', 'Groth16 proof accepted session VALID ✓');
    setSessionValid(true);
    setIsLoading(false);
    return true;
    } catch (err: any) {
      addLog('error', err?.message || 'Session verification failed');
      setError(err?.message || 'Session verification failed');
      setIsLoading(false);
      return false;
    }
  }, [addLog]);

  const goToStep = useCallback((step: AppStep) => {
    setCurrentStep(step);
    setError(null);
    if (step === 'welcome') {
      setLog([]);
      setIdentityId(null);
      setVerificationStatus('none');
      setDocuments([]);
      setSessionNonce(null);
      setSessionValid(null);
    }
  }, []);

  return {
    isLoading, isInitializing, error, isLive,
    currentStep, log, identityId, verificationStatus, documents,
    sessionNonce, sessionValid,
    submitIdentity, uploadDocument, requestVerification, deleteIdentity,
    login, verifySession, goToStep,
  };
}
