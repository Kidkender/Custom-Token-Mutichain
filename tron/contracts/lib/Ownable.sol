// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract  contract Ownable {
    address private _owner;

    error OwnableInvalidOwner(address owner);

    error OwnableUnauthorizedAccount(address account);

    event OwnershipTransferred(address oldOwner, address newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        address msgSender = msg.sender;
        if (owner() != msgSender) {
            revert OwnableUnauthorizedAccount(msgSender);
        }
    }

    function _transferOwnership(address newOwner) public virtual onlyOwner {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}