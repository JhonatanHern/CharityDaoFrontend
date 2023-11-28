import { configureChains, createConfig } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";

import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "@wagmi/core/providers/alchemy";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [polygonMumbai],
  [
    import.meta.env.VITE_ALCHEMY_API_KEY
      ? alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY + "" })
      : publicProvider(),
  ]
);

export const config = createConfig({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains })],
  publicClient,
  webSocketPublicClient,
});
