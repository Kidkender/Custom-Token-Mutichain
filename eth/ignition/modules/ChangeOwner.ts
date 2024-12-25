import { buildModule } from "@nomicfoundation/ignition-core";
import TokenModule from "./ETbetToken";

const ChangeOwner = buildModule("ChangeOwner", (m) => {
  const { token } = m.useModule(TokenModule);
  const newOwner = m.getParameter("newOwner");

  m.call(token, "transferOwnership", [newOwner]);
  return {};
});

export default ChangeOwner;
