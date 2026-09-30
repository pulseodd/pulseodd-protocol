// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "./Ownable2Step.sol";

/// @notice Receives protocol fees and lets owner sweep funds.
contract Treasury is Ownable2Step {
    event Swept(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner) Ownable2Step(initialOwner) {}

    receive() external payable {}

    function sweepNative(address payable to, uint256 amount) external onlyOwner {
        (bool ok,) = to.call{value: amount}("");
        require(ok, "SWEEP_NATIVE_FAILED");
        emit Swept(address(0), to, amount);
    }
}
