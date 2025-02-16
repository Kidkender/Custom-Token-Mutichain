import fs from "fs";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";

const horizonUrl = "https://horizon-testnet.stellar.org";
const friendbotUrl = "https://friendbot.stellar.org";
const server = new Horizon.Server(horizonUrl);

async function createWallet() {
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

  await activateAccount(issuerKeypair.publicKey());
  await activateAccount(destinationKeypair.publicKey());

  return { issuerKeypair, destinationKeypair };
}

async function activateAccount(publicKey: string) {
  try {
    const response = await fetch(`${friendbotUrl}?addr=${publicKey}`);
    if (response.ok) {
      console.log(`Account ${publicKey} has been successfully activated!`);
    } else {
      console.error("Error activating account:", await response.text());
    }
  } catch (error) {
    console.error("Error activating account:", error);
  }
}

async function setUpTrustline(
  assetCode: string,
  assetIssuer: string,
  destinationKeypair: Keypair
) {
  try {
    const destinationAccount = await loadAccount(
      destinationKeypair.publicKey()
    );

    const trustlineTransaction = new TransactionBuilder(destinationAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.changeTrust({
          asset: new Asset(assetCode, assetIssuer),
        })
      )
      .setTimeout(30)
      .build();

    trustlineTransaction.sign(destinationKeypair);

    const trustlineResult = await server.submitTransaction(
      trustlineTransaction
    );
    console.log("Trustline has been set up:", trustlineResult.hash);
  } catch (error) {
    console.error("Error setting up trustline:", error);
  }
}

async function loadAccount(
  publicKey: string
): Promise<Horizon.AccountResponse> {
  try {
    const account = await server.loadAccount(publicKey);
    console.log(`Account ${publicKey} has been successfully loaded!`);
    return account;
  } catch (error) {
    console.error(`Error loading account ${publicKey}:`, error);
    throw error;
  }
}

async function transferToken(
  sourceKeypair: Keypair,
  destinationPublicKey: string,
  asset: Asset,
  amount: string
) {
  try {
    const sourceAccount = await loadAccount(sourceKeypair.publicKey());

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: destinationPublicKey,
          asset: asset,
          amount: amount,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    const res = await server.submitTransaction(transaction);
    console.log(`transaction hash:\n${res.hash}`);
  } catch (error: any) {
    console.error("Error when send token: ", error.response.data);
  }
}

async function fetchTokenInfo(assetCode: string, issuer: string) {
  try {
    const url = `https://horizon-testnet.stellar.org/assets?asset_code=${assetCode}&asset_issuer=${issuer}`;
    const response = await fetch(url);
    const data = await response.json();

    return data._embedded.records[0] || null;
  } catch (error) {
    console.error("Error fetching token info:", error);
    return null;
  }
}

async function fetchTokensByIssuer(issuer: string) {
  try {
    const url = `https://horizon-testnet.stellar.org/assets?asset_issuer=${issuer}`;
    const response = await fetch(url);
    const data = await response.json();

    return data._embedded.records.map((record: any) => ({
      asset_code: record.asset_code,
      num_accounts: record.num_accounts,
      amount: record.amount,
    }));
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return null;
  }
}

async function main() {
  // const { issuerKeypair, destinationKeypair } = await createWallet();

  const issuerKeypair = Keypair.fromSecret("");

  const destinationKeypair = Keypair.fromSecret("");

  await setUpTrustline("ABC", issuerKeypair.publicKey(), destinationKeypair);

  const abcAsset = new Asset(
    "ABC",
    "GCITPIVXLASBGR6PWOUMY7FB5WDY5Y56N2UAXVY4FIWRIBKFAJSQRL4T"
  );

  await transferToken(
    issuerKeypair,
    "GBSE4FVXYIDKE3Z2XNUEJFJR6MQRKHGJBCPVBGPGW5FNPV2AMFSYHMBX",
    abcAsset,
    "10"
  );
}

main().catch(console.error);
