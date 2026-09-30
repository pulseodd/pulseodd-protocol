// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockERC20 {
    /// @notice Deliberately valueless test credit for the Classic test arena.
    string public name = "Pulseodd Test USD";
    string public symbol = "tUSDC";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 public faucetAmount = 1_000 ether;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public hasClaimed;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event FaucetClaimed(address indexed user, uint256 amount);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function claimFaucet() external {
        require(!hasClaimed[msg.sender], "FAUCET_CLAIMED");
        hasClaimed[msg.sender] = true;
        balanceOf[msg.sender] += faucetAmount;
        totalSupply += faucetAmount;
        emit Transfer(address(0), msg.sender, faucetAmount);
        emit FaucetClaimed(msg.sender, faucetAmount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "ALLOWANCE");
        allowance[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "BALANCE");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
