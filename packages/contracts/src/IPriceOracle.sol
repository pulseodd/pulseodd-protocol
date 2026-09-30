// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal price oracle interface used for settlement.
interface IPriceOracle {
    function getPrice(bytes32 asset) external view returns (int256 price, uint256 updatedAt);
}
