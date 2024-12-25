import { buildModule } from "@nomicfoundation/ignition-core";
import TokenModule from "./ETbetToken";
import { ethers } from "ethers";

const TransferModule = buildModule("Transfer", (m) => {
  const { token } = m.useModule(TokenModule);
  const transfer = m.call(token, "transfer", [
    m.getAccount(1),
    ethers.parseUnits("111", 18),
  ]);

  return {};
});

export default TransferModule;
