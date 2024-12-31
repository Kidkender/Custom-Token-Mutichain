import { Metaplex } from "@metaplex-foundation/js";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createTransferInstruction,
  ExtensionType,
  getAssociatedTokenAddress,
  getMetadataPointerState,
  getMint,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  getTokenMetadata,
  LENGTH_SIZE,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TokenInvalidAccountOwnerError,
  transfer,
  TYPE_SIZE,
  type Account,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  pack,
  type TokenMetadata,
} from "@solana/spl-token-metadata";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  type Commitment,
  type ParsedAccountData,
} from "@solana/web3.js";
import * as bs58 from "bs58";
import * as fs from "fs";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const connectionMainnet = new Connection(
  clusterApiUrl("mainnet-beta"),
  "confirmed"
);

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
  mintAuthority: Keypair,
  updateAuthority: Keypair | null,
  freezeAuthority: PublicKey | null,
  payer: Keypair | null,
  name: string,
  symbol: string,
  uri: string,
  decimals: number
): Promise<string> {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const metadata: TokenMetadata = {
    updateAuthority: mintAuthority.publicKey,
    mint: mint,
    name: name,
    symbol: symbol,
    uri: uri,
    additionalMetadata: [["description", "Only Possible On Solana"]],
  };

  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;

  const metadataLen = pack(metadata).length;

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);

  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
  );

  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: mintAuthority.publicKey,
    newAccountPubkey: mint,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  const initializeMetadataPointerInstruction =
    createInitializeMetadataPointerInstruction(
      mint,
      mintAuthority.publicKey,
      mint,
      TOKEN_2022_PROGRAM_ID
    );

  const initializeMintInstruction = createInitializeMintInstruction(
    mint,
    decimals ?? 9,
    mintAuthority.publicKey,
    null,
    TOKEN_2022_PROGRAM_ID
  );

  const initializeMetadataInstruction = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint,
    updateAuthority: mintAuthority.publicKey,
    mint: mint,
    mintAuthority: mintAuthority.publicKey,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
  });

  const updateFieldInstruction = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: mint,
    updateAuthority: mintAuthority.publicKey,
    field: metadata.additionalMetadata[0][0],
    value: metadata.additionalMetadata[0][1],
  });

  const transaction = new Transaction().add(
    createAccountInstruction,
    initializeMetadataPointerInstruction,
    initializeMintInstruction,
    initializeMetadataInstruction,
    updateFieldInstruction
  );

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [mintAuthority, mintKeypair]
  );

  return transactionSignature;
}

function createNewWallet(): Keypair {
  const newWallet = Keypair.generate();
  saveKeypair(newWallet);
  return newWallet;
}

async function mintToken(
  fromWallet: Keypair,
  mint: PublicKey,
  amount: number,
  destination: PublicKey
) {
  let signature = await mintTo(
    connection,
    fromWallet,
    mint,
    destination,
    fromWallet.publicKey,
    amount * LAMPORTS_PER_SOL,
    [],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  console.log("mint tx: ", signature);
}

async function getTokenDetails(mintAddress: string) {
  let metadata;
  const mintPubKey = new PublicKey(mintAddress);
  try {
    metadata = await getTokenMetadata(
      connection,
      mintPubKey,
      "confirmed",
      TOKEN_PROGRAM_ID
    );
  } catch (error) {
    if (error instanceof TokenInvalidAccountOwnerError) {
      console.log("error getting token: ", error);
    }
  }

  console.log("metadata: ", metadata);

  const name = metadata ? metadata.name : "unknown";
  const symbol = metadata ? metadata.symbol : "unknown";

  const mint = await getMint(connection, mintPubKey);
  const { supply, decimals } = mint;

  console.log("symbol: ", symbol);
  console.log("decimals: ", decimals);
  console.log("supply: ", supply);
}

async function getTokenDetails1(mintAddress: string) {
  const mintPubKey = new PublicKey(mintAddress);

  try {
    const metaplex = Metaplex.make(connection);

    const nft = await metaplex.nfts().findByMint({ mintAddress: mintPubKey });

    const name = nft.name || "unknown";
    const symbol = nft.symbol || "unknown";
    const uri = nft.uri || "unknown";

    const mint = await getMint(connection, mintPubKey);
    const { supply, decimals } = mint;

    console.log("symbol: ", symbol);
    console.log("decimals: ", decimals);
    console.log("supply: ", supply);
    console.log("name: ", name);
    return {
      name,
      symbol,
      decimals,
      supply,
    };
  } catch (error) {
    console.error("Error fetching token details:", error);
  }
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

async function getNativeAddressFromTokenAccount(
  tokenAccountAddress: PublicKey
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

async function getMinimumBalanceForRent(publicKey: string) {
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

async function main() {
  const fromWallet = loadKeypair(
    "627g2t7xE2JsMRRJb35idoenusW2AXjzqQxwydsaSm12"
  );
  const toPublicKey = new PublicKey(
    "EPVaSvZ6iJrX819Kp5mokDWmMzxPdaWGXaYSk559ws6N"
  );

  if (!fromWallet) {
    return;
  }

  // const signature = await createToken(
  //   fromWallet,
  //   fromWallet,
  //   fromWallet.publicKey,
  //   null,
  //   "Sol TBET Token",
  //   "STBET",
  //   "https://gist.githubusercontent.com/Kidkender/063e0a6157974a592ff5c9457cb0b3ea/raw/6163c23e9a97e8eb25eceb7f76f521149d58b08d/solana-minter-metadata.json",
  //   9
  // );

  // console.log("Signature: " + signature);

  const mintAddress = new PublicKey(
    "EGZbczejbSu5S89e3G2NUBpyPyKpy9DczkJL7x5QwAMy"
  );

  const destinationAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mintAddress,
    fromWallet.publicKey,
    false,
    "confirmed",
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  console.log("destinationAccount: " + destinationAccount.address);

  const ata = await getAssociatedTokenAddress(
    mintAddress,
    fromWallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("Associated Token Address:", ata.toBase58());

  const mintInfo = await getMint(
    connection,
    mintAddress,
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );
  console.log("Mint Authority:", mintInfo.mintAuthority?.toBase58());

  const accountInfo = await connection.getParsedAccountInfo(mintAddress);
  console.log("Owner Program:", accountInfo.value?.owner.toBase58());

  await mintToken(
    fromWallet,
    mintAddress,
    200000000,
    destinationAccount.address
  );

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
