// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ERC20Token
/// @notice Reference implementation for the PLAT / SIMP / LMN test tokens used by
///         the Kameha-DEX frontend (matches ERC20_ABI). 18 decimals, owner-mintable
///         so the Faucet and initial liquidity can be seeded.
contract ERC20Token is ERC20, Ownable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        _mint(owner_, initialSupply);
    }

    /// @notice Mint new tokens (used to fund the faucet / pools on testnet).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
