// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../contracts/Token.sol";

contract TRC20Test {
    Token private token;
    address private owner;
    address private user1;
    address private user2;
    constructor() {
        owner = msg.sender;
        user1 = address(0x1234);
        user2 = address(0x5678);
        token = new Token("Tron Tbet Token", "TBET", 18);
    }   

    function testInitialize() public view returns (bool) {
        uint256 ownerBalance = token.balanceOf(owner);
        return ownerBalance == 200_000_000 * 10 ** 18;
    }

    function testChangeOwner() public returns (bool) {
        token.transferOwnership(user1);
        address newOwner = token.owner();
        return newOwner == user1;
    }

    function testApproveAndTransferFrom() public returns (bool) {
        uint256 approveAmount = 500 * 10 ** 18;
        token.approve(user2, approveAmount);

        uint256 allowance = token.allowance(owner, user2);
        require(allowance == approveAmount, "Allowance mismatch");

        (bool success, ) = address(token).call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", owner, user1, approveAmount));
        require(success, "Transfer from failed");

        uint256 user1Balance = token.balanceOf(user1);
        uint256 ownerBalance = token.balanceOf(owner);

        require(user1Balance == 1_500 * (10 ** 18), "User1 balance mismatch after transferFrom");
        require(
            ownerBalance == (200_000_000 * (10 ** 18)) - (1_500 * (10 ** 18)),
            "Owner balance mismatch after transferFrom"
        );

        return true;
    }

}