// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PredictClassic} from "../src/PredictClassic.sol";
import {PriceOracleAdapter} from "../src/PriceOracleAdapter.sol";
import {Treasury} from "../src/Treasury.sol";

interface Vm {
    function envUint(string calldata key) external returns (uint256);
    function envOr(string calldata key, address defaultValue) external returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployRH {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external {
        uint256 privateKey = vm.envUint("KEEPER_PRIVATE_KEY");
        address token = vm.envOr("RH_TOKEN_ADDRESS", address(0));

        vm.startBroadcast(privateKey);
        address deployer = address(this);
        Treasury treasury = new Treasury(deployer);
        PriceOracleAdapter oracle = new PriceOracleAdapter(deployer, 120, 2_000);
        PredictClassic predict = new PredictClassic(
            deployer,
            token,
            oracle,
            address(treasury),
            1 ether,
            10_000 ether
        );
        oracle.setRelayer(deployer, true);
        predict.setKeeper(deployer, true);
        vm.stopBroadcast();
    }
}
