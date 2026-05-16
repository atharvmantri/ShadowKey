import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  getIdentitySecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  submitIdentity(context: __compactRuntime.CircuitContext<PS>,
                 nameRaw_0: Uint8Array,
                 dobRaw_0: Uint8Array,
                 nationalityRaw_0: Uint8Array,
                 addressRaw_0: Uint8Array,
                 idNumberRaw_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  uploadDocument(context: __compactRuntime.CircuitContext<PS>,
                 docRaw_0: Uint8Array,
                 docType_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  approveIdentity(context: __compactRuntime.CircuitContext<PS>,
                  identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  rejectIdentity(context: __compactRuntime.CircuitContext<PS>,
                 identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  deleteIdentity(context: __compactRuntime.CircuitContext<PS>,
                 identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveIdentityExists(context: __compactRuntime.CircuitContext<PS>,
                      identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  proveField(context: __compactRuntime.CircuitContext<PS>,
             identityId_0: Uint8Array,
             fieldValue_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  login(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifySession(context: __compactRuntime.CircuitContext<PS>,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type ProvableCircuits<PS> = {
  submitIdentity(context: __compactRuntime.CircuitContext<PS>,
                 nameRaw_0: Uint8Array,
                 dobRaw_0: Uint8Array,
                 nationalityRaw_0: Uint8Array,
                 addressRaw_0: Uint8Array,
                 idNumberRaw_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  uploadDocument(context: __compactRuntime.CircuitContext<PS>,
                 docRaw_0: Uint8Array,
                 docType_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  approveIdentity(context: __compactRuntime.CircuitContext<PS>,
                  identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  rejectIdentity(context: __compactRuntime.CircuitContext<PS>,
                 identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  deleteIdentity(context: __compactRuntime.CircuitContext<PS>,
                 identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveIdentityExists(context: __compactRuntime.CircuitContext<PS>,
                      identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  proveField(context: __compactRuntime.CircuitContext<PS>,
             identityId_0: Uint8Array,
             fieldValue_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  login(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifySession(context: __compactRuntime.CircuitContext<PS>,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  submitIdentity(context: __compactRuntime.CircuitContext<PS>,
                 nameRaw_0: Uint8Array,
                 dobRaw_0: Uint8Array,
                 nationalityRaw_0: Uint8Array,
                 addressRaw_0: Uint8Array,
                 idNumberRaw_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  uploadDocument(context: __compactRuntime.CircuitContext<PS>,
                 docRaw_0: Uint8Array,
                 docType_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  approveIdentity(context: __compactRuntime.CircuitContext<PS>,
                  identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  rejectIdentity(context: __compactRuntime.CircuitContext<PS>,
                 identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  deleteIdentity(context: __compactRuntime.CircuitContext<PS>,
                 identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveIdentityExists(context: __compactRuntime.CircuitContext<PS>,
                      identityId_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  proveField(context: __compactRuntime.CircuitContext<PS>,
             identityId_0: Uint8Array,
             fieldValue_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  login(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  verifySession(context: __compactRuntime.CircuitContext<PS>,
                nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
}

export type Ledger = {
  identityCommits: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { nameHash: Uint8Array,
                                 dobHash: Uint8Array,
                                 nationalityHash: Uint8Array,
                                 addressHash: Uint8Array,
                                 idNumberHash: Uint8Array
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { nameHash: Uint8Array,
  dobHash: Uint8Array,
  nationalityHash: Uint8Array,
  addressHash: Uint8Array,
  idNumberHash: Uint8Array
}]>
  };
  identityStatuses: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  documentCommits: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { docHash: Uint8Array, docType: bigint };
    [Symbol.iterator](): Iterator<[Uint8Array, { docHash: Uint8Array, docType: bigint }]>
  };
  verifiedIdentities: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  verificationRecords: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { identityId: Uint8Array,
                                 verifiedAt: bigint,
                                 expiresAt: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { identityId: Uint8Array, verifiedAt: bigint, expiresAt: bigint }]>
  };
  deletedIdentities: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  activeSessions: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly totalRegistered: bigint;
  readonly totalVerified: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
