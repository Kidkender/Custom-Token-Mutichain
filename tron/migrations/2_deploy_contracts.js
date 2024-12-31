var MyContract = artifacts.require("./Token.sol");

module.exports = function (deployer) {
  deployer.deploy(MyContract, "Tron Tbet Token", "TTBET", 18);
};
