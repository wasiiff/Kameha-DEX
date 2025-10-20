"use client";

import React, { useState } from "react";
import Link from "next/link";
import WalletConnect from "../WalletConnect";
import { Wallet, Menu, X } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "DEX" },
    { href: "/faucet", label: "Faucet" },
    { href: "/nft", label: "NFTs" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/liquidity", label: "Liquidity" },
  ];

  return (
    <header className="border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg md:text-xl font-extrabold text-white tracking-tight hover:text-cyan-400 transition-colors"
          >
            <Wallet size={22} className="text-cyan-500" />
            Kasplex Finance
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 text-slate-300 text-sm">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 rounded-lg hover:bg-slate-900/60 hover:text-cyan-400 transition-all font-medium"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Wallet Section (Always visible) */}
        <div className="hidden md:block min-w-[220px]">
          <WalletConnect />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-slate-300 hover:text-cyan-400 transition-colors"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800/60 bg-slate-950/90 backdrop-blur-md">
          <nav className="flex flex-col space-y-1 py-3 px-4 text-slate-300 text-sm">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-lg hover:bg-slate-900/70 hover:text-cyan-400 transition-all font-medium"
              >
                {label}
              </Link>
            ))}

            {/* WalletConnect for Mobile */}
            <div className="pt-3 border-t border-slate-800/60">
              <WalletConnect />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
