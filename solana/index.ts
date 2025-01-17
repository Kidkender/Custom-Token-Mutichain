import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { readFileSync } from "fs";

import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { createToken } from "./utils/token";
import { loadKeypair } from "./utils/wallet";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const connectionMainnet = new Connection(
  clusterApiUrl("mainnet-beta"),
  "confirmed"
);

async function main() {
  const metadata = JSON.parse(readFileSync("./metadata.json", "utf-8"));

  const fromWallet = loadKeypair(
    "627g2t7xE2JsMRRJb35idoenusW2AXjzqQxwydsaSm12"
  );
  const toPublicKey = new PublicKey(
    "EPVaSvZ6iJrX819Kp5mokDWmMzxPdaWGXaYSk559ws6N"
  );

  if (!fromWallet) {
    return;
  }

  const token = await createToken(
    fromWallet,
    connection,
    metadata.name,
    metadata.symbol,
    metadata.uri,
    metadata.decimals,
    200_000_000
  );
  const mintAddress = new PublicKey(token);

  const destinationAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mintAddress,
    fromWallet.publicKey,
    false,
    "confirmed",
    undefined,
    TOKEN_PROGRAM_ID
  );

  console.log("destinationAccount: " + destinationAccount.address);

  const ata = await getAssociatedTokenAddress(
    mintAddress,
    fromWallet.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  console.log("Associated Token Address:", ata.toBase58());

  const accountInfo = await connection.getParsedAccountInfo(mintAddress);
  console.log("Owner Program:", accountInfo.value?.owner.toBase58());

  // const mintInfo = await getMint(
  //   connection,
  //   mintAddress,
  //   "confirmed",
  //   TOKEN_2022_PROGRAM_ID
  // );
  // const metadataPointer = getMetadataPointerState(mintInfo);
  // console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));

  // const metadata = await getTokenMetadata(connection, mintAddress);
  // console.log("\nMetadata:", JSON.stringify(metadata, null, 2));
}

main();
