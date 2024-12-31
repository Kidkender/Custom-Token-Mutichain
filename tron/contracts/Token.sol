// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./lib/TRC20.sol";
import "./lib/TRC20Detailed.sol";
import "./lib/Ownable.sol";

contract Token is TRC20, TRC20Detailed, Ownable {
    constructor (string memory _nameToken, string memory _symbolToken, uint8 _decimalToken) 
    TRC20Detailed(_nameToken, _symbolToken, _decimalToken)
    Ownable(msg.sender) {
        _mint(msg.sender, 200_000_000 * (10 ** decimals()));
    }
}