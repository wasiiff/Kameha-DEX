"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import {
  Wallet,
  TrendingUp,
  RefreshCw,
  PieChart,
  DollarSign,
  Coins,
  Grid3X3,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";

/* -------------------------
   Addresses & ABIs (local)
   ------------------------- */
const NFT_ADDRESS = "0xDA47f9cB54F34BbF1988bD6263634CF8F4816DB2";
const TOKEN_A_ADDRESS = "0x0e0Fd4B9D8B114Ee75CbC65ed80eE49F3EA45D95";
const TOKEN_B_ADDRESS = "0x26a25ACc7ad5b30f92e8B1f69Df7266b367a9b83";
const TOKEN_C_ADDRESS = "0x268c876dFf9f364d1f8Dc9e5dE0c0A8f56C286E6";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
];

const NFT_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
];

/* -------------------------
   Token config (UI only)
   ------------------------- */
const TOKENS = [
  {
    address: TOKEN_A_ADDRESS,
    symbol: "PLAT",
    name: "Platform Token",
    icon: "💎",
    gradient: "from-gray-400 to-gray-600",
    accentColor: "text-gray-400",
  },
  {
    address: TOKEN_B_ADDRESS,
    symbol: "SIMP",
    name: "Simple Token",
    icon: "🔷",
    gradient: "from-blue-400 to-blue-600",
    accentColor: "text-blue-400",
  },
  {
    address: TOKEN_C_ADDRESS,
    symbol: "LMN",
    name: "Lemon Token",
    icon: "🍋",
    gradient: "from-yellow-400 to-yellow-600",
    accentColor: "text-yellow-400",
  },
];

/* -------------------------
   Helpers: safe formatting
   ------------------------- */

/**
 * Format a wei bigint safely into a human readable string (no exponential output)
 * - Uses viem.formatEther(wei) to get a decimal string
 * - Then formats integer part with thousands separators and limits decimals to 'decimals'
 * - For extremely small values: shows "<0.01" (controlled by smallThreshold)
 */
function formatWeiToReadable(
  wei: bigint | undefined,
  decimals = 2,
  smallThreshold = 0.01
) {
  if (!wei) return "0.00";

  // formatEther returns a decimal string (e.g. "1234.5678")
  const decimalStr = formatEther(wei); // string
  // split into integer and fraction
  const [intPartRaw, fracPartRaw = ""] = decimalStr.split(".");

  // convert integer part to grouped format (commas)
  const intWithCommas = intPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // prepare fraction (pad or cut)
  const frac = (fracPartRaw + "0".repeat(decimals)).slice(0, decimals);

  // Compose final
  // But if intPartRaw === "0" and fractional value < smallThreshold, show "<0.01" (or corresponding)
  if (intPartRaw === "0") {
    const fracAsNumber = Number("0." + (fracPartRaw.slice(0, 6) || "0"));
    if (fracAsNumber > 0 && fracAsNumber < smallThreshold) {
      return `<${smallThreshold.toFixed(decimals)}`;
    }
  }

  return `${intWithCommas}${decimals > 0 ? "." + frac : ""}`;
}

/**
 * Convert wei bigint to USD-string using a multiplier (multNum / multDen)
 * - Avoids intermediate floating errors by multiplying wei as bigint
 * - Example multiplier 1.5 => multNum=3 multDen=2
 */
function formatWeiToUsdReadable(
  wei: bigint | undefined,
  multNum = 3n,
  multDen = 2n,
  decimals = 2
) {
  if (!wei) return "0.00";
  try {
    const adjusted = (wei * multNum) / multDen; // still in wei
    return formatWeiToReadable(adjusted, decimals);
  } catch {
    // fallback: try formatEther then multiply (less safe)
    const decimalStr = formatEther(wei);
    const approx = (Number(decimalStr) * Number(multNum)) / Number(multDen);
    if (!isFinite(approx)) return "0.00";
    return approx.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}

/* -------------------------
   Component
   ------------------------- */
export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  // store balances as raw wei bigint for accurate arithmetic
  const [balances, setBalances] = useState<
    { address: string; balance: bigint }[]
  >(TOKENS.map((t) => ({ address: t.address, balance: 0n })));

  // NFT balance
  const [nftCount, setNftCount] = useState<number>(0);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Read token balances using wagmi hooks (three separate reads, but throttled by enabled) ---
  const { data: bA, refetch: refetchA } = useReadContract({
    address: TOKENS[0].address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: bB, refetch: refetchB } = useReadContract({
    address: TOKENS[1].address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: bC, refetch: refetchC } = useReadContract({
    address: TOKENS[2].address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // NFT balance read
  const { data: nftBalRaw, refetch: refetchNFT } = useReadContract({
    address: NFT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Sync reads into local state - keep this minimal to avoid re-renders
  useEffect(() => {
    // only update when address exists
    if (!address) {
      setBalances(TOKENS.map((t) => ({ address: t.address, balance: 0n })));
      setNftCount(0);
      return;
    }

    try {
      setBalances([
        { address: TOKENS[0].address, balance: (bA as bigint) || 0n },
        { address: TOKENS[1].address, balance: (bB as bigint) || 0n },
        { address: TOKENS[2].address, balance: (bC as bigint) || 0n },
      ]);
      setNftCount(Number(nftBalRaw ?? 0n));
      setError(null);
    } catch (err) {
      console.error("Error syncing balances:", err);
      setError("Failed to read balances.");
    }
  }, [address, bA, bB, bC, nftBalRaw]);

  // Derived values (memoized)
  const totalTokensWei = useMemo(() => {
    // sum wei bigints
    return balances.reduce((acc, b) => acc + (b.balance || 0n), 0n);
  }, [balances]);

  const nonZeroBalances = useMemo(
    () => balances.filter((b) => b.balance && b.balance > 0n),
    [balances]
  );

  // --- Refresh handler (with error handling) ---
  const handleRefresh = async () => {
    if (!address) return;
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.all([refetchA(), refetchB(), refetchC(), refetchNFT()]);
    } catch (err: any) {
      console.error("Refresh error:", err);
      setError("Failed to refresh balances.");
    } finally {
      // small delay so the spinner is visible
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  /* UI helpers */
  const formatTokenCardAmount = (wei: bigint | undefined) =>
    formatWeiToReadable(wei, 2);
  const formatTokenCardUsd = (wei: bigint | undefined) =>
    formatWeiToUsdReadable(wei, 3n, 2n, 2); // multiplier 3/2 = 1.5

  const formatTotal = () => formatWeiToReadable(totalTokensWei, 2);
  const formatTotalUsd = () =>
    formatWeiToUsdReadable(totalTokensWei, 3n, 2n, 2);

  /* Render */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-6 relative overflow-hidden">
      {/* decorative glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 -top-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white">My Portfolio</h1>
            <p className="text-slate-300 mt-1">
              Track tokens & NFTs in one place
            </p>
          </div>

          {isConnected && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition"
                title="Refresh balances"
              >
                <RefreshCw
                  className={`w-6 h-6 ${
                    isRefreshing
                      ? "animate-spin text-cyan-300"
                      : "text-cyan-400"
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {!isConnected ? (
          <div className="text-center py-20">
            <div className="w-28 h-28 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Connect Wallet
            </h2>
            <p className="text-slate-400">
              Connect your wallet to view balances
            </p>
          </div>
        ) : (
          <>
            {/* top summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-300">
                        Total Token Value
                      </div>
                      <div
  className="text-base font-semibold text-white mt-1 max-w-[10rem] truncate opacity-90 tracking-tight"
  title={formatTotal()}
>
  {formatTotal()}
</div>

                      <div className="text-sm text-cyan-400 mt-1">
                        ≈ ${formatTotalUsd()}
                      </div>
                    </div>
                  </div>
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-2xl rounded-2xl border border-purple-500/30 p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-300">
                      Active Token Types
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {nonZeroBalances.length}/3
                    </div>
                  </div>
                  <Coins className="w-8 h-8 text-purple-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-2xl rounded-2xl border border-blue-500/30 p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-300">NFTs Owned</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {nftCount}
                    </div>
                    <div className="text-sm text-blue-400 mt-1">
                      Digital collectibles
                    </div>
                  </div>
                  <Grid3X3 className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            {/* token cards */}
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-6 shadow-xl mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Token Balances
                  </h3>
                  <p className="text-sm text-slate-400">
                    Your current holdings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TOKENS.map((t, idx) => {
                  const wei = balances[idx]?.balance ?? 0n;
                  const has = wei > 0n;
                  return (
                    <div
                      key={t.address}
                      className={`bg-slate-800/40 rounded-2xl p-5 border ${
                        has
                          ? "border-slate-700/50 hover:border-cyan-500/50"
                          : "border-slate-700/30 opacity-70"
                      } transition`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-14 h-14 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-3xl`}
                        >
                          {t.icon}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            {t.symbol}
                          </div>
                          <div className="text-xs text-slate-400">{t.name}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-400 mb-1">
                          Balance
                        </div>
                        <div
                          title={formatTokenCardAmount(wei)}
                          className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 drop-shadow-lg tracking-tight"
                        >
                          {formatTokenCardAmount(wei)}
                        </div>
                        <div className={`text-sm mt-1 ${t.accentColor}`}>
                          ≈ ${formatTokenCardUsd(wei)} USD
                        </div>
                      </div>

                      {has && (
                        <div className="pt-3 mt-4 border-t border-slate-700/40">
                          <div className="flex justify-between text-xs text-slate-400">
                            <div>24h Change</div>
                            <div className="text-green-400 font-semibold">
                              +2.5%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NFT area (simple and performant) */}
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-6 shadow-xl mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Grid3X3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      My NFT Collection
                    </h3>
                    <p className="text-sm text-slate-400">
                      {nftCount} items owned
                    </p>
                  </div>
                </div>
                <div>
                  <a
                    href="/marketplace"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300"
                  >
                    <Sparkles className="w-4 h-4" /> Browse Marketplace
                  </a>
                </div>
              </div>

              {nftCount === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Grid3X3 className="w-10 h-10 text-slate-600" />
                  </div>
                  <h4 className="text-2xl text-white font-bold mb-2">
                    No NFTs Yet
                  </h4>
                  <p className="text-slate-400">
                    Get NFTs from the marketplace to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* For now we show placeholders — fetch tokenIDs via an indexer or tokenOfOwnerByIndex when available */}
                  {Array.from({ length: nftCount }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-700/50"
                    >
                      <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <div className="text-slate-300">NFT #{i + 1}</div>
                      </div>
                      <div className="p-4">
                        <div className="text-white font-bold">NFT #{i + 1}</div>
                        <div className="text-xs text-slate-400 mt-2">Owned</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* distribution & quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-2xl rounded-2xl border border-cyan-500/30 p-6 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <PieChart className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Portfolio Distribution
                    </h4>
                    <p className="text-sm text-slate-400">Percent by token</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {TOKENS.map((t, i) => {
                    const wei = balances[i]?.balance ?? 0n;
                    const raw = formatEther(wei); // decimal string
                    const percent = totalTokensWeiToPercent(
                      totalTokensWei,
                      wei
                    );
                    return (
                      <div key={t.address}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">{t.symbol}</span>
                          <span className="text-white font-semibold">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-slate-800/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${t.gradient}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-2xl rounded-2xl border border-purple-500/30 p-6 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-purple-400" />
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Quick Actions
                    </h4>
                    <p className="text-sm text-slate-400">Common shortcuts</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    className="block text-sm text-slate-300 hover:text-white"
                    href="/faucet"
                  >
                    → Get free tokens from faucet
                  </a>
                  <a
                    className="block text-sm text-slate-300 hover:text-white"
                    href="/marketplace"
                  >
                    → Browse NFT marketplace
                  </a>
                  <a
                    className="block text-sm text-slate-300 hover:text-white"
                    href="/dex"
                  >
                    → Trade tokens on DEX
                  </a>
                  <a
                    className="block text-sm text-slate-300 hover:text-white"
                    href="/list"
                  >
                    → List your NFTs for sale
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
        {/* error display */}
        {error && (
          <div className="mt-6 p-3 rounded-lg bg-red-900/30 border border-red-500/40 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------
   Helper: compute percent
   Works with bigints to avoid precision loss
   ------------------------- */
function totalTokensWeiToPercent(totalWei: bigint, tokenWei: bigint) {
  if (totalWei === 0n) return 0;
  // percent = (tokenWei / totalWei) * 100
  // compute tokenWei * 10000 / totalWei to get two decimals then /100
  const scaled = (tokenWei * 10000n) / totalWei; // integer where 1 => 0.01%
  const percent = Number(scaled) / 100;
  return percent;
}
