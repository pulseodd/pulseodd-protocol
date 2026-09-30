// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPriceOracle} from "../IPriceOracle.sol";

contract MockOracle is IPriceOracle {
    mapping(bytes32 asset => int256 price) public prices;
    mapping(bytes32 asset => uint256 updatedAt) public timestamps;

    function setPrice(bytes32 asset, int256 price) external {
        prices[asset] = price;
        timestamps[asset] = block.timestamp;
    }

    function getPrice(bytes32 asset) external view returns (int256 price, uint256 updatedAt) {
        return (prices[asset], timestamps[asset]);
    }
}
