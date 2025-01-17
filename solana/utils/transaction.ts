import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  type Connection,
  type Keypair,
} from "@solana/web3.js";

import * as bs58 from "bs58";

export async function transferToken(
  fromWallet: Keypair,
  toWallet: Keypair,
  mint: PublicKey,
  amount: number,
  connection: Connection
): Promise<string> {
  const fromTokenAccount = await getAssociatedTokenAddress(
    mint,
    fromWallet.publicKey
  );
  const toTokenAccount = await getAssociatedTokenAddress(
    mint,
    toWallet.publicKey
  );

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromWallet.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const tx = await sendAndConfirmTransaction(connection, transaction, [
    fromWallet,
  ]);

  return tx;
}

export async function generateSignedTransaction(
  fromWallet: Keypair,
  toPublicKey: PublicKey,
  amountSol: number,
  connection: Connection
): Promise<string> {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toPublicKey,
      lamports: amountSol * LAMPORTS_PER_SOL,
    })
  );

  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  transaction.feePayer = fromWallet.publicKey;
  transaction.sign(fromWallet);

  const signedTransaction = transaction.serialize().toString("hex");

  // Hash of transaction
  const hash = bs58.default.encode(transaction.signature as any);
  console.log("hash: " + hash);

  return signedTransaction;
}

async function generateSignedTokenTransaction(
  fromKeypair: Keypair,
  toPublicKey: PublicKey,
  tokenMinterAddress: PublicKey,
  amountToken: number,
  connection: Connection
): Promise<string> {
  const fromTokenAccount = await getAssociatedTokenAddress(
    tokenMinterAddress,
    fromKeypair.publicKey
  );
  const toTokenAccount = await getAssociatedTokenAddress(
    tokenMinterAddress,
    toPublicKey
  );

  const transaction = new Transaction();
  const accountInfo = await connection.getAccountInfo(toTokenAccount);

  if (!accountInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        fromKeypair.publicKey,
        toTokenAccount,
        toPublicKey,
        tokenMinterAddress,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }
  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromKeypair.publicKey,
      amountToken,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  transaction.feePayer = fromKeypair.publicKey;
  transaction.sign(fromKeypair);

  const signedTransaction = transaction.serialize().toString("hex");

  const hash = bs58.default.encode(transaction.signature as any);
  console.log("hash: " + hash);

  return signedTransaction;
}

async function getDetailTransaction(connection: Connection, signature: string) {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (tx) {
      console.log("Tx details: ", tx);
    }
  } catch (error) {
    console.error("Error tx: ", error);
  }
}

export async function getTokenTransactions(
  connection: Connection,
  accountAddress: string
) {
  const publicKey = new PublicKey(accountAddress);
  const signatures = await connection.getSignaturesForAddress(publicKey);

  signatures.forEach((signature) =>
    getDetailTransaction(connection, signature.signature)
  );
}

export async function submitSignedTransaction(
  connection: Connection,
  signedTransaction: string
) {
  try {
    const signedTx = Transaction.from(Buffer.from(signedTransaction, "hex"));

    const txId = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    console.log("Tx successfully with tx: ", txId);
  } catch (error) {
    console.error("Error when submit tx: ", error);
  }
}
