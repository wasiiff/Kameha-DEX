// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title KamehaNFT
/// @notice Reference implementation of the ERC-721 collection behind NFT_ADDRESS
///         (matches NFT_ABI). tokenURI / ownerOf / safeTransferFrom / isApprovedForAll
///         come from the OpenZeppelin base; adds a simple incremental mint.
contract KamehaNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor(address owner_) ERC721("Kameha NFT", "KMNFT") Ownable(owner_) {}

    /// @notice Mint a new NFT with the given metadata URI.
    function mint(address to, string memory uri) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /// @notice Total number of NFTs minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
}
