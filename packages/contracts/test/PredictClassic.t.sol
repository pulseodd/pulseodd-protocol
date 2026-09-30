// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PredictClassic} from "../src/PredictClassic.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";

interface Vm {
    function warp(uint256) external;
    function deal(address, uint256) external;
    function prank(address) external;
    function expectRevert() external;
}

contract PredictClassicTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    bytes32 internal constant BTC = bytes32("BTC");
    MockOracle internal oracle;
    PredictClassic internal predict;
    address internal treasury = address(0xBEEF);
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    receive() external payable {}

    function setUp() public {
        oracle = new MockOracle();
        predict = new PredictClassic(address(this), address(0), oracle, treasury, 1 ether, 10_000 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function testUpWin() public {
        uint256 roundId = _createAndBet();
        _lock(roundId, 30_000e8);
        _settle(roundId, 31_000e8);

        uint256 aliceClaim = predict.claimable(roundId, alice);
        uint256 bobClaim = predict.claimable(roundId, bob);
        require(aliceClaim == 14.5 ether, "alice payout");
        require(bobClaim == 0, "bob payout");

        vm.prank(alice);
        predict.claim(roundId);
        require(alice.balance == 104.5 ether, "alice balance");
        require(treasury.balance == 0.5 ether, "fee");
    }

    function testDownWin() public {
        uint256 roundId = _createAndBet();
        _lock(roundId, 30_000e8);
        _settle(roundId, 29_000e8);

        require(predict.claimable(roundId, bob) == 14.75 ether, "bob payout");
        require(treasury.balance == 0.25 ether, "fee");
    }

    function testTieRefundsBothSides() public {
        uint256 roundId = _createAndBet();
        _lock(roundId, 30_000e8);
        _settle(roundId, 30_000e8);

        require(predict.claimable(roundId, alice) == 10 ether, "alice refund");
        require(predict.claimable(roundId, bob) == 5 ether, "bob refund");
        require(treasury.balance == 0, "no fee");
    }

    function testLateBetReverts() public {
        uint256 roundId = predict.createNextRound(BTC, 60);
        vm.warp(block.timestamp + 50);
        vm.prank(alice);
        vm.expectRevert();
        predict.placeBet{value: 1 ether}(roundId, PredictClassic.Side.Up, 1 ether);
    }

    function testOverMaxReverts() public {
        uint256 roundId = predict.createNextRound(BTC, 60);
        vm.deal(alice, 20_000 ether);
        vm.prank(alice);
        vm.expectRevert();
        predict.placeBet{value: 10_001 ether}(roundId, PredictClassic.Side.Up, 10_001 ether);
    }

    function testDoubleClaimReverts() public {
        uint256 roundId = _createAndBet();
        _lock(roundId, 30_000e8);
        _settle(roundId, 31_000e8);

        vm.prank(alice);
        predict.claim(roundId);
        vm.prank(alice);
        vm.expectRevert();
        predict.claim(roundId);
    }

    function testPauseBlocksBetAndAllowsEmergencyRefund() public {
        uint256 roundId = predict.createNextRound(BTC, 60);
        vm.prank(alice);
        predict.placeBet{value: 2 ether}(roundId, PredictClassic.Side.Up, 2 ether);

        predict.pause();
        vm.prank(bob);
        vm.expectRevert();
        predict.placeBet{value: 2 ether}(roundId, PredictClassic.Side.Down, 2 ether);

        vm.prank(alice);
        predict.emergencyRefund(roundId);
        require(alice.balance == 100 ether, "refunded");
    }

    function _createAndBet() internal returns (uint256 roundId) {
        roundId = predict.createNextRound(BTC, 60);
        vm.prank(alice);
        predict.placeBet{value: 10 ether}(roundId, PredictClassic.Side.Up, 10 ether);
        vm.prank(bob);
        predict.placeBet{value: 5 ether}(roundId, PredictClassic.Side.Down, 5 ether);
    }

    function _lock(uint256 roundId, int256 price) internal {
        vm.warp(block.timestamp + 50);
        oracle.setPrice(BTC, price);
        predict.lockRound(roundId);
    }

    function _settle(uint256 roundId, int256 price) internal {
        vm.warp(block.timestamp + 10);
        oracle.setPrice(BTC, price);
        predict.settleRound(roundId);
    }
}
