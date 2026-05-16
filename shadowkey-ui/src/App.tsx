import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { WalletConnect } from './components/WalletConnect';
import { RegisterCard } from './components/RegisterCard';
import { LoginCard } from './components/LoginCard';
import { VerifyCard } from './components/VerifyCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function App() {
  const { isInstalled, isConnected, address, balances, connect, disconnect } = useWallet();
  const { isLoading, isInitializing, error, contractAddress, isLive, register, login, verifySession } = useContract(address);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-400" />
          <p className="text-slate-400">Loading ShadowKey...</p>
        </div>
      </div>
    );
  }

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
            <Badge variant="outline" className="text-xs border-slate-700 text-slate-500 ml-2">
              {isLive ? 'Live' : 'Demo'}
            </Badge>
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
          {contractAddress && (
            <div className="mt-3 text-xs font-mono text-slate-600">
              Contract: {contractAddress.slice(0, 16)}...{contractAddress.slice(-8)}
            </div>
          )}
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
