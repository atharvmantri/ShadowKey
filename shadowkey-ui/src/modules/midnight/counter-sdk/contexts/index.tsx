import { DeployedProvider } from './shadowkey-deployment';
import { LocalStorageProvider } from './shadowkey-localStorage';
import { Provider } from './shadowkey-providers';
import { Logger } from 'pino';
import { ContractAddress } from '@midnight-ntwrk/compact-runtime';

export * from './shadowkey-providers';
export * from './shadowkey-localStorage';
export * from './shadowkey-localStorage-class';
export * from './shadowkey-deployment';
export * from './shadowkey-deployment-class';

interface AppProviderProps {
  children: React.ReactNode;
  logger: Logger;  
  contractAddress: ContractAddress;
}

export const shadowkeyAppProvider = ({ children, logger, contractAddress }: AppProviderProps) => {
  return (
    <LocalStorageProvider logger={logger}>
      <Provider logger={logger}>
        <DeployedProvider logger={logger} contractAddress={contractAddress}>
          {children}
        </DeployedProvider>
      </Provider>
    </LocalStorageProvider>
  );
};
