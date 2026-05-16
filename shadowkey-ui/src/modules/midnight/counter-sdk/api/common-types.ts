import { type shadowkeyPrivateState, shadowkey, createPrivateState } from '@eddalabs/shadowkey-contract';
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';

export type shadowkeyCircuits = ImpureCircuitId<shadowkey.Contract<shadowkeyPrivateState>>;

export const shadowkeyPrivateStateId = 'shadowkeyPrivateState';

export type shadowkeyProviders = MidnightProviders<shadowkeyCircuits, typeof shadowkeyPrivateStateId, shadowkeyPrivateState>;

export type shadowkeyContract = shadowkey.Contract<shadowkeyPrivateState>;

export type DeployedshadowkeyContract = DeployedContract<shadowkeyContract> | FoundContract<shadowkeyContract>;

export type UserAction = {
  increment: string | undefined;  
};

export type DerivedState = {
  readonly round: shadowkey.Ledger["round"];
  readonly privateState: shadowkeyPrivateState;
  readonly turns: UserAction;
};

export const emptyState: DerivedState = {
  round: 0n,
  privateState: createPrivateState(0),
  turns: { increment: undefined },
};
