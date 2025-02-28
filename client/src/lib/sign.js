import { ethers } from "ethers";
import { readFileSync } from "fs";

async function signAndBroadcast(
  txHex,
  gasLimit,
  maxFeeGas,
  maxPriorityFeeGas,
  amount,
) {
  console.log("Started");

  // Load configuration
  const config = JSON.parse(readFileSync("./config.json", "utf-8"));
  const privateKey = config.privateKey;
  const rpcURL = config.rpc;

  // Ensure private key is set
  if (!privateKey) {
    throw new Error("Private key is missing in config.json");
  }

  // Initialize the provider using the RPC URL
  const provider = new ethers.JsonRpcProvider(rpcURL);

  // Initialize a new Wallet instance
  const wallet = new ethers.Wallet(privateKey, provider);

  // Parse the raw transaction in Ethers v6
  const tx = ethers.Transaction.from(txHex);

  // Fetch network details and nonce
  const { chainId } = await provider.getNetwork();
  const nonce = await provider.getTransactionCount(wallet.address);

  // Prepare the transaction object correctly
  const txData = {
    to: tx.to,
    data: tx.data,
    chainId: tx.chainId,
    value: amount,
    gasLimit: gasLimit,
    type: 2,
    nonce: nonce,
    maxFeePerGas: ethers.parseUnits(maxFeeGas, "wei"),
    maxPriorityFeePerGas: ethers.parseUnits(maxPriorityFeeGas, "wei"),
  };

  // Sign the transaction correctly
  const signedTransaction = await wallet.signTransaction(txData);

  // Broadcast the signed transaction
  const transactionResponse =
    await provider.broadcastTransaction(signedTransaction);

  console.log(
    "Transaction broadcasted, transaction hash:",
    transactionResponse.hash,
  );

  return transactionResponse;
}

export { signAndBroadcast };
