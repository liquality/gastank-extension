import { TransactionArgs } from "@/utils/interceptor/models";
import {
  dispatchResponse,
  listenToRequest,
} from ".././../utils/interceptor/requests";
import Browser from "webextension-polyfill";

/**
 * Response.
 */
export enum Response {
  Reject,
  Continue,
  Error,
}

export enum BrowserMessageType {
  ProceedAnyway = "proceedAnyway",
  RunSimulation = "runSimulation",
  ApprovedTxn = "approvedTxn",
}

interface BaseBrowserMessage {
  type: BrowserMessageType;
}
export interface ProceedAnywayMessageType extends BaseBrowserMessage {
  url: string;
  permanent: boolean;
}

export interface ApprovedTxnMessageType extends BaseBrowserMessage {
  data: TransactionArgs;
}

export interface RunSimulationMessageType extends BaseBrowserMessage {
  data: TransactionArgs;
}

export type BrowserMessage =
  | ProceedAnywayMessageType
  | ApprovedTxnMessageType
  | RunSimulationMessageType;
const addScript = (url: string) => {
  const container = document.head || document.documentElement;
  const scriptTag = document.createElement("script");
  scriptTag.setAttribute("async", "false");
  scriptTag.setAttribute("src", Browser.runtime.getURL(url));
  container.appendChild(scriptTag);
  scriptTag.onload = () => scriptTag.remove();
};

export enum StoredSimulationState {
  // Currently in the process of simulating.
  Simulating = "Simulating",

  // Successful simulation
  Success = "Success",

  // User has rejected.
  Rejected = "Reject",

  // User has requested we keep going. This could be confirming or skipping.
  Confirmed = "Confirm",
}

const log: Console = console;

log.debug({ msg: "Content Script Loaded" });

let ids: string[] = [];
const maybeRemoveId = (id: string) => {
  if (ids.includes(id)) {
    ids = ids.filter((thisId) => thisId !== id);
    // removeSimulation(id);
  }
};

// Add vendor and injectWalletGuard
addScript("js/injected/index.js");

listenToRequest(async (request: TransactionArgs) => {
  log.info({ request }, "Request");
  ids.push(request.id);

  const currentTab = window.location.href;
  if (currentTab) {
    request.origin = currentTab;
  }

  dispatchResponse({
    id: request.id,
    type: Response.Continue,
  });

});
