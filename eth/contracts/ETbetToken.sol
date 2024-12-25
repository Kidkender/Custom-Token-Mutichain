// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ETbetToken is ERC20, Ownable(msg.sender) {
    constructor() ERC20("ETbet Token", "ETBET") {
        _mint(msg.sender, 200_000_000 * 10 ** decimals());
    }

    function burn(address owner, uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        _burn(owner, amount);
    }
}
