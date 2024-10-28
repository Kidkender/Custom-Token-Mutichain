// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TRC20.sol";

contract TRC20Detailed is TRC20 {
    string private _name;
    string private _symbol;
    uint8 private _decimal;
    
    constructor (string memory tokenName, string memory tokenSymbol, uint8 tokenDecimals) {
        _name = tokenName;
        _symbol = tokenSymbol;
        _decimal = tokenDecimals;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimal;
    }
}