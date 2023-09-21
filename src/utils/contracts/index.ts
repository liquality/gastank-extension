import {
  Ed25519Keypair as KeyPair,
  TransactionBlock,
  SuiTransactionBlockResponse,
} from "@mysten/sui.js";
import { getSuiClient } from "../client";
const MULTISIG_CONTRACT = "0x6c2bc5a26b3177df06ef3d785b0bab1836fa5fd9af85f26814897952aa06c8e5";



export async function createMultisigAccount(
  keypair: KeyPair,
  threshold: number
){
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${MULTISIG_CONTRACT}::multisig::create_multisig_account`,
    arguments: [tx.pure(threshold)],
  });
  const _client = getSuiClient();
  const result = await _client.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
  });

  const txn = await _client.getTransactionBlock({
    digest: result.digest,
    // only fetch the effects field
    options: {
      showEffects: true,
      showInput: false,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: false,
    },
  });

  return txn;
}

// export async function addSigner(
//   keypair: KeyPair,
//   multisigAccount: ObjectId,
//   newSigner: SuiAddress,
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "add_signer",
//     typeArguments: [],
//     arguments: [multisigAccount, newSigner],
//     gasBudget: 1000,
//   });
// }

// export async function batchAddSigner(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   newSigners: Array<SuiAddress>,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "batch_add_signer",
//     typeArguments: [],
//     arguments: [multisigAccount, newSigners],
//     gasBudget: 1000,
//   });
// }

// export async function banSigner(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   newSigner: SuiAddress,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "ban_signer",
//     typeArguments: [],
//     arguments: [multisigAccount, newSigner],
//     gasBudget: 1000,
//   });
// }

// export async function thawBannedSigner(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   newSigner: SuiAddress,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "thaw_banned_signer",
//     typeArguments: [],
//     arguments: [multisigAccount, newSigner],
//     gasBudget: 1000,
//   });
// }

// export async function modifyThreshold(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   newThreshold: number,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "modify_threshold",
//     typeArguments: [],
//     arguments: [multisigAccount, newThreshold],
//     gasBudget: 1000,
//   });
// }

// export async function deposit(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   coinType: string, // eg. "0x2::sui::SUI"
//   coin: ObjectId,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "deposit",
//     typeArguments: [coinType],
//     arguments: [multisigAccount, coinType, coin],
//     gasBudget: 1000,
//   });
// }

// export async function createTransaction(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   balance: number,
//   receiver: SuiAddress,
//   transactionName: string,
//   tokenType: string,
//   lockedBefore: number = 0,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "create_transaction",
//     typeArguments: [],
//     arguments: [
//       multisigAccount,
//       balance,
//       receiver,
//       transactionName,
//       tokenType,
//       lockedBefore,
//     ],
//     gasBudget: 1000,
//   });
// }

// export async function approveTransaction(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   approveCap: ObjectId,
//   transactionName: string,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "approve_transaction",
//     typeArguments: [],
//     arguments: [approveCap, multisigAccount, transactionName],
//     gasBudget: 1000,
//   });
// }

// export async function executeTransaction(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   transactionName: string,
//   coinType: string,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "execute_transaction",
//     typeArguments: [coinType],
//     arguments: [multisigAccount, transactionName],
//     gasBudget: 1000,
//   });
// }

// export async function cancelTransaction(
//   signer: RawSigner,
//   multisigAccount: ObjectId,
//   transactionName: string,
//   contract: SuiAddress
// ): Promise<SuiExecuteTransactionResponse> {
//   return await signer.executeMoveCall({
//     packageObjectId: contract,
//     module: "sui_multisig",
//     function: "cancel_transaction",
//     typeArguments: [],
//     arguments: [multisigAccount, transactionName],
//     gasBudget: 1000,
//   });
// }
