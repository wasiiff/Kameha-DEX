"use client";

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import type { Chain } from "wagmi/chains";

export const kasplexTestnet: Chain = {
  id: 167012,
  name: "Kasplex Testnet",
  nativeCurrency: {
    name: "Kaspa",
    symbol: "KAS",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.kasplextest.xyz/"] },
    public: { http: ["https://rpc.kasplextest.xyz/"] },
  },
  testnet: true,
};

export const config = createConfig({
  chains: [kasplexTestnet],
  connectors: [injected()],
  transports: {
    [kasplexTestnet.id]: http("https://rpc.kasplextest.xyz/"),
  },
});
