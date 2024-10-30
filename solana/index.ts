import {
  AccountLayout,
  CpiGuardLayout,
  createMint,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  type Commitment,
} from "@solana/web3.js";
import * as fs from "fs";

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

async function transferToken() {
  const fromWallet = Keypair.generate();

  const fromAirdropSignature = await connection.requestAirdrop(
    fromWallet.publicKey,
    LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction(fromAirdropSignature);

  const toWallet = Keypair.generate();

  // Create mint token
  const mint = await createToken(fromWallet);

  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    toWallet.publicKey
  );

  let signature = await mintTo(
    connection,
    fromWallet,
    mint,
    fromTokenAccount.address,
    fromWallet.publicKey,
    1000 * LAMPORTS_PER_SOL
  );

  console.log("mint tx: ", signature);

  signature = await transfer(
    connection,
    fromWallet,
    fromTokenAccount.address,
    toTokenAccount.address,
    fromWallet.publicKey,
    50 * LAMPORTS_PER_SOL
  );
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

async function main() {
  // await transferToke();
  await getAllTokensOfAccount(
    new PublicKey("2TPDhtgQXJ9uR1njeSmae3KS62dMp6cW2WWdSEQYyAXo")
  );
  //     await getInformationToken(
  //         new PublicKey("6YbpFbafin7XfP7X8NK6pPus7vWHpMzKe1RCSwsqzFHz"))

  // await getDetailTransaction("2NrN7iiwMU7KuBWiLxjosrjAJ2aStW4bufH65Cp8tMZGhhHtLg2ugDYZ22YT2RQYnRaTQ4McsX4UX8MKuCdUFgsK");
  //   await getTokenTransactions("BoKxSSv54PAuCFnKEqdiPewWYR1WeHPBpCoUQ7t3xyXV");
}

main();
