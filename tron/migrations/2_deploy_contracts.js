var MyContract = artifacts.require("./Token.sol");

module.exports = function (deployer) {
  deployer.deploy(MyContract, "Duck Token", "DT", 18);
};
