const bip39 = require("bip39");
const StellarHDWallet = require("stellar-hd-wallet");

const mnemonic = "";
const targetPublicKey =
  "GBD63VWHVRKDFPESUEWIYSMKA63KTMRQWMCAREINU4QAMU2Q4WZROIPQ";

const seed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");

const wallet = StellarHDWallet.fromMnemonic(mnemonic);

let foundKeypair = null;

for (let i = 0; i < 100; i++) {
  const keypair = wallet.getKeypair(i);
  if (keypair.publicKey() === targetPublicKey) {
    foundKeypair = keypair;
    break;
  }
}

if (foundKeypair) {
  console.log("Keypair found:");
  console.log("Public Key:", foundKeypair.publicKey());
  console.log("Secret Key:", foundKeypair.secret());
} else {
  console.log("No matching Keypair found for the provided public key.");
}
