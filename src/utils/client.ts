import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { requestSuiFromFaucetV0, getFaucetHost } from "@mysten/sui.js/faucet";

let _client: SuiClient;
const NETWORK = "localnet";
export const getSuiClient = (): SuiClient => {
  if (!_client) {
    _client = new SuiClient({ url: getFullnodeUrl(NETWORK) });
  }
  return _client;
};

export const makeFaucet = async (address: string) => {
    return await requestSuiFromFaucetV0({
      host: getFaucetHost(NETWORK),
      recipient: address,
    });
  }