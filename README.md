# Kameha-DEX

A lightweight decentralized exchange (DEX) frontend built with Next.js, React, TypeScript and Wagmi. This repository provides a UI for interacting with on-chain contracts (swap, liquidity, NFTs, faucet, portfolio and marketplace flows) and includes contract ABIs and a basic provider/wagmi setup.

Live demo: https://kamehadex.vercel.app/dex

## Key Technologies

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Wagmi + Viem + Ethers

## Features

- Wallet connect (Wagmi)
- Swap / DEX UI under `/dex`
- Liquidity management under `/liquidity`
- NFT pages under `/nft`
- Faucet for test tokens under `/faucet`
- Portfolio view under `/portfolio`
- Contract ABIs in `lib/abis`

## Quick Start

Prerequisites:

- Node.js 18+ (or latest LTS)
- npm, pnpm, or yarn

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm start
```

Linting:

```bash
npm run lint
```

Scripts are defined in `package.json` (`dev`, `build`, `start`, `lint`).

## Environment

Create a `.env.local` at the project root to add any RPC/contract addresses or API keys required by your provider setup. See the provider and wagmi setup in [app/providers/provider.tsx](app/providers/provider.tsx) and [lib/wagmiClient.ts](lib/wagmiClient.ts) for the exact variables consumed by this app.

Common env vars you may want to set:

- `NEXT_PUBLIC_RPC_URL` — RPC endpoint for your testnet/mainnet
- `NEXT_PUBLIC_CHAIN_ID` — chain ID used by the UI
- Contract addresses used by the frontend (set names shown in code)

## Project Structure (high level)

- `app/` — Next.js app routes and UI pages
  - `dex/`, `liquidity/`, `nft/`, `faucet/`, `portfolio/` — feature pages
  - `components/` — reusable components (WalletConnect, Layout/Header/Footer)
- `lib/` — utilities and ABIs
  - `lib/abis/` — contract ABIs: `DEX_ABI.ts`, `ERC20_ABI.ts`, `Faucet_ABI.ts`, `Marketplace_ABI.ts`, `NFT_ABI.ts`
- `public/` — static assets

## Contracts & ABIs

ABIs used by the frontend are located in [lib/abis](lib/abis). Update or replace ABI files when integrating with different contracts.

## Contributing

Contributions are welcome. A simple workflow:

1. Fork the repo
2. Create a feature branch
3. Open a PR with a clear description

Please ensure TypeScript types and formatting are consistent with the existing codebase.

## Deployment

This project works well with Vercel (Next.js first-class support). To deploy manually, build and start the production server as shown above, or connect this repo to Vercel and use the `build` output.

## Next steps / Ideas

- Add end-to-end tests (Playwright / Cypress)
- Add a CI workflow for lint/build
- Document expected `.env` keys and add an example `.env.example`

## License

MIT — change as needed for your repository.

---

If you'd like, I can also generate a `.env.example`, basic GitHub Actions workflow for CI, or a short CONTRIBUTING.md. Tell me which you'd prefer next.
