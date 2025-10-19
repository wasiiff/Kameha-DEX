export const NFT_ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
];
