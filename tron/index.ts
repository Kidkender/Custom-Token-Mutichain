import { Contract, TronWeb } from "tronweb";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const baseUriApi = "https://nile.trongrid.io";

const tronweb = new TronWeb({
  fullHost: baseUriApi,
  privateKey: process.env.PRIVATE_KEY_NILE || "",
});

function convertUnitToNumber(value: string, decimals: number): string {
  const base = tronweb.toBigNumber(10).pow(decimals);
  return tronweb.toBigNumber(value).div(base).toString();
}

function convertNumberToUnit(value: string, decimals: number): string {
  const base = tronweb.toBigNumber(10).pow(decimals);
  return tronweb.toBigNumber(value).times(base).toString();
}

async function getInforToken(address: string): Promise<Contract> {
  const token = await tronweb.contract().at(address);
  const name = await token.name().call();
  const symbol = await token.symbol().call();
  const decimals = await token.decimals().call();
  const totalSupply = await token.totalSupply().call();

  console.log("name: " + name);
  console.log("symbol: " + symbol);
  console.log("decimals: " + decimals);
  console.log("totalSupply: " + convertUnitToNumber(totalSupply, decimals));
  return token;
}

async function sendNativeToken(address: string, amount: number) {
  try {
    const tx = await tronweb.trx.sendTransaction(
      address,
      Number(tronweb.toSun(amount))
    );

    console.log("Send TRX successfully tx hash: " + JSON.stringify(tx));
  } catch (error) {
    console.error("error when send trx:  " + error);
  }
}

async function sendTRCToken(
  contractAddress: string,
  toAddress: string,
  amount: number
) {
  if (amount < 0) {
    throw new Error("Amount must be greater than zero");
  }

  const token = await tronweb.contract().at(contractAddress);
  const decimals = await token.decimals().call();

  const tokenContract = await tronweb.contract().at(contractAddress);

  const amountToSend = convertNumberToUnit(amount.toString(), decimals);

  const tx = await tokenContract.transfer(toAddress, amountToSend).send();
  console.log("Send token successfully: ", tx);
  return tx;
}
const options = {
  headers: { accept: "application/json" },
};

async function getTransactionFromAccount(address: string) {
  try {
    const response = await axios.get(
      `${baseUriApi}/v1/accounts/${address}/transactions`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting transaction from account: ", error);
  }
}

async function main() {
  const tokenAddress = "TBBwdLDUbUo7hX4YT7BXpDop1uDstMnmFN";
  const wallet2 = "TDBbkYtZe4QtgRmPU5FQfzpoM3ouiRHr5x";

  // await sendNativeToken(wallet2, 10);
  // await sendTRCToken(tokenAddress, wallet2, 150);
  // const token = await getInforToken(tokenAddress);

  const resut = await getTransactionFromAccount(wallet2);
  console.log(resut);
}

main();
