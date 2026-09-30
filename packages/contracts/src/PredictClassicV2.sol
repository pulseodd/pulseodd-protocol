// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PredictClassicV2 protocol interface
/// @notice Contract names and selectors for the next protocol revision.
interface PredictClassicV2 {
    function placeBet(uint256 roundId, uint8 side, uint256 amount) external payable;

    function lockRound(uint256 roundId) external;

    function settleRound(uint256 roundId) external;

    function claim(uint256 roundId) external;

    function earlyExit(uint256 roundId, uint8 side, uint256 amount) external;

    function setKeepers(address[] calldata accounts) external;

    function circuitBreaker(uint256 roundId) external;
}
