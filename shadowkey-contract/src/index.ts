export { Contract as ShadowKeyContract, ledger } from './managed/shadowkey/contract/index.js';
export type { Witnesses, Ledger, ContractReferenceLocations } from './managed/shadowkey/contract/index.js';
export { getUserSecret } from './witnesses.js';

export type SecretKey = { bytes: Uint8Array };
export type PublicKey = { bytes: Uint8Array };
