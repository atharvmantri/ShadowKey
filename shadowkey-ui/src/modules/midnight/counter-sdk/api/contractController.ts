import { type Logger } from 'pino';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import * as Rx from 'rxjs';
import { shadowkeyPrivateStateId, shadowkeyProviders, DeployedshadowkeyContract, emptyState, UserAction, type DerivedState } from './common-types';
import { shadowkey, shadowkeyPrivateState, createPrivateState } from '@eddalabs/shadowkey-contract';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

const shadowkeyCompiledContract = CompiledContract.make('shadowkey', shadowkey.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(`${window.location.origin}/midnight/shadowkey`),
);

export interface ContractControllerInterface {
  readonly deployedContractAddress: ContractAddress;   
  readonly state$: Rx.Observable<DerivedState>;
  increment: () => Promise<void>;
}

export class ContractController implements ContractControllerInterface {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Rx.Observable<DerivedState>;
  readonly privateStates$: Rx.Subject<shadowkeyPrivateState>;
  readonly turns$: Rx.Subject<UserAction>;  

  private constructor(
    public readonly contractPrivateStateId: typeof shadowkeyPrivateStateId,
    public readonly deployedContract: DeployedshadowkeyContract,
    public readonly providers: shadowkeyProviders,
    private readonly logger: Logger,
  ) {
    const combine = (_acc: DerivedState, value: DerivedState): DerivedState => {
      return {
        round: value.round,
        privateState: value.privateState,
        turns: value.turns,        
      };
    };
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.turns$ = new Rx.Subject<UserAction>();
    this.privateStates$ = new Rx.Subject<shadowkeyPrivateState>();
    this.state$ = Rx.combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, { type: 'all' })
          .pipe(Rx.map((contractState) => shadowkey.ledger(contractState.data))),
        Rx.concat(
          Rx.from(
            Rx.defer(() => providers.privateStateProvider.get(contractPrivateStateId) as Promise<shadowkeyPrivateState>),
          ),
          this.privateStates$,
        ),
        Rx.concat(Rx.of<UserAction>({ increment: undefined }), this.turns$),
      ],
      (ledgerState, privateState, userActions) => {
        const result: DerivedState = {
          round: ledgerState.round,
          privateState: privateState,
          turns: userActions,
        };
        return result;
      },
    ).pipe(
      Rx.scan(combine, emptyState),
      Rx.retry({
        // sometimes websocket fails, if want to add attempts, include count in the object
        delay: 500,
      }),
    );
  }

  async increment(): Promise<void> {
    this.logger?.info('incrementing shadowkey');
    this.turns$.next({ increment: 'incrementinng the shadowkey' });

    try {
      const txData = await this.deployedContract.callTx.increment();
      this.logger?.trace({
        increment: {
          message: 'incrementing the shadowkey - blockchain info',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
      this.turns$.next({
        increment: undefined,
      });
    } catch (e) {
      this.turns$.next({
        increment: undefined,
      });
      throw e;
    }
  }

  static async deploy(
    contractPrivateStateId: typeof shadowkeyPrivateStateId,    
    providers: shadowkeyProviders,
    logger: Logger,
  ): Promise<ContractController> {
    logger.info({
      deployContract: {
        action: "Deploying contract",
        contractPrivateStateId, 
        providers       
      },
    });    
    const deployedContract = await deployContract(providers, {
      compiledContract: shadowkeyCompiledContract,
      privateStateId: contractPrivateStateId,
      initialPrivateState: await ContractController.getPrivateState(contractPrivateStateId, providers.privateStateProvider),
    });

    logger.trace({
      contractDeployed: {
        action: "Contract was deployed",
        contractPrivateStateId,
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new ContractController(contractPrivateStateId, deployedContract, providers, logger);
  }

  static async join(
    contractPrivateStateId: typeof shadowkeyPrivateStateId,   
    providers: shadowkeyProviders,
    contractAddress: ContractAddress,
    logger: Logger,
  ): Promise<ContractController> {
    logger.info({
      joinContract: {
        action: "Joining contract",
        contractPrivateStateId,
        contractAddress,
      },
    });

    const deployedContract = await findDeployedContract(providers, {
      contractAddress,
      compiledContract: shadowkeyCompiledContract,
      privateStateId: contractPrivateStateId,
      initialPrivateState: await ContractController.getPrivateState(contractPrivateStateId, providers.privateStateProvider),
    });

    logger.trace({
      contractJoined: {
        action: "Join the contract successfully",
        contractPrivateStateId,
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new ContractController(contractPrivateStateId, deployedContract, providers, logger);
  }

  private static async getPrivateState(
    shadowkeyPrivateStateId: typeof shadowkeyPrivateStateId,
    privateStateProvider: PrivateStateProvider<typeof shadowkeyPrivateStateId, shadowkeyPrivateState>,
  ): Promise<shadowkeyPrivateState> {
    const existingPrivateState = await privateStateProvider.get(shadowkeyPrivateStateId);
    const initialState = await this.getOrCreateInitialPrivateState(shadowkeyPrivateStateId, privateStateProvider);
    return existingPrivateState ?? initialState;
  }

  static async getOrCreateInitialPrivateState(
    shadowkeyPrivateStateId: typeof shadowkeyPrivateStateId,
    privateStateProvider: PrivateStateProvider<typeof shadowkeyPrivateStateId, shadowkeyPrivateState>,
  ): Promise<shadowkeyPrivateState> {
    let state = await privateStateProvider.get(shadowkeyPrivateStateId);
    
    if (state === null) {
      state = this.createPrivateState(0);
      await privateStateProvider.set(shadowkeyPrivateStateId, state);
    }
    return state;
  }

  private static createPrivateState(value: number): shadowkeyPrivateState {    
    return createPrivateState(value);
  }
}
