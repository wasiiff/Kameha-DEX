"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import { parseEther } from "viem";
import {
  Wallet,
  PlusCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Droplets,
  ArrowRightLeft,
} from "lucide-react";

const TRIPLE_SWAP_ADDRESS = "0xE0AdC4976bfbd0b59eBba32047F0B17756621EBd";

const TRIPLE_SWAP_ABI = [
  {
    name: "addLiquidity",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pair", type: "uint8" },
      { name: "amount1", type: "uint256" },
      { name: "amount2", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
];

const TOKENS = [
  {
    symbol: "PLAT",
    name: "Platinum Token",
    gradient: "from-slate-400 via-slate-300 to-slate-500",
    color: "slate",
  },
  {
    symbol: "SIMP",
    name: "Simple Token",
    gradient: "from-blue-400 via-cyan-300 to-blue-500",
    color: "blue",
  },
  {
    symbol: "LMN",
    name: "Lemon Token",
    gradient: "from-yellow-400 via-amber-300 to-yellow-500",
    color: "yellow",
  },
];

export default function AddLiquidityPage() {
  const { isConnected } = useAccount();
  const [pair, setPair] = useState(1);
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isSuccess, isLoading: waiting } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleAddLiquidity = async () => {
    try {
      await writeContract({
        address: TRIPLE_SWAP_ADDRESS,
        abi: TRIPLE_SWAP_ABI,
        functionName: "addLiquidity",
        args: [pair, parseEther(amount1 || "0"), parseEther(amount2 || "0")],
      });
    } catch (err) {
      console.error("Error adding liquidity:", err);
    }
  };

  const getPairTokens = () => {
    if (pair === 1) return [TOKENS[0], TOKENS[1]];
    if (pair === 2) return [TOKENS[0], TOKENS[2]];
    return [TOKENS[1], TOKENS[2]];
  };

  const [token1, token2] = getPairTokens();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm px-5 py-2 rounded-full border border-blue-500/20 mb-6">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-semibold tracking-wide">LIQUIDITY POOLS</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent leading-tight">
            Add Liquidity
          </h1>
          
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Provide liquidity to earn trading fees. Supply equal value of both tokens to the pool.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
            {!isConnected ? (
              <div className="text-center py-20 px-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Connect Wallet</h3>
                <p className="text-slate-400 text-lg">Please connect your wallet to add liquidity</p>
              </div>
            ) : (
              <div className="p-8">
                {/* Pair Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">
                    Trading Pair
                  </label>
                  <div className="relative">
                    <select
                      value={pair}
                      onChange={(e) => setPair(Number(e.target.value))}
                      className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-2xl px-4 py-4 text-white text-lg font-semibold appearance-none cursor-pointer focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none"
                    >
                      <option value={1}>{TOKENS[0].symbol} / {TOKENS[1].symbol}</option>
                      <option value={2}>{TOKENS[0].symbol} / {TOKENS[2].symbol}</option>
                      <option value={3}>{TOKENS[1].symbol} / {TOKENS[2].symbol}</option>
                    </select>
                    <ArrowRightLeft className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Token Input Cards */}
                <div className="space-y-4 mb-8">
                  {/* First Token */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                      {token1.name}
                    </label>
                    <div className={`bg-gradient-to-br ${token1.gradient} p-[2px] rounded-2xl shadow-lg`}>
                      <div className="bg-slate-900 rounded-[14px] p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-white">{token1.symbol}</span>
                          <Sparkles className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          value={amount1}
                          onChange={(e) => setAmount1(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex justify-center">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-900">
                      <PlusCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>

                  {/* Second Token */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                      {token2.name}
                    </label>
                    <div className={`bg-gradient-to-br ${token2.gradient} p-[2px] rounded-2xl shadow-lg`}>
                      <div className="bg-slate-900 rounded-[14px] p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-white">{token2.symbol}</span>
                          <Sparkles className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          value={amount2}
                          onChange={(e) => setAmount2(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleAddLiquidity}
                  disabled={!amount1 || !amount2 || isPending || waiting}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-size-200 bg-pos-0 hover:bg-pos-100 py-5 rounded-2xl font-bold text-lg text-white shadow-xl shadow-blue-500/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3"
                >
                  {isPending || waiting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Processing Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Droplets className="w-6 h-6" />
                      <span>Add Liquidity</span>
                    </>
                  )}
                </button>

                {/* Status Messages */}
                {isSuccess && (
                  <div className="mt-6 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-emerald-300 font-bold text-lg mb-1">Success!</div>
                      <div className="text-emerald-400/80 text-sm">Your liquidity has been added to the pool.</div>
                    </div>
                  </div>
                )}

                {writeError && (
                  <div className="mt-6 bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-red-300 font-bold text-lg mb-1">Transaction Failed</div>
                      <div className="text-red-400/80 text-sm break-words">
                        {String(writeError.message || writeError)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Card */}
          {isConnected && (
            <div className="mt-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Earn Trading Fees</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    By adding liquidity, you'll earn a portion of trading fees proportional to your share of the pool.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}