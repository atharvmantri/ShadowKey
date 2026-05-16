import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import { PreviewConfig } from './config';
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

  if (!mnemonic && !seed) {
    console.error('Error: SHADOWKEY_DEPLOYER_MNEMONIC or SHADOWKEY_DEPLOYER_SEED environment variable is required');
    console.error('');
    console.error('Usage:');
    console.error('  SHADOWKEY_DEPLOYER_MNEMONIC="word1 word2 ..." npm run deploy');
    console.error('  SHADOWKEY_DEPLOYER_SEED="hex_seed" npm run deploy');
    process.exit(1);
  }

  console.log('🚀 ShadowKey Contract Deployment');
  console.log('═══════════════════════════════════════════');
  console.log('');

  setNetworkId('preview');
  const config = new PreviewConfig();

  const logDir = path.resolve(__dirname, '..', 'logs', 'deploy');
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

  console.log('📡 Connecting to Midnight Preview network...');
  console.log(`   Indexer: ${config.indexer}`);
  console.log(`   RPC: ${config.node}`);
  console.log(`   Proof Server: ${config.proofServer}`);
  console.log('');

  const walletContext = await api.buildWalletAndWaitForFunds(config, hexSeed);

  try {
    const providers = await api.configureProviders(walletContext, config);
    console.log('');
    console.log('📝 Deploying ShadowKey contract...');

    const uiAddressPath = path.resolve(__dirname, '..', '..', 'shadowkey-ui', 'public', 'contract-address.json');
    const contract = await api.deploy(providers, { privateShadowKey: 0 }, uiAddressPath);
    const address = contract.deployTxData.public.contractAddress;

    console.log('');
    console.log('✅ Contract deployed successfully!');
    console.log(`   Address: ${address}`);
    console.log(`   Explorer: https://explorer.preview.midnight.network/address/${address}`);
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
  } finally {
    await api.closeWallet(walletContext);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
