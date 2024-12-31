import { buildModule } from "@nomicfoundation/ignition-core";

const TokenModule = buildModule("EToken", (m) => {
  const token = m.contract("Token", ["Polygon Tbet Token", "PTBET", 200000000]);

  return { token };
});

export default TokenModule;
