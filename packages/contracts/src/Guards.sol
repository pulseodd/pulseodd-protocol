// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract ReentrancyGuard {
    uint256 private _status = 1;

    error ReentrantCall();

    modifier nonReentrant() {
        if (_status == 2) revert ReentrantCall();
        _status = 2;
        _;
        _status = 1;
    }
}

abstract contract Pausable {
    bool public paused;

    event Paused(address indexed account);
    event Unpaused(address indexed account);

    error EnforcedPause();
    error ExpectedPause();

    modifier whenNotPaused() {
        if (paused) revert EnforcedPause();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert ExpectedPause();
        _;
    }

    function _pause() internal {
        paused = true;
        emit Paused(msg.sender);
    }

    function _unpause() internal {
        paused = false;
        emit Unpaused(msg.sender);
    }
}
