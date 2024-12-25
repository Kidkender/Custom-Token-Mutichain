import { expect } from "chai";
import { Signer } from "ethers";
import { ethers, ignition } from "hardhat";
import TokenModule from "../ignition/modules/ETbetToken";
import { ETbetToken } from "../typechain-types";

describe("Token contract", () => {
  let owner: Signer;
  let newOwner: Signer;

  let token: ETbetToken;

  before(async () => {
    [owner, newOwner] = await ethers.getSigners();

    const result = await ignition.deploy(TokenModule);
    token = result.token as unknown as ETbetToken;
    await token.waitForDeployment();
    return token;
  });
  it("Should data must be with initialize", async () => {
    const value = ethers.parseUnits("200000000", 18);
    const totalSupply = await token.totalSupply();
    expect(totalSupply).to.equal(value);
  });

  it("Should change owner correct", async () => {
    const currentOwner = await token.owner();
    expect(currentOwner).to.equal(await owner.getAddress());
    const newOwnerAddress = await newOwner.getAddress();

    await token.connect(owner).transferOwnership(newOwnerAddress);

    const newOwnerToken = await token.owner();

    expect(newOwnerToken).to.equal(newOwnerAddress);
  });
});
