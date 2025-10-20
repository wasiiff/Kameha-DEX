import "./globals.css";
import { Providers } from "./providers/provider";
import Header from "./components/Layout/Header";

export const metadata = {
  title: "Kasplex Finance",
  description: "DEX + Faucet + NFT marketplace on Kasplex Testnet"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black text-white">
            <Header />
            <main className="w-full mx-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}