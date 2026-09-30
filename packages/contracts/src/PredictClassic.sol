// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPriceOracle} from "./IPriceOracle.sol";
import {Ownable2Step} from "./Ownable2Step.sol";
import {Pausable, ReentrancyGuard} from "./Guards.sol";

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title Pulseodd Classic
/// @notice Short-term UP/DOWN pooled prediction arena for RH Network.
contract PredictClassic is Ownable2Step, Pausable, ReentrancyGuard {
    enum Side {
        None,
        Up,
        Down
    }

    enum Status {
        Upcoming,
        LiveBetting,
        Locked,
        Settling,
        Settled,
        Refunded
    }

    struct Round {
        uint256 id;
        bytes32 asset;
        uint256 timeframe;
        uint256 startTs;
        uint256 lockTs;
        uint256 endTs;
        int256 startPrice;
        int256 endPrice;
        uint256 upAmount;
        uint256 downAmount;
        Status status;
        Side winner;
    }

    struct Bet {
        uint256 upAmount;
        uint256 downAmount;
        bool claimed;
    }

    struct TimeframeConfig {
        bool enabled;
        uint256 duration;
        uint256 lockBeforeEnd;
    }

    uint256 public constant BPS = 10_000;
    address public immutable token;
    IPriceOracle public oracle;
    address public treasury;
    uint256 public minStake;
    uint256 public maxStake;
    uint256 public feeBps;
    bool public tieRefund = true;
    uint256 public nextRoundId = 1;

    mapping(uint256 roundId => Round) public rounds;
    mapping(bytes32 key => uint256 roundId) public currentRoundIds;
    mapping(uint256 roundId => mapping(address user => Bet)) public bets;
    mapping(uint256 roundId => address[]) private _bettors;
    mapping(uint256 roundId => mapping(address user => bool)) private _seenBettor;
    mapping(uint256 timeframe => TimeframeConfig) public timeframeConfigs;
    mapping(address keeper => bool) public keepers;

    event BetPlaced(
        uint256 indexed roundId, address indexed user, Side indexed side, uint256 amount
    );
    event RoundCreated(uint256 indexed roundId, bytes32 indexed asset, uint256 timeframe);
    event RoundLocked(uint256 indexed roundId, int256 startPrice);
    event RoundSettled(uint256 indexed roundId, int256 endPrice, Side winner, uint256 fee);
    event Claimed(uint256 indexed roundId, address indexed user, uint256 amount);
    event KeeperSet(address indexed keeper, bool allowed);

    error InvalidRound();
    error InvalidSide();
    error InvalidStake();
    error BettingClosed();
    error TooEarly();
    error NotSettled();
    error AlreadyClaimed();
    error NothingToClaim();
    error TransferFailed();
    error NotKeeper();
    error TimeframeDisabled();

    modifier onlyKeeperOrOwner() {
        if (msg.sender != owner && !keepers[msg.sender]) revert NotKeeper();
        _;
    }

    constructor(
        address initialOwner,
        address token_,
        IPriceOracle oracle_,
        address treasury_,
        uint256 minStake_,
        uint256 maxStake_
    ) Ownable2Step(initialOwner) {
        token = token_;
        oracle = oracle_;
        treasury = treasury_;
        minStake = minStake_;
        maxStake = maxStake_;
        feeBps = 500;
        timeframeConfigs[60] = TimeframeConfig(true, 60, 10);
        timeframeConfigs[300] = TimeframeConfig(true, 300, 15);
    }

    receive() external payable {}

    function setKeeper(address keeper, bool allowed) external onlyOwner {
        keepers[keeper] = allowed;
        emit KeeperSet(keeper, allowed);
    }

    function setConfig(
        IPriceOracle newOracle,
        address newTreasury,
        uint256 newMinStake,
        uint256 newMaxStake,
        uint256 newFeeBps,
        bool newTieRefund
    ) external onlyOwner {
        require(newFeeBps <= 1_000, "FEE_TOO_HIGH");
        oracle = newOracle;
        treasury = newTreasury;
        minStake = newMinStake;
        maxStake = newMaxStake;
        feeBps = newFeeBps;
        tieRefund = newTieRefund;
    }

    function setTimeframe(uint256 timeframe, uint256 lockBeforeEnd, bool enabled)
        external
        onlyOwner
    {
        require(timeframe > lockBeforeEnd, "BAD_TIMEFRAME");
        timeframeConfigs[timeframe] = TimeframeConfig(enabled, timeframe, lockBeforeEnd);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createNextRound(bytes32 asset, uint256 timeframe)
        public
        whenNotPaused
        onlyKeeperOrOwner
        returns (uint256 roundId)
    {
        TimeframeConfig memory cfg = timeframeConfigs[timeframe];
        if (!cfg.enabled) revert TimeframeDisabled();
        uint256 currentId = currentRoundIds[_roundKey(asset, timeframe)];
        if (currentId != 0 && rounds[currentId].status != Status.Settled) revert InvalidRound();

        roundId = nextRoundId++;
        uint256 startTs = block.timestamp;
        rounds[roundId] = Round({
            id: roundId,
            asset: asset,
            timeframe: timeframe,
            startTs: startTs,
            lockTs: startTs + cfg.duration - cfg.lockBeforeEnd,
            endTs: startTs + cfg.duration,
            startPrice: 0,
            endPrice: 0,
            upAmount: 0,
            downAmount: 0,
            status: Status.LiveBetting,
            winner: Side.None
        });
        currentRoundIds[_roundKey(asset, timeframe)] = roundId;
        emit RoundCreated(roundId, asset, timeframe);
    }

    function placeBet(uint256 roundId, Side side, uint256 amount)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Round storage round = rounds[roundId];
        if (round.id == 0) revert InvalidRound();
        if (side != Side.Up && side != Side.Down) revert InvalidSide();
        if (amount < minStake || amount > maxStake) revert InvalidStake();
        if (round.status != Status.LiveBetting || block.timestamp >= round.lockTs) {
            revert BettingClosed();
        }

        if (token == address(0)) {
            if (msg.value != amount) revert InvalidStake();
        } else {
            if (msg.value != 0) revert InvalidStake();
            if (!IERC20Like(token).transferFrom(msg.sender, address(this), amount)) {
                revert TransferFailed();
            }
        }

        if (!_seenBettor[roundId][msg.sender]) {
            _seenBettor[roundId][msg.sender] = true;
            _bettors[roundId].push(msg.sender);
        }

        Bet storage userBet = bets[roundId][msg.sender];
        if (side == Side.Up) {
            userBet.upAmount += amount;
            round.upAmount += amount;
        } else {
            userBet.downAmount += amount;
            round.downAmount += amount;
        }

        emit BetPlaced(roundId, msg.sender, side, amount);
    }

    function lockRound(uint256 roundId) external whenNotPaused onlyKeeperOrOwner {
        Round storage round = rounds[roundId];
        if (round.id == 0) revert InvalidRound();
        if (round.status != Status.LiveBetting) revert InvalidRound();
        if (block.timestamp < round.lockTs) revert TooEarly();
        (int256 price,) = oracle.getPrice(round.asset);
        round.startPrice = price;
        round.status = Status.Locked;
        emit RoundLocked(roundId, price);
    }

    function settleRound(uint256 roundId) external whenNotPaused onlyKeeperOrOwner nonReentrant {
        Round storage round = rounds[roundId];
        if (round.id == 0) revert InvalidRound();
        if (round.status != Status.Locked) revert InvalidRound();
        if (block.timestamp < round.endTs) revert TooEarly();

        round.status = Status.Settling;
        (int256 price,) = oracle.getPrice(round.asset);
        round.endPrice = price;

        uint256 fee;
        if (tieRefund && price == round.startPrice) {
            round.winner = Side.None;
        } else {
            round.winner = price >= round.startPrice ? Side.Up : Side.Down;
            uint256 winnerPool = round.winner == Side.Up ? round.upAmount : round.downAmount;
            fee = (winnerPool * feeBps) / BPS;
            if (fee > 0) _pay(treasury, fee);
        }
        round.status = Status.Settled;
        emit RoundSettled(roundId, price, round.winner, fee);
    }

    function claim(uint256 roundId) external nonReentrant {
        uint256 amount = _claimable(roundId, msg.sender);
        if (amount == 0) revert NothingToClaim();
        bets[roundId][msg.sender].claimed = true;
        _pay(msg.sender, amount);
        emit Claimed(roundId, msg.sender, amount);
    }

    function emergencyRefund(uint256 roundId) external nonReentrant whenPaused {
        Round storage round = rounds[roundId];
        if (round.id == 0) revert InvalidRound();
        Bet storage userBet = bets[roundId][msg.sender];
        if (userBet.claimed) revert AlreadyClaimed();
        uint256 amount = userBet.upAmount + userBet.downAmount;
        if (amount == 0) revert NothingToClaim();
        userBet.claimed = true;
        round.status = Status.Refunded;
        _pay(msg.sender, amount);
        emit Claimed(roundId, msg.sender, amount);
    }

    function getCurrentRound(bytes32 asset, uint256 timeframe)
        external
        view
        returns (Round memory)
    {
        return rounds[currentRoundIds[_roundKey(asset, timeframe)]];
    }

    function getUserBet(uint256 roundId, address user) external view returns (Bet memory) {
        return bets[roundId][user];
    }

    function getUserBets(uint256 roundId, address user)
        external
        view
        returns (Bet memory bet, uint256 claimableAmount)
    {
        bet = bets[roundId][user];
        claimableAmount = _claimable(roundId, user);
    }

    function getBettors(uint256 roundId) external view returns (address[] memory) {
        return _bettors[roundId];
    }

    function getMultiplier(uint256 roundId, Side side) external view returns (uint256 multiplierWad) {
        Round memory round = rounds[roundId];
        uint256 sidePool = side == Side.Up ? round.upAmount : round.downAmount;
        uint256 oppositePool = side == Side.Up ? round.downAmount : round.upAmount;
        if (sidePool == 0) return 0;
        return 1e18 + ((oppositePool * (BPS - feeBps) * 1e18) / BPS / sidePool);
    }

    function claimable(uint256 roundId, address user) external view returns (uint256) {
        return _claimable(roundId, user);
    }

    function _claimable(uint256 roundId, address user) internal view returns (uint256) {
        Round memory round = rounds[roundId];
        if (round.status != Status.Settled && round.status != Status.Refunded) return 0;
        Bet memory userBet = bets[roundId][user];
        if (userBet.claimed) return 0;

        uint256 userTotal = userBet.upAmount + userBet.downAmount;
        if (round.status == Status.Refunded || round.winner == Side.None) return userTotal;

        uint256 winningUserAmount = round.winner == Side.Up ? userBet.upAmount : userBet.downAmount;
        if (winningUserAmount == 0) return 0;

        uint256 winnerPool = round.winner == Side.Up ? round.upAmount : round.downAmount;
        uint256 loserPool = round.winner == Side.Up ? round.downAmount : round.upAmount;
        uint256 rewardPool = loserPool + ((winnerPool * (BPS - feeBps)) / BPS);
        return (winningUserAmount * rewardPool) / winnerPool;
    }

    function _pay(address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = to.call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else if (!IERC20Like(token).transfer(to, amount)) {
            revert TransferFailed();
        }
    }

    function _roundKey(bytes32 asset, uint256 timeframe) internal pure returns (bytes32) {
        return keccak256(abi.encode(asset, timeframe));
    }
}
