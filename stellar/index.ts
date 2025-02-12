import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from "stellar-sdk";
import fs from "fs";

const horizonUrl = "https://horizon-testnet.stellar.org";
const friendbotUrl = "https://friendbot.stellar.org";

const issuerKeypair = Keypair.random();
const destinationKeypair = Keypair.random();

const keys = {
  issuer: {
    publicKey: issuerKeypair.publicKey(),
    secretKey: issuerKeypair.secret(),
  },
  destination: {
    publicKey: destinationKeypair.publicKey(),
    secretKey: destinationKeypair.secret(),
  },
};

fs.writeFileSync("keys.json", JSON.stringify(keys, null, 2));
console.log("Keys have been saved to keys.json");

console.log(`Issuer Public Key: ${issuerKeypair.publicKey()}`);
console.log(`Issuer Secret Key: ${issuerKeypair.secret()}`);
console.log(`Destination Public Key: ${destinationKeypair.publicKey()}`);
console.log(`Destination Secret Key: ${destinationKeypair.secret()}`);

await fetch(friendbotUrl + `?addr=${issuerKeypair.publicKey()}`);
await fetch(friendbotUrl + `?addr=${destinationKeypair.publicKey()}`);

const server = new Horizon.Server(horizonUrl);
const account = await server.loadAccount(issuerKeypair.publicKey());
const abcAsset = new Asset("Test Token", issuerKeypair.publicKey());

const transaction = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(
    Operation.changeTrust({
      asset: abcAsset,
      source: destinationKeypair.publicKey(),
    })
  )
  .addOperation(
    Operation.payment({
      destination: destinationKeypair.publicKey(),
      asset: abcAsset,
      amount: "200000000",
    })
  )
  .setTimeout(30)
  .build();

transaction.sign(issuerKeypair, destinationKeypair);
const res = await server.submitTransaction(transaction);
console.log(`transaction hash:\n${res.hash}`);
