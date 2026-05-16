import path from 'path';
import * as api from '../api';
import { type shadowkeyProviders } from '../common-types';
import { currentDir } from '../config';
import { createLogger } from '../logger';
import { TestEnvironment } from './simulators/simulator';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'dotenv/config';
import * as Rx from 'rxjs';

let logDir: string;
const network = process.env.TEST_ENV || 'undeployed';
if (network === 'undeployed') {
  logDir = path.resolve(currentDir, '..', 'logs', 'test-undeployed', `${new Date().toISOString()}.log`);
} else if (network === 'preprod') {
  logDir = path.resolve(currentDir, '..', 'logs', 'test-preprod', `${new Date().toISOString()}.log`);
} else {
  logDir = path.resolve(currentDir, '..', 'logs', 'test-preview', `${new Date().toISOString()}.log`);
}
const logger = await createLogger(logDir);

describe('API', () => {
  let testEnvironment: TestEnvironment;
  let wallet: api.WalletContext;
  let providers: shadowkeyProviders;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      logger.info(`Test configuration: ${JSON.stringify(testConfiguration)}`);
      wallet = await testEnvironment.getWallet();
      providers = await api.configureProviders(wallet, testConfiguration.dappConfig);
    },
    1000 * 60 * 45,
  );

  afterAll(async () => {
    await testEnvironment.shutdown();
  });

  it('should deploy the contract and increment the shadowkey [@slow]', async () => {
    const shadowkeyContractDeployed = await api.deploy(providers, { privateshadowkey: 0 });
    expect(shadowkeyContractDeployed).not.toBeNull();

    const shadowkey = await api.displayshadowkeyValue(providers, shadowkeyContractDeployed);
    expect(shadowkey.shadowkeyValue).toEqual(BigInt(0));

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const response = await api.increment(shadowkeyContractDeployed);

    const state = await Rx.firstValueFrom(wallet.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
    logger.info({
      section: 'DUST Wallet State',
      dust: state.dust,
    });
    logger.info({
      section: 'Shielded Wallet State',
      shielded: state.shielded,
    });
    logger.info({
      section: 'Unshielded Wallet State',
      unshielded: state.unshielded,
    });

    expect(response.txHash).toMatch(/[0-9a-f]{64}/);
    expect(response.blockHeight).toBeGreaterThan(BigInt(0));

    const shadowkeyAfter = await api.displayshadowkeyValue(providers, shadowkeyContractDeployed);
    expect(shadowkeyAfter.shadowkeyValue).toEqual(BigInt(1));
    expect(shadowkeyAfter.contractAddress).toEqual(shadowkey.contractAddress);
  });

  it('Wallet Funcitonalities', async () => {
    logger.info({
      section: 'Wallet Context',
      dustSecretKey: wallet.dustSecretKey,
      sshieldedSecretKeys: wallet.shieldedSecretKeys,
      unshieldedKeystore: wallet.unshieldedKeystore,
    });
  });
});
