// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Faucet
/// @notice Reference implementation of the test-token faucet behind FAUCET_ADDRESS
///         (matches FAUCET_ABI). A single claim() dispenses a fixed amount of each of
///         the three tokens (PLAT / SIMP / LMN) once per CLAIM_INTERVAL per address.
///         Must be funded with the three tokens after deployment.
contract Faucet is Ownable {
    IERC20 public immutable tokenA; // PLAT
    IERC20 public immutable tokenB; // SIMP
    IERC20 public immutable tokenC; // LMN

    /// @notice Cooldown between claims for a given address.
    uint256 public constant CLAIM_INTERVAL = 24 hours;

    /// @notice Amount of each token sent per claim (1000 tokens, 18 decimals).
    uint256 public constant CLAIM_AMOUNT = 1000 ether;

    /// @notice Timestamp of the last successful claim per address.
    mapping(address => uint256) public lastClaimTime;

    event Claimed(address indexed user, uint256 timestamp);

    constructor(address _tokenA, address _tokenB, address _tokenC, address owner_) Ownable(owner_) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        tokenC = IERC20(_tokenC);
    }

    function claim() external {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + CLAIM_INTERVAL,
            "claim: cooldown active"
        );
        lastClaimTime[msg.sender] = block.timestamp;

        require(tokenA.transfer(msg.sender, CLAIM_AMOUNT), "PLAT transfer failed");
        require(tokenB.transfer(msg.sender, CLAIM_AMOUNT), "SIMP transfer failed");
        require(tokenC.transfer(msg.sender, CLAIM_AMOUNT), "LMN transfer failed");

        emit Claimed(msg.sender, block.timestamp);
    }

    /// @notice Recover leftover tokens (owner only).
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "withdraw failed");
    }
}
