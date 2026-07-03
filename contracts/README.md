# Contracts

This document lists every on-chain contract the Kameha-DEX frontend interacts with, their deployed addresses, the ABI file that describes them, and where they are used in the app.

All contracts are deployed on the **Kasplex Testnet**.

## Network

| Field | Value |
| --- | --- |
| Name | Kasplex Testnet |
| Chain ID | `167012` |
| RPC URL | `https://rpc.kasplextest.xyz/` |
| Native currency | Kaspa (`KAS`), 18 decimals |
| Testnet | Yes |

Defined in [`app/lib/wagmiClient.ts`](../app/lib/wagmiClient.ts).

## Contract Addresses

| Contract | Address | ABI | Used In |
| --- | --- | --- | --- |
| DEX (TripleSwap) | `0xE0AdC4976bfbd0b59eBba32047F0B17756621EBd` | [`DEX_ABI.ts`](../app/lib/abis/DEX_ABI.ts) | [`app/dex/page.tsx`](../app/dex/page.tsx), [`app/liquidity/page.tsx`](../app/liquidity/page.tsx) |
| Faucet | `0x607D41d416304C0440ED374377AC0AA839d254AA` | [`Faucet_ABI.ts`](../app/lib/abis/Faucet_ABI.ts) | [`app/faucet/page.tsx`](../app/faucet/page.tsx) |
| NFT (ERC-721) | `0xDA47f9cB54F34BbF1988bD6263634CF8F4816DB2` | [`NFT_ABI.ts`](../app/lib/abis/NFT_ABI.ts) | [`app/nft/page.tsx`](../app/nft/page.tsx), [`app/portfolio/page.tsx`](../app/portfolio/page.tsx) |
| Marketplace | `0xcf1731f89A0E4e5Af0e2EB8b433E1De66e7E0FD0` | [`Marketplace_ABI.ts`](../app/lib/abis/Marketplace_ABI.ts) | [`app/nft/page.tsx`](../app/nft/page.tsx) |
| Token A — PLAT (Platinum Token) | `0x0e0Fd4B9D8B114Ee75CbC65ed80eE49F3EA45D95` | [`ERC20_ABI.ts`](../app/lib/abis/ERC20_ABI.ts) | dex, liquidity, nft, portfolio, faucet |
| Token B — SIMP (Simple Token) | `0x26a25ACc7ad5b30f92e8B1f69Df7266b367a9b83` | [`ERC20_ABI.ts`](../app/lib/abis/ERC20_ABI.ts) | dex, liquidity, nft, portfolio, faucet |
| Token C — LMN (Lemon Token) | `0x268c876dFf9f364d1f8Dc9e5dE0c0A8f56C286E6` | [`ERC20_ABI.ts`](../app/lib/abis/ERC20_ABI.ts) | dex, liquidity, nft, portfolio, faucet |

> A machine-readable version of the addresses and network config lives in [`addresses.ts`](./addresses.ts), which the frontend pages import from directly (single source of truth).

## Source Code

Reference Solidity implementations for each contract live in [`src/`](./src):

| File | Contract | Matches |
| --- | --- | --- |
| [`src/ERC20Token.sol`](./src/ERC20Token.sol) | PLAT / SIMP / LMN test tokens | `ERC20_ABI` |
| [`src/TripleSwap.sol`](./src/TripleSwap.sol) | DEX (constant-product AMM, 3 pairs) | `DEX_ABI` |
| [`src/Faucet.sol`](./src/Faucet.sol) | Test-token faucet | `FAUCET_ABI` |
| [`src/KamehaNFT.sol`](./src/KamehaNFT.sol) | ERC-721 collection | `NFT_ABI` |
| [`src/Marketplace.sol`](./src/Marketplace.sol) | NFT marketplace | `MARKETPLACE_ABI` |

> ⚠️ **Reference implementations.** The verified source that produced the *deployed* bytecode at the addresses above is not part of this repository. These files are faithful reconstructions written against the ABIs — the public read/write surface matches, but internal logic (AMM fee, faucet amounts/interval, marketplace price conversion) reflects sensible defaults and may differ from the live contracts. Use them for documentation, local testing, or as a starting point for a fresh deployment — not as a guaranteed match for the on-chain code.

They import OpenZeppelin (`@openzeppelin/contracts`) and target Solidity `^0.8.20`. To compile: drop them into Remix (which resolves OZ automatically), or a Hardhat/Foundry project with `@openzeppelin/contracts` installed.

## Contract Details

### DEX (TripleSwap) — `DEX_ABI`

An AMM supporting three trading pairs between the PLAT / SIMP / LMN tokens. Pairs are addressed by a `uint8` id:

| `pair` id | Pair |
| --- | --- |
| `1` | PLAT / SIMP (A / B) |
| `2` | PLAT / LMN (A / C) |
| `3` | SIMP / LMN (B / C) |

Functions:

- `addLiquidity(uint8 pair, uint256 amount1, uint256 amount2)`
- `swapExactInput(uint8 pair, address tokenIn, uint256 amountIn, uint256 minAmountOut, address recipient)`
- `previewSwap(uint8 pair, address tokenIn, uint256 amountIn) view returns (uint256)`
- `getReservesAB() view returns (uint256, uint256)`
- `getReservesAC() view returns (uint256, uint256)`
- `getReservesBC() view returns (uint256, uint256)`

### Faucet — `FAUCET_ABI`

Dispenses test tokens (PLAT / SIMP / LMN) on a fixed cooldown.

- `claim()`
- `lastClaimTime(address) view returns (uint256)`
- `CLAIM_INTERVAL() view returns (uint256)`

### NFT (ERC-721) — `NFT_ABI`

Standard ERC-721 subset used for display, ownership checks and marketplace approvals.

- `tokenURI(uint256 tokenId) view returns (string)`
- `ownerOf(uint256 tokenId) view returns (address)`
- `safeTransferFrom(address from, address to, uint256 tokenId)`
- `isApprovedForAll(address owner, address operator) view returns (bool)`

### Marketplace — `MARKETPLACE_ABI`

Lets users list NFTs for a price in Token A and buy them with any of the three tokens (price converted on-chain).

- `listNFT(uint256 tokenId, uint256 priceInTokenA)`
- `buyWithTokenA(uint256 tokenId)`
- `buyWithTokenB(uint256 tokenId)`
- `buyWithTokenC(uint256 tokenId)`
- `getListing(uint256 tokenId) view returns (address seller, uint256 price, bool active)`
- `calculatePriceInToken(uint256 tokenId, address paymentToken) view returns (uint256)`

### Tokens (ERC-20) — `ERC20_ABI`

The three test tokens (PLAT, SIMP, LMN) all share the standard ERC-20 interface.

- `name() view returns (string)`
- `symbol() view returns (string)`
- `decimals() view returns (uint8)`
- `balanceOf(address) view returns (uint256)`
- `approve(address spender, uint256 amount) returns (bool)`
- `allowance(address owner, address spender) view returns (uint256)`
- `transfer(address to, uint256 amount) returns (bool)`

## Notes

- **Addresses are centralized** in [`addresses.ts`](./addresses.ts); the `dex`, `liquidity`, `nft`, `portfolio` and `faucet` pages import from it instead of hardcoding.
- The ABIs actually used at runtime are **defined inline** (in viem/JSON format) inside each page. The string-format copies in [`app/lib/abis/`](../app/lib/abis/) are a human-readable reference and are not imported by the pages.
- The three test tokens are treated as equal in value (1:1) by the marketplace reference contract. A production marketplace should price conversions via an oracle or the DEX.
</content>
</invoke>
