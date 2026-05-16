import { createLogger } from "../../logger.js";
import { LogicTestingConfig } from "../../config.js";
import { player1 } from "../shadowkey.test.js";

import {
  Contract,
  type Ledger,
  ledger
} from "../../managed/shadowkey/contract/index.js";
import {
  type shadowkeyPrivateState,
  createPrivateState,
  witnesses
} from "../../witnesses.js";

import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
  CircuitResults,
  CoinPublicKey,
  emptyZswapLocalState,
  ContractAddress
} from "@midnight-ntwrk/compact-runtime";

const config = new LogicTestingConfig();
export const logger = await createLogger(config.logDir);

export class shadowkeySimulator {
  readonly contract: Contract<shadowkeyPrivateState>;
  circuitContext: CircuitContext<shadowkeyPrivateState>;
  userPrivateStates: Record<string, shadowkeyPrivateState>;
  updateUserPrivateState: (newPrivateState: shadowkeyPrivateState) => void;
  contractAddress: ContractAddress;

  constructor(privateState: shadowkeyPrivateState) {
    this.contract = new Contract<shadowkeyPrivateState>(witnesses);
    this.contractAddress = sampleContractAddress();
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState
    } = this.contract.initialState(
      createConstructorContext(
        { privateshadowkey: privateState.privateshadowkey },
        player1
      )
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      currentQueryContext: new QueryContext(
        currentContractState.data,
        this.contractAddress
      ),
      costModel: CostModel.initialCostModel()
    };
    this.userPrivateStates = { ["p1"]: currentPrivateState };
    this.updateUserPrivateState = (newPrivateState: shadowkeyPrivateState) => {};
  }

  static deployContract(secretKey: number): shadowkeySimulator {
    return new shadowkeySimulator(createPrivateState(secretKey));
  }

  createPrivateState(pName: string, secretKey: number): void {
    this.userPrivateStates[pName] = createPrivateState(secretKey);
  }

  private buildTurnContext(
    currentPrivateState: shadowkeyPrivateState
  ): CircuitContext<shadowkeyPrivateState> {
    return {
      ...this.circuitContext,
      currentPrivateState,
    };
  }

  private updateUserPrivateStateByName =
    (name: string) =>
    (newPrivateState: shadowkeyPrivateState): void => {
      this.userPrivateStates[name] = newPrivateState;
    };

  as(name: string): shadowkeySimulator {
    const ps = this.userPrivateStates[name];
    if (!ps) {
      throw new Error(
        `No private state found for user '${name}'. Did you register it?`
      );
    }
    this.circuitContext = this.buildTurnContext(ps);
    this.updateUserPrivateState = this.updateUserPrivateStateByName(name);
    return this;
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): shadowkeyPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCircuitContext(): CircuitContext<shadowkeyPrivateState> {
    return this.circuitContext;
  }

  updateStateAndGetLedger<T>(
    circuitResults: CircuitResults<shadowkeyPrivateState, T>
  ): Ledger {
    this.circuitContext = circuitResults.context;
    this.updateUserPrivateState(circuitResults.context.currentPrivateState);
    return this.getLedger();
  }

  public increment(sender?: CoinPublicKey): Ledger {
    // Update the current context to be the result of executing the circuit.
    const circuitResults = this.contract.impureCircuits.increment({
      ...this.circuitContext,
      currentZswapLocalState: sender
        ? emptyZswapLocalState(sender)
        : this.circuitContext.currentZswapLocalState
    }); 

    logger.info("INCREMET CIRCUIT");
    logger.info({
      section: "Circuit Results",
      gasCost: circuitResults.gasCost,
      proofData: circuitResults.proofData,
      result: circuitResults.result
    });

    return this.updateStateAndGetLedger(circuitResults);
  }
}
