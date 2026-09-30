// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPriceOracle} from "./IPriceOracle.sol";
import {Ownable2Step} from "./Ownable2Step.sol";

/// @notice Relayer-updated oracle adapter for RH deployments without native oracle support.
contract PriceOracleAdapter is IPriceOracle, Ownable2Step {
    struct PriceData {
        int256 price;
        uint256 updatedAt;
    }

    mapping(bytes32 asset => PriceData) public prices;
    mapping(address relayer => bool) public relayers;

    uint256 public heartbeat;
    uint256 public maxDeviationBps;

    event RelayerSet(address indexed relayer, bool allowed);
    event PriceUpdated(bytes32 indexed asset, int256 price, uint256 timestamp);
    event RiskParamsUpdated(uint256 heartbeat, uint256 maxDeviationBps);

    error NotRelayer();
    error InvalidPrice();
    error StaleTimestamp();
    error DeviationTooHigh();
    error StalePrice();

    constructor(address initialOwner, uint256 initialHeartbeat, uint256 initialMaxDeviationBps)
        Ownable2Step(initialOwner)
    {
        heartbeat = initialHeartbeat;
        maxDeviationBps = initialMaxDeviationBps;
    }

    function setRelayer(address relayer, bool allowed) external onlyOwner {
        relayers[relayer] = allowed;
        emit RelayerSet(relayer, allowed);
    }

    function setRiskParams(uint256 newHeartbeat, uint256 newMaxDeviationBps) external onlyOwner {
        heartbeat = newHeartbeat;
        maxDeviationBps = newMaxDeviationBps;
        emit RiskParamsUpdated(newHeartbeat, newMaxDeviationBps);
    }

    function updatePrice(bytes32 asset, int256 price, uint256 timestamp) external {
        if (msg.sender != owner && !relayers[msg.sender]) revert NotRelayer();
        if (price <= 0) revert InvalidPrice();
        if (timestamp > block.timestamp || timestamp + heartbeat < block.timestamp) {
            revert StaleTimestamp();
        }

        PriceData memory old = prices[asset];
        if (old.price > 0 && maxDeviationBps > 0) {
            uint256 oldPrice = uint256(old.price);
            uint256 newPrice = uint256(price);
            uint256 diff = oldPrice > newPrice ? oldPrice - newPrice : newPrice - oldPrice;
            if ((diff * 10_000) / oldPrice > maxDeviationBps) revert DeviationTooHigh();
        }

        prices[asset] = PriceData(price, timestamp);
        emit PriceUpdated(asset, price, timestamp);
    }

    function getPrice(bytes32 asset) external view returns (int256 price, uint256 updatedAt) {
        PriceData memory data = prices[asset];
        if (data.price <= 0 || data.updatedAt + heartbeat < block.timestamp) revert StalePrice();
        return (data.price, data.updatedAt);
    }
}
