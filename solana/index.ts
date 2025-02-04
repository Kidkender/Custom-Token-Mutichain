import { readFileSync } from "fs";

import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createToken } from "./utils/token";
import { loadKeypair } from "./utils/wallet";
import { getMetadataPDA } from "./module/token";
import bs58 from "bs58";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "finalized");

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

  const infor = await getMetadataPDA(
    new PublicKey("7nirqpoZpA9PKyxwhEMzgvrn5Tv3Qop8YWbXZ8GXTDnN")
  );

  const base58String =
    "3xVi2hYyrSNJiMMNgo4XYWwpMNqbXddZ1jQ78vZvMhsq7NdMzjnDwVwAXgA22NQPkUsRsUXpHUcWS3x4MSnmerxe";

  const secretKey = bs58.decode(base58String);

  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  // console.log("Public Key:", keypair.publicKey.toBase58());

  const totalSupply = 20_000_000_000;
  const adjustedAmount =
    BigInt(totalSupply) * BigInt(Math.pow(10, metadata.decimals));
  const token = await createToken(
    keypair,
    connection,
    metadata.name,
    metadata.symbol,
    metadata.uri,
    metadata.decimals,
    adjustedAmount.toString()
  );

  console.log("token address: " + token);
  // const mintAddress = new PublicKey(token);

  // const destinationAccount = await getOrCreateAssociatedTokenAccount(
  //   connection,
  //   fromWallet,
  //   mintAddress,
  //   fromWallet.publicKey,
  //   false,
  //   "confirmed",
  //   undefined,
  //   TOKEN_PROGRAM_ID
  // );

  // console.log("destinationAccount: " + destinationAccount.address);

  // const ata = await getAssociatedTokenAddress(
  //   mintAddress,
  //   fromWallet.publicKey,
  //   false,
  //   TOKEN_PROGRAM_ID
  // );
  // console.log("Associated Token Address:", ata.toBase58());

  // const accountInfo = await connection.getParsedAccountInfo(mintAddress);
  // console.log("Owner Program:", accountInfo.value?.owner.toBase58());

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
