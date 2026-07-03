// Central registry of on-chain contract addresses used by the Kameha-DEX frontend.
// All contracts are deployed on the Kasplex Testnet (chainId 167012).
//
// See ./README.md for full descriptions of each contract and its ABI.

export const KASPLEX_TESTNET = {
  id: 167012,
  name: "Kasplex Testnet",
  rpcUrl: "https://rpc.kasplextest.xyz/",
  nativeCurrency: { name: "Kaspa", symbol: "KAS", decimals: 18 },
} as const;

export const CONTRACTS = {
  /** AMM supporting the PLAT/SIMP, PLAT/LMN and SIMP/LMN pairs. ABI: DEX_ABI */
  DEX: "0xE0AdC4976bfbd0b59eBba32047F0B17756621EBd",
  /** Test-token faucet with a claim cooldown. ABI: FAUCET_ABI */
  FAUCET: "0x607D41d416304C0440ED374377AC0AA839d254AA",
  /** ERC-721 NFT collection. ABI: NFT_ABI */
  NFT: "0xDA47f9cB54F34BbF1988bD6263634CF8F4816DB2",
  /** NFT marketplace (list / buy with any token). ABI: MARKETPLACE_ABI */
  MARKETPLACE: "0xcf1731f89A0E4e5Af0e2EB8b433E1De66e7E0FD0",
} as const;

export const TOKENS = {
  /** Platinum Token */
  PLAT: "0x0e0Fd4B9D8B114Ee75CbC65ed80eE49F3EA45D95",
  /** Simple Token */
  SIMP: "0x26a25ACc7ad5b30f92e8B1f69Df7266b367a9b83",
  /** Lemon Token */
  LMN: "0x268c876dFf9f364d1f8Dc9e5dE0c0A8f56C286E6",
} as const;

// Aliases matching the A / B / C naming used in the DEX and pair ids.
export const TOKEN_A = TOKENS.PLAT;
export const TOKEN_B = TOKENS.SIMP;
export const TOKEN_C = TOKENS.LMN;

/** DEX pair ids expected by the `uint8 pair` argument. */
export const DEX_PAIRS = {
  PLAT_SIMP: 1, // A / B
  PLAT_LMN: 2, // A / C
  SIMP_LMN: 3, // B / C
} as const;
