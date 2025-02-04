import { type DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { some } from "@metaplex-foundation/umi";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// export async function updateTokenMetadata(
//   fromWallet: Keypair,
//   connection: Connection,
//   mintPublicKey: PublicKey,
//   name: string,
//   symbol: string,
//   metadataUri: string
// ): Promise<string> {
//   const metadataPda = await PublicKey.findProgramAddress(
//     [
//       Buffer.from("metadata"),
//       new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
//       mintPublicKey.toBuffer(),
//     ],
//     new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
//   );

//   const umiPublicKeyAddress = PublicKeyasUmiPublicKey(
//     fromWallet.publicKey.toBase58()
//   );

//   const data: DataV2 = {
//     name,
//     symbol,
//     uri: metadataUri,
//     sellerFeeBasisPoints: 0,
//     creators: some([
//       {
//         address: umiPublicKeyAddress(fromWallet.publicKey.toBase58()),
//         share: 100,
//         verified: true,
//       },
//     ]),
//   };

//   const updateMetadataInstruction = createUpdateMetadataAccountInstruction(
//     {
//       metadata: metadataPda[0],
//       updateAuthority: fromWallet.publicKey,
//     },
//     {
//       updateMetadataAccountArgsV2: {
//         data,
//         updateAuthority: fromWallet.publicKey,
//         primarySaleHappened: null,
//         isMutable: null,
//       },
//     }
//   );

//   const transaction = new Transaction().add(updateMetadataInstruction);

//   const { blockhash, lastValidBlockHeight } =
//     await connection.getLatestBlockhash();

//   transaction.recentBlockhash = blockhash;
//   transaction.feePayer = fromWallet.publicKey;

//   const signedTransaction = await fromWallet.signTransaction(transaction);

//   const txid = await connection.sendRawTransaction(
//     signedTransaction.serialize()
//   );

//   console.log("Transaction successful:", txid);

//   console.log("\nView Transaction on Solana Explorer");
//   console.log(`https://explorer.solana.com/tx/${txid}?cluster=devnet`);

//   return txid;
// }

export async function getMetadataPDA(mint: PublicKey): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
}
