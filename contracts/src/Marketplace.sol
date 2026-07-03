// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title Marketplace
/// @notice Reference implementation of the NFT marketplace behind MARKETPLACE_ADDRESS
///         (matches MARKETPLACE_ABI). Sellers list an NFT for a price denominated in
///         Token A; buyers may pay with Token A, B or C. This reference treats the
///         three test tokens as 1:1 in value, so calculatePriceInToken returns the
///         same amount for every accepted token — swap in an oracle/DEX quote for a
///         production deployment.
contract Marketplace {
    IERC721 public immutable nft;
    address public immutable tokenA; // PLAT (pricing denomination)
    address public immutable tokenB; // SIMP
    address public immutable tokenC; // LMN

    struct Listing {
        address seller;
        uint256 price; // in Token A units
        bool active;
    }

    mapping(uint256 => Listing) private listings;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Sold(uint256 indexed tokenId, address indexed buyer, address paymentToken, uint256 amount);

    constructor(address _nft, address _tokenA, address _tokenB, address _tokenC) {
        nft = IERC721(_nft);
        tokenA = _tokenA;
        tokenB = _tokenB;
        tokenC = _tokenC;
    }

    function listNFT(uint256 tokenId, uint256 priceInTokenA) external {
        require(nft.ownerOf(tokenId) == msg.sender, "not owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this),
            "marketplace not approved"
        );
        require(priceInTokenA > 0, "price=0");
        listings[tokenId] = Listing({seller: msg.sender, price: priceInTokenA, active: true});
        emit Listed(tokenId, msg.sender, priceInTokenA);
    }

    function getListing(uint256 tokenId)
        external
        view
        returns (address seller, uint256 price, bool active)
    {
        Listing storage l = listings[tokenId];
        return (l.seller, l.price, l.active);
    }

    /// @notice Price of a listing expressed in `paymentToken`. 1:1 across tokens here.
    function calculatePriceInToken(uint256 tokenId, address paymentToken)
        public
        view
        returns (uint256)
    {
        require(paymentToken == tokenA || paymentToken == tokenB || paymentToken == tokenC, "unsupported token");
        return listings[tokenId].price;
    }

    function _buy(uint256 tokenId, address paymentToken) internal {
        Listing storage l = listings[tokenId];
        require(l.active, "not listed");

        uint256 amount = calculatePriceInToken(tokenId, paymentToken);
        address seller = l.seller;

        l.active = false; // effects before interactions

        require(IERC20(paymentToken).transferFrom(msg.sender, seller, amount), "payment failed");
        nft.safeTransferFrom(seller, msg.sender, tokenId);

        emit Sold(tokenId, msg.sender, paymentToken, amount);
    }

    function buyWithTokenA(uint256 tokenId) external {
        _buy(tokenId, tokenA);
    }

    function buyWithTokenB(uint256 tokenId) external {
        _buy(tokenId, tokenB);
    }

    function buyWithTokenC(uint256 tokenId) external {
        _buy(tokenId, tokenC);
    }
}
