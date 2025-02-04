import { Metaplex } from "@metaplex-foundation/js";
import {
  AccountLayout,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  ExtensionType,
  getMint,
  getMintLen,
  getTokenMetadata,
  LENGTH_SIZE,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TokenInvalidAccountOwnerError,
  TYPE_SIZE,
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
} from "@solana/web3.js";

import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mintTokensTo,
  mplToolbox,
} from "@metaplex-foundation/mpl-toolbox";
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  createFungible,
  mplTokenMetadata,
} from "../node_modules/@metaplex-foundation/mpl-token-metadata";
import { irysUploader } from "../node_modules/@metaplex-foundation/umi-uploader-irys/src/plugin";

export async function createToken(
  fromWallet: Keypair,
  connection: Connection,
  name: string,
  symbol: string,
  metadataUri: string,
  decimals: number,
  totalSupply: string
): Promise<string> {
  const umi = createUmi(clusterApiUrl("mainnet-beta"))
    .use(mplTokenMetadata())
    .use(mplToolbox())
    .use(irysUploader());

  const fromWalletSigner = createSignerFromKeypair(umi, {
    publicKey: publicKey(fromWallet.publicKey.toBase58()),
    secretKey: fromWallet.secretKey,
  });

  umi.use(signerIdentity(fromWalletSigner));
  const mintSigner = generateSigner(umi);

  const balanceBefore = await connection.getBalance(fromWallet.publicKey);

  const createFungibleIx = createFungible(umi, {
    mint: mintSigner,
    name,
    symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals,
    creators: null,
  });

  const createTokenIx = createTokenIfMissing(umi, {
    mint: mintSigner.publicKey,
    owner: umi.identity.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(umi),
  });

  const mintTokensIx = mintTokensTo(umi, {
    mint: mintSigner.publicKey,
    token: findAssociatedTokenPda(umi, {
      mint: mintSigner.publicKey,
      owner: umi.identity.publicKey,
    }),
    amount: BigInt(totalSupply),
  });

  console.log("Sending transaction");

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = await createFungibleIx
    .add(createTokenIx)
    .add(mintTokensIx)
    .setBlockhash({
      blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    })
    .sendAndConfirm(umi, {
      send: {
        skipPreflight: true,
        maxRetries: 1,
      },
      confirm: {
        commitment: "confirmed",
      },
    });

  console.log("Transaction successful:", tx.signature);

  const balanceAfter = await connection.getBalance(fromWallet.publicKey);
  const solSpent = (balanceBefore - balanceAfter) / LAMPORTS_PER_SOL;

  const signature = base58.deserialize(tx.signature)[0];

  console.log("\nTransaction Complete");
  console.log("Total SOL spent:", solSpent);
  console.log("View Transaction on Solana Explorer");
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log("View Token on Solana Explorer");
  console.log(
    `https://explorer.solana.com/address/${mintSigner.publicKey}?cluster=devnet`
  );

  return mintSigner.publicKey.toString();
}

// export async function update(
//   name: string,
//   symbol: string,
//   uri: string,
//   fromKeypair: Keypair
// ) {
//   const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
//     "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
//   );
//   const mintKey = new PublicKey("7nirqpoZpA9PKyxwhEMzgvrn5Tv3Qop8YWbXZ8GXTDnN");

//   const [metadatakey] = await PublicKey.findProgramAddress(
//     [
//       Buffer.from("metadata"),
//       TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//       mintKey.toBuffer(),
//     ],
//     TOKEN_METADATA_PROGRAM_ID
//   );

//   const data: DataV2 = {
//     name,
//     symbol,
//     uri,
//   };

//   const accounts: UpdateMetadataAccountV2InstructionAccounts = {
//     metadata: metadatakey,
//     updateAuthority: fromKeypair.publicKey,
//   };
// }

export async function createToken2022(
  connection: Connection,
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

export async function mintToken(
  connection: Connection,
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
  return signature;
}

export async function getTokenDetails(
  connection: Connection,
  mintAddress: string
) {
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

export async function getTokenDetails1(
  connection: Connection,
  mintAddress: string
) {
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

export async function getAllTokensOfAccount(
  connection: Connection,
  address: PublicKey
) {
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

export async function getInformationToken(
  address: PublicKey,
  connection: Connection,
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
