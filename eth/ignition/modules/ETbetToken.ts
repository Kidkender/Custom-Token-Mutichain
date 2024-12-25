import { buildModule } from "@nomicfoundation/ignition-core";

const TokenModule = buildModule("EToken", (m) => {
  const token = m.contract("ETbetToken", []);

  return { token };
});

export default TokenModule;
