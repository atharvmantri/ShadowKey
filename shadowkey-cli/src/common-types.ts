import { ShadowKeyContract, type Ledger } from '@eddalabs/shadowkey-contract';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';

export type ShadowKeyCircuits = ImpureCircuitId<ShadowKeyContract<any>>;

export const shadowKeyPrivateStateId = 'shadowKeyPrivateState';

export type ShadowKeyProviders = MidnightProviders<ShadowKeyCircuits, typeof shadowKeyPrivateStateId, { privateShadowKey: number }>;

export type ShadowKeyContractType = ShadowKeyContract<any>;

export type DeployedShadowKeyContract = DeployedContract<ShadowKeyContractType> | FoundContract<ShadowKeyContractType>;

export type UserAction = {
  register: string | undefined;
  login: string | undefined;
  verify: boolean | undefined;
};

export type DerivedState = {
  readonly userCount: bigint;
  readonly registeredUsers: number;
  readonly activeSessions: number;
};

export const emptyState: DerivedState = {
  userCount: 0n,
  registeredUsers: 0,
  activeSessions: 0,
};
