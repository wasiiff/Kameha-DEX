export const MARKETPLACE_ABI = [
  "function listNFT(uint256 tokenId, uint256 priceInTokenA)",
  "function buyWithTokenA(uint256 tokenId)",
  "function buyWithTokenB(uint256 tokenId)",
  "function buyWithTokenC(uint256 tokenId)",
  "function getListing(uint256 tokenId) view returns (address seller, uint256 price, bool active)",
  "function calculatePriceInToken(uint256 tokenId, address paymentToken) view returns (uint256)",
];
