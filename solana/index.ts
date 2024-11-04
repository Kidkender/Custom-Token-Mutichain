import {
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createMint,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  transfer,
  type Account,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type Commitment,
} from "@solana/web3.js";
import * as fs from "fs";
import * as bs58 from "bs58";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

function saveKeypair(wallet: Keypair) {
  const publicKey = wallet.publicKey.toBase58();
  const filePath = `${publicKey}.json`;
  const secretKeyArray = Array.from(wallet.secretKey);

  fs.writeFileSync(filePath, JSON.stringify(secretKeyArray));
  console.log(`Keypair saved to ${filePath}`);
}

function loadKeypair(publicKey: string): Keypair | null {
  const filePath = `${publicKey}.json`;

  if (!fs.existsSync(filePath)) {
    console.error(`File ${filePath} does not exist.`);
    return null;
  }

  const secretKeyArray = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const secretKey = Uint8Array.from(secretKeyArray);

  return Keypair.fromSecretKey(secretKey);
}

// Only for test
async function aidropSolana(address: PublicKey) {
  const airdropSignature = await connection.requestAirdrop(
    address,
    LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSignature);
  console.log("Airdrop successful");
}

async function createToken(
  fromWallet: Keypair,
  freezeAuth?: PublicKey,
  decimals?: number
): Promise<PublicKey> {
  const mint = await createMint(
    connection,
    fromWallet,
    fromWallet.publicKey,
    null,
    decimals ?? 9
  );
  return mint;
}

function createNewWallet(): Keypair {
  const newWallet = Keypair.generate();
  saveKeypair(newWallet);
  return newWallet;
}

async function mintToken(
  fromWallet: Keypair,
  mint: PublicKey,
  fromTokenAccount: PublicKey
) {
  let signature = await mintTo(
    connection,
    fromWallet,
    mint,
    fromTokenAccount,
    fromWallet.publicKey,
    1000 * LAMPORTS_PER_SOL
  );

  console.log("mint tx: ", signature);
}

async function transferToken(
  fromTokenAccount: Account,
  toTokenAccount: Account,
  mint: PublicKey
) {
  const fromWallet = createNewWallet();

  aidropSolana(fromWallet.publicKey);

  const signature = await transfer(
    connection,
    fromWallet,
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet.publicKey,
    50 * LAMPORTS_PER_SOL
  );

  console.log("transfer tx: ", signature);
}

async function getAllTokensOfAccount(address: PublicKey) {
  const tokenAccounts = await connection.getTokenAccountsByOwner(address, {
    programId: TOKEN_PROGRAM_ID,
  });

  console.log("Token --------------------- balance");
  console.log("-----------------------------------");
  tokenAccounts.value.forEach((tokenAccount) => {
    const accountData = AccountLayout.decode(
      Uint8Array.from(tokenAccount.account.data)
    );
    console.log(
      `${new PublicKey(accountData.mint)}   ${
        accountData.amount / BigInt(LAMPORTS_PER_SOL)
      }`
    );
  });
}

async function getInformationToken(
  address: PublicKey,
  commitment?: Commitment
) {
  const mintToken = await getMint(
    connection,
    address,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("Mint token: ", mintToken);
}

async function getDetailTransaction(signature: string) {
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

async function getTokenTransactions(accountAddress: string) {
  const publicKey = new PublicKey(accountAddress);
  const signatures = await connection.getSignaturesForAddress(publicKey);

  signatures.forEach((signature) => getDetailTransaction(signature.signature));
}

async function generateSignedTransaction(
  fromKeypair: Keypair,
  toPublicKey: PublicKey,
  amountSol: number
): Promise<string> {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: amountSol * LAMPORTS_PER_SOL,
    })
  );

  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  transaction.feePayer = fromKeypair.publicKey;
  transaction.sign(fromKeypair);

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
  amountToken: number
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
        tokenMinterAddress
      )
    );
  }

  transaction.add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromKeypair.publicKey,
      amountToken * LAMPORTS_PER_SOL,
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

async function submitSignedTransaction(signedTransaction: string) {
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

async function getTokenAccountInfo(tokenAccountAddress: PublicKey) {
  const accountInfo = await connection.getParsedAccountInfo(
    tokenAccountAddress
  );
  if (accountInfo.value) {
    const data = accountInfo.value.data;

    if (data && "parsed" in data) {
      const owner = data.parsed.info.owner;
      return owner;
    } else {
      console.log("Account data is not parsed or is in raw format.");
    }
  } else {
    console.log("Token account not found.");
  }
}

async function main() {
  const fromWallet = loadKeypair(
    "627g2t7xE2JsMRRJb35idoenusW2AXjzqQxwydsaSm12"
  );
  const toPublicKey = new PublicKey(
    "EPVaSvZ6iJrX819Kp5mokDWmMzxPdaWGXaYSk559ws6N"
  );

  const tokenAddress = new PublicKey(
    "2nNxEe6WTmWMwH6VUSUN2AuhSosDgQKPiFvLMy2PCuyD"
  );

  if (!fromWallet) {
    return;
  }

  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    tokenAddress,
    fromWallet.publicKey
  );

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    tokenAddress,
    toPublicKey
  );

  //   await mintToken(fromWallet, tokenAddress, fromTokenAccount.address);

  //   const signedTx = await generateSignedTransaction(
  //     fromWallet,
  //     toPublicKey,
  //     0.1
  //   );

  const signedTx = await generateSignedTokenTransaction(
    fromWallet,
    toPublicKey,
    tokenAddress,
    100
  );

  console.log("Tx: " + signedTx);

  //   const address = await getTokenAccountInfo(toTokenAccount.address);
  //   console.log("Owner address ", address);

  // await submitSignedTransaction(signedTx);

  // await transferToken();
  // await getAllTokensOfAccount(
  //   new PublicKey("2TPDhtgQXJ9uR1njeSmae3KS62dMp6cW2WWdSEQYyAXo")
  // );
  //     await getInformationToken(
  //         new PublicKey("6YbpFbafin7XfP7X8NK6pPus7vWHpMzKe1RCSwsqzFHz"))
  // await getDetailTransaction("2NrN7iiwMU7KuBWiLxjosrjAJ2aStW4bufH65Cp8tMZGhhHtLg2ugDYZ22YT2RQYnRaTQ4McsX4UX8MKuCdUFgsK");
  //   await getTokenTransactions("BoKxSSv54PAuCFnKEqdiPewWYR1WeHPBpCoUQ7t3xyXV");
}

main();
