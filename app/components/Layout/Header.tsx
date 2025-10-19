"use client";
import Link from "next/link";
import WalletConnect from "../WalletConnect";
import { Wallet } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-extrabold text-white tracking-tight hover:text-cyan-400 transition-colors"
          >
            <Wallet size={22} className="text-cyan-500" />
            Kaspa Finance
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-slate-300 text-sm">
            {[
              { href: "/", label: "DEX" },
              { href: "/faucet", label: "Faucet" },
              { href: "/nft", label: "NFTs" },
              { href: "/portfolio", label: "Portfolio" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-lg hover:bg-slate-900/60 hover:text-cyan-400 transition-all font-medium"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Wallet Section */}
        <div className="min-w-[220px]">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
