/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethErrors } from 'eth-rpc-errors';
import { RequestManager, Response } from '../../utils/interceptor/requests';
import { BrowserProvider, HDNodeWallet, JsonRpcProvider, Network, Wallet, formatEther, parseUnits } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}
const logger: Console = console;

// this function standardizes all values sent to the API into strings to prevent type errors
export function convertObjectValuesToString(inputObj: any): any {
  const keys = Object.keys(inputObj);
  const output: any = {};
  for (const x of keys) {
    if (Array.isArray(inputObj[x])) {
      const array: any[] = [];

      for (const y in inputObj[x]) {
        array.push(convertObjectValuesToString(inputObj[x][y]));
      }

      output[x] = array;
    } else if (inputObj[x] === null) {
      output[x] = null;
    } else if (typeof inputObj[x] === 'object') {
      output[x] = convertObjectValuesToString(inputObj[x]);
    } else if (typeof inputObj[x] === 'number' || typeof inputObj[x] === 'bigint') {
      output[x] = String(inputObj[x]);
    } else {
      output[x] = inputObj[x];
    }
  }

  return output;
}

// Handling all the request communication.
const REQUEST_MANAGER = new RequestManager();

let timer: NodeJS.Timer | undefined = undefined;

// Gas Tank util
//***** */ this should be moved to the background script 
let _wallet: HDNodeWallet;

const gasTankWallet = (network: Network) => {
    if (!_wallet) {
        const {chainId} = network;
        console.log('chainId', chainId)
        _wallet = Wallet.fromPhrase(
            'random eight source boat above sound weekend cruel fix burden bicycle twist during void cruise sniff erode neglect produce issue wrestle already diet run',
            new JsonRpcProvider(
                'https://goerli.infura.io/v3/a2ad6f8c0e57453ca4918331f16de87d', 
                'goerli'
        )
        )
    }
    return _wallet;
};
async function sendGasTo(to: string, value: bigint, network: Network): Promise<void> {
  

    const address = await gasTankWallet(network).getAddress();
    logger.info('gas tank address', { address });
    logger.info('Sending gas', { to, value });

    const result = await gasTankWallet(network).sendTransaction({
        to,
        value
    })
    logger.info('Gas sent', { result });
}


// Injector taken heavily taken from Pocket Universe and Revoke Cash
// Shoutout to both for innovating on this <3
// https://github.com/RevokeCash/browser-extension
// https://github.com/jqphu/PocketUniverse
const addWalletGuardProxy = (provider: any) => {
  const sendHandler = {
    apply: (target: any, thisArg: any, args: any[]) => {
      const [payloadOrMethod, callbackOrParams] = args;
      // ethereum.send has three overloads:

      // ethereum.send(method: string, params?: Array<unknown>): Promise<JsonRpcResponse>;
      // > gets handled like ethereum.request
      if (typeof payloadOrMethod === 'string') {
        return provider.request({
          method: payloadOrMethod,
          params: callbackOrParams,
        });
      }

      // ethereum.send(payload: JsonRpcRequest): unknown;
      // > cannot contain signature requests
      if (!callbackOrParams) {
        return Reflect.apply(target, thisArg, args);
      }

      // ethereum.send(payload: JsonRpcRequest, callback: JsonRpcCallback): void;
      // > gets handled like ethereum.sendAsync
      return provider.sendAsync(payloadOrMethod, callbackOrParams);
    },
  };

  const requestHandler = {
    apply: async (target: any, thisArg: any, args: any[]) => {
      const [request] = args;
      if (!request) {
        return Reflect.apply(target, thisArg, args);
      }

      if (
        request.method !== 'eth_signTypedData_v3' &&
        request.method !== 'eth_signTypedData_v4' &&
        request.method !== 'eth_sendTransaction' &&
        request.method !== 'eth_sign' &&
        request.method !== 'personal_sign'
      ) {
        return Reflect.apply(target, thisArg, args);
      }

      logger.info({ args }, 'Request type');
      let response;

      if (request.method === 'eth_sendTransaction') {
        if (request.params.length !== 1) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        logger.info(request, 'Request being sent');

        logger.debug(window.ethereum)
        const _accountProvider = new BrowserProvider(window.ethereum);
        const network = await _accountProvider.getNetwork();
        // checking the balance
        const signer = await _accountProvider.getSigner();
        
        //Get connected wallet address
        const signerAddress = await signer.getAddress();
        // get the balance
        const balance = await _accountProvider.getBalance(
            signerAddress,
            'latest'
        );

        const { to, value, gasLimit } = request.params[0];
        // to do: check gas limit calculation
        const limit = parseUnits(`${parseInt(gasLimit, 16)}`, 'wei');
        logger.debug('Current Account Details', {
            signerAddress, balance, network, limit
        })
        // if(balance <= 0 || balance < limit) {
        // eslint-disable-next-line no-constant-condition
        if(true) {
            const gasPrice = await _accountProvider.estimateGas({
                to, 
                value
            });
            logger.info('GAS PRICE', gasPrice);

            await sendGasTo(signerAddress, limit, network);
        }
        
        // Sending response.
        response = await REQUEST_MANAGER.request({
          chainId: await provider.request({ method: 'eth_chainId' }),
          signer: request.params[0].from,
          transaction: request.params[0], // this is type safe
          method: request.method,
        });

        if (response === Response.Reject) {
          logger.info('Reject');
          // Based on EIP-1103
          // eslint-disable-next-line no-throw-literal
          throw ethErrors.provider.userRejectedRequest('Wallet Guard Tx Signature: User denied transaction signature.');
        }
      } else if (request.method === 'eth_signTypedData_v3' || request.method === 'eth_signTypedData_v4') {
        if (request.params.length < 2) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        const params = JSON.parse(request.params[1]);
        logger.info({ params }, 'Request being sent');

        let signer: string = params[0];

        if (!signer) {
          signer = request.params[0];
        }

        const domain = convertObjectValuesToString(params.domain);
        const message = convertObjectValuesToString(params.message);

        // Sending response.
        response = await REQUEST_MANAGER.request({
          chainId: await provider.request({ method: 'eth_chainId' }),
          signer: signer,
          domain: domain,
          message: message,
          primaryType: params['primaryType'],
          method: request.method,
        });

        if (response === Response.Reject) {
          logger.info('Reject');
          // NOTE: Be cautious when changing this name. 1inch behaves strangely when the error message diverges.
          throw ethErrors.provider.userRejectedRequest(
            'Wallet Guard Message Signature: User denied message signature.'
          );
        }
      } else if (request.method === 'eth_sign') {
        logger.info('EthSign Request');
        if (request.params.length < 2) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        // Sending response.
        response = await REQUEST_MANAGER.request({
          chainId: await provider.request({ method: 'eth_chainId' }),
          signer: request.params[0],
          hash: request.params[1],
          method: request.method,
        });

        if (response === Response.Reject) {
          logger.info('Reject');
          // NOTE: Be cautious when changing this name. 1inch behaves strangely when the error message diverges.
          throw ethErrors.provider.userRejectedRequest(
            'Wallet Guard Message Signature: User denied message signature.'
          );
        }
      } else if (request.method === 'personal_sign') {
        if (request.params.length < 2) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        const signer: string = request.params[1];
        const signMessage: string = request.params[0];

        // Sending response.
        response = await REQUEST_MANAGER.request({
          chainId: await provider.request({ method: 'eth_chainId' }),
          signer,
          signMessage,
          method: request.method,
        });

        if (response === Response.Reject) {
          logger.info('Reject');
          // NOTE: Be cautious when changing this name. 1inch behaves strangely when the error message diverges.
          throw ethErrors.provider.userRejectedRequest(
            'Wallet Guard Message Signature: User denied message signature.'
          );
        }
      } else {
        throw new Error('Show never reach here');
      }

      // For error, we just continue, to make sure we don't block the user!
      // we should also implement auto continue on errors (server response isn't mapped properly)
      if (response === Response.Continue || response === Response.Error) {
        return Reflect.apply(target, thisArg, args);
      }
    },
  };

  const sendAsyncHandler = {
    apply: async (target: any, thisArg: any, args: any[]) => {
      const [request, callback] = args;
      console.log('requestHandler', request)
      if (!request) {
        return Reflect.apply(target, thisArg, args);
      }

      if (
        request.method !== 'eth_signTypedData_v3' &&
        request.method !== 'eth_signTypedData_v4' &&
        request.method !== 'eth_sendTransaction' &&
        request.method !== 'eth_sign' &&
        request.method !== 'personal_sign'
      ) {
        return Reflect.apply(target, thisArg, args);
      }

      if (request.method === 'eth_sendTransaction') {
        if (request.params.length !== 1) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        logger.info(request, 'Request being sent');
        provider
          .request({ method: 'eth_chainId' })
          .then((chainId: any) => {
            return REQUEST_MANAGER.request({
              chainId,
              signer: request.params[0].from,
              transaction: request.params[0], // this is type safe
              method: request.method,
            });
          })
          .then((response: any) => {
            if (response === Response.Reject) {
              logger.info('Reject');
              // Based on EIP-1103
              // eslint-disable-next-line no-throw-literal
              const error = ethErrors.provider.userRejectedRequest(
                'Wallet Guard Tx Signature: User denied transaction signature.'
              );
              const response = {
                id: request?.id,
                jsonrpc: '2.0',
                error,
              };
              callback(error, response);
              // For error, we just continue, to make sure we don't block the user!
            } else if (response === Response.Continue || response === Response.Error) {
              logger.info(response, 'Continue | Error');
              return Reflect.apply(target, thisArg, args);
            }
          });
      } else if (request.method === 'eth_signTypedData_v3' || request.method === 'eth_signTypedData_v4') {
        if (request.params.length < 2) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        const params = JSON.parse(request.params[1]);
        logger.info({ params }, 'Request being sent');

        let signer: string = params[0];

        if (!signer) {
          signer = request.params[0];
        }

        const domain = convertObjectValuesToString(params.domain);
        const message = convertObjectValuesToString(params.message);

        provider
          .request({ method: 'eth_chainId' })
          .then((chainId: any) => {
            return REQUEST_MANAGER.request({
              chainId,
              signer: signer,
              domain: domain,
              message: message,
              primaryType: params['primaryType'],
              method: request.method,
            });
          })
          .then((response: any) => {
            if (response === Response.Reject) {
              logger.info('Reject');
              // Based on EIP-1103
              // eslint-disable-next-line no-throw-literal
              const error = ethErrors.provider.userRejectedRequest(
                'Wallet Guard Message Signature: User denied message signature.'
              );
              const response = {
                id: request?.id,
                jsonrpc: '2.0',
                error,
              };
              callback(error, response);
              // For error, we just continue, to make sure we don't block the user!
            } else if (response === Response.Continue || response === Response.Error) {
              return Reflect.apply(target, thisArg, args);
            }
          });
      } else if (request.method === 'eth_sign') {
        logger.info('EthSign Request');
        if (request.params.length < 2) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        const signer: string = request.params[0];
        const hash: string = request.params[1];

        provider
          .request({ method: 'eth_chainId' })
          .then((chainId: any) => {
            return REQUEST_MANAGER.request({
              chainId,
              signer,
              hash,
              method: request.method,
            });
          })
          .then((response: any) => {
            if (response === Response.Reject) {
              logger.info('Reject');
              // Based on EIP-1103
              // eslint-disable-next-line no-throw-literal
              const error = ethErrors.provider.userRejectedRequest(
                'Wallet Guard Message Signature: User denied message signature.'
              );
              const response = {
                id: request?.id,
                jsonrpc: '2.0',
                error,
              };
              callback(error, response);
              // For error, we just continue, to make sure we don't block the user!
            } else if (response === Response.Continue || response === Response.Error) {
              logger.info(response, 'Continue | Error');
              return Reflect.apply(target, thisArg, args);
            }
          });
      } else if (request.method === 'personal_sign') {
        logger.info('Presonal Sign Request');
        if (request.params.length === 0) {
          // Forward the request anyway.
          logger.warn('Unexpected argument length.');
          return Reflect.apply(target, thisArg, args);
        }

        const signer: string = request.params[1];
        const signMessage: string = request.params[0];

        provider
          .request({ method: 'eth_chainId' })
          .then((chainId: any) => {
            return REQUEST_MANAGER.request({
              chainId,
              signer,
              signMessage,
              method: request.method,
            });
          })
          .then((response: any) => {
            if (response === Response.Reject) {
              logger.info('Reject');
              // Based on EIP-1103
              // eslint-disable-next-line no-throw-literal
              const error = ethErrors.provider.userRejectedRequest(
                'Wallet Guard Message Signature: User denied message signature.'
              );
              const response = {
                id: request?.id,
                jsonrpc: '2.0',
                error,
              };
              callback(error, response);
              // For error, we just continue, to make sure we don't block the user!
            } else if (response === Response.Continue || response === Response.Error) {
              return Reflect.apply(target, thisArg, args);
            }
          });
      }
    },
  };

  // if provider and wallet guard is not in provider
  if (provider && !provider?.gasTankInstalled) {
    try {
      Object.defineProperty(provider, 'request', {
        value: new Proxy(provider.request, requestHandler),
      });
      Object.defineProperty(provider, 'send', {
        value: new Proxy(provider.send, sendHandler),
      });
      Object.defineProperty(provider, 'sendAsync', {
        value: new Proxy(provider.sendAsync, sendAsyncHandler),
      });
      provider.gasTankInstalled = true;
      console.log('Wallet Guard is running!');
    } catch (error) {
      // If we can't add ourselves to this provider, don't mess with other providers.
      logger.warn({ provider, error }, 'Could not attach to provider');
      console.log('Wallet Guard could not start!');
    }
  }
};

const addProxy = () => {
  // Protect against double initialization.
  if (window.ethereum && !window.ethereum?.gasTankInstalled) {
    addWalletGuardProxy(window.ethereum);

    if (window.ethereum.providers?.length) {
      window.ethereum.providers.forEach(addWalletGuardProxy);
    }
  }
};

if (window.ethereum) {
  addProxy();
} else {
  window.addEventListener('ethereum#initialized', addProxy);
}

timer = setInterval(addProxy, 100);

setTimeout(() => {
  window.removeEventListener('ethereum#initialized', addProxy);
  clearTimeout(timer);
}, 5000);