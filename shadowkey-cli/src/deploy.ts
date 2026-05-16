import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import { PreprodConfig, PreviewConfig } from './config';
import * as api from './api';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { createLogger } from './logger';
import path from 'node:path';
import fs from 'node:fs';
import { WebSocket } from 'ws';
import pino from 'pino';

// @ts-expect-error: WebSocket needed for apollo
globalThis.WebSocket = WebSocket;

async function main() {
  const mnemonic = process.env.SHADOWKEY_DEPLOYER_MNEMONIC;
  const seed = process.env.SHADOWKEY_DEPLOYER_SEED;
  const network = process.env.SHADOWKEY_NETWORK || 'preprod';

  if (!mnemonic && !seed) {
    console.error('Error: SHADOWKEY_DEPLOYER_MNEMONIC or SHADOWKEY_DEPLOYER_SEED environment variable is required');
    console.error('');
    console.error('Usage:');
    console.error('  SHADOWKEY_DEPLOYER_MNEMONIC="word1 word2 ..." npm run deploy');
    console.error('  SHADOWKEY_NETWORK=preview npm run deploy  (optional, default: preprod)');
    process.exit(1);
  }

  console.log('🚀 ShadowKey Contract Deployment');
  console.log('═══════════════════════════════════════════');
  console.log(`   Network: ${network}`);
  console.log('');

  setNetworkId(network);
  const config = network === 'preview' ? new PreviewConfig() : new PreprodConfig();

  const logDir = path.resolve(__dirname, '..', 'logs', 'deploy');
  fs.mkdirSync(logDir, { recursive: true });
  const logger = await createLogger(path.join(logDir, `${new Date().toISOString()}.log`));

  api.setLogger(logger);

  let hexSeed: string;
  if (mnemonic) {
    const words = mnemonic.trim().split(/\s+/);
    if (!bip39.validateMnemonic(words.join(' '), english)) {
      console.error('Error: Invalid mnemonic phrase');
      process.exit(1);
    }
    const seedBuffer = await bip39.mnemonicToSeed(words.join(' '));
    hexSeed = Buffer.from(seedBuffer).subarray(0, 32).toString('hex');
    console.log('✅ Mnemonic validated');
  } else {
    hexSeed = seed!;
  }

  console.log('📡 Connecting to Midnight network...');
  console.log(`   Indexer: ${config.indexer}`);
  console.log(`   RPC: ${config.node}`);
  console.log(`   Proof Server: ${config.proofServer}`);
  console.log('');

  try {
    const walletContext = await api.buildWalletAndWaitForFunds(config, hexSeed);
    const providers = await api.configureProviders(walletContext, config);

    console.log('📝 Deploying ShadowKey contract...');

    const uiAddressPath = path.resolve(__dirname, '..', '..', 'shadowkey-ui', 'public', 'contract-address.json');
    const contract = await api.deploy(providers, { privateShadowKey: 0 }, uiAddressPath);
    const address = contract.deployTxData.public.contractAddress;

    console.log('');
    console.log('✅ Contract deployed successfully!');
    console.log(`   Address: ${address}`);
    const explorerBase = network === 'preview' ? 'https://explorer.preview.midnight.network' : 'https://explorer.preprod.midnight.network';
    console.log(`   Explorer: ${explorerBase}/address/${address}`);
    console.log('');
    console.log(`💾 Contract address saved to: ${uiAddressPath}`);
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🎉 Deployment complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start the UI: cd shadowkey-ui && npm run dev');
    console.log('  2. Open http://localhost:5173');
    console.log('  3. Connect Lace Wallet and test the 3 flows');

    await api.closeWallet(walletContext);
  } catch (err: any) {
    console.error('');
    console.error('❌ Deployment failed:');
    if (err && typeof err === 'object') {
      if (err.message) console.error(`   ${err.message}`);
      if (err.code) console.error(`   Code: ${err.code}`);
      if (err.details) console.error(`   Details: ${JSON.stringify(err.details).slice(0, 200)}`);
    } else {
      console.error(`   ${String(err)}`);
    }
    console.error('');
    console.error('Common issues:');
    console.error('  - Insufficient tDUST: get tokens from the faucet');
    console.error('  - Wrong network: set SHADOWKEY_NETWORK=preview if using Preview');
    console.error('  - Proof server offline: docker run -d -p 6300:6300 midnightnetwork/proof-server');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
