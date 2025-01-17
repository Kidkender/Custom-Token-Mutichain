import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  type ParsedAccountData,
} from "@solana/web3.js";
import * as fs from "fs";

export function saveKeypair(wallet: Keypair) {
  const publicKey = wallet.publicKey.toBase58();
  const filePath = `${publicKey}.json`;
  const secretKeyArray = Array.from(wallet.secretKey);

  fs.writeFileSync(filePath, JSON.stringify(secretKeyArray));
  console.log(`Keypair saved to ${filePath}`);
}

export function loadKeypair(publicKey: string): Keypair {
  const filePath = `${publicKey}.json`;

  // if (!fs.existsSync(filePath)) {
  //   console.error(`File ${filePath} does not exist.`);
  //   return null;
  // }

  const secretKeyArray = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const secretKey = Uint8Array.from(secretKeyArray);

  return Keypair.fromSecretKey(secretKey);
}

export function createNewWallet(): Keypair {
  const newWallet = Keypair.generate();
  saveKeypair(newWallet);
  return newWallet;
}

export async function aidropSolana(connection: Connection, address: PublicKey) {
  const airdropSignature = await connection.requestAirdrop(
    address,
    LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(airdropSignature);
  console.log("Airdrop successful");
}

export async function getTokenAccountInfo(
  connection: Connection,
  tokenAccountAddress: PublicKey
) {
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

export async function getNativeAddressFromTokenAccount(
  tokenAccountAddress: PublicKey,
  connection: Connection
): Promise<{ owner: PublicKey | null; mint: PublicKey | null }> {
  const NATIVE_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
  const accountInfo = await connection.getParsedAccountInfo(
    tokenAccountAddress
  );
  if (accountInfo.value) {
    const data = accountInfo.value.data;

    if (data && "parsed" in data) {
      const parsedData = data as ParsedAccountData;
      const owner = parsedData.parsed.info.owner as PublicKey;
      const mint = parsedData.parsed.info.mint as PublicKey;
      return { owner, mint };
    } else if (accountInfo.value.owner.equals(NATIVE_PROGRAM_ID)) {
      return { owner: tokenAccountAddress, mint: null };
    } else {
      console.error("Account data is not parsed or is in raw format.");
    }
  } else {
    console.error(`Token account not found: ${tokenAccountAddress} .`);
  }

  return { owner: tokenAccountAddress, mint: null };
}

export async function getMinimumBalanceForRent(
  publicKey: string,
  connection: Connection
) {
  const accountInfo = await connection.getAccountInfo(new PublicKey(publicKey));
  if (accountInfo) {
    console.log(`Account size: ${accountInfo.data.length} bytes`);
    const accountSize = accountInfo.data.length;
    const minimumBalanceForRent =
      await connection.getMinimumBalanceForRentExemption(accountSize);
    return minimumBalanceForRent;
  } else {
    throw new Error("Account not found or does not exist");
  }
}
