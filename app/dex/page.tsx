"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { 
  ArrowDownUp, 
  Settings, 
  Droplets, 
  TrendingUp, 
  Info, 
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Wallet,
  ChevronDown,
  Zap,
  X,
  Search,
  BarChart3
} from "lucide-react";

// ------------------ ABIs ------------------
const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
];

const DEX_ABI = [
  { name: "addLiquidity", type: "function", inputs: [{ type: "uint8" }, { type: "uint256" }, { type: "uint256" }], stateMutability: "nonpayable" },
  { name: "swapExactInput", type: "function", inputs: [{ type: "uint8" }, { type: "address" }, { type: "uint256" }, { type: "uint256" }, { type: "address" }], stateMutability: "nonpayable" },
  { name: "previewSwap", type: "function", inputs: [{ type: "uint8" }, { type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "getReservesAB", type: "function", outputs: [{ type: "uint256" }, { type: "uint256" }], stateMutability: "view" },
  { name: "getReservesAC", type: "function", outputs: [{ type: "uint256" }, { type: "uint256" }], stateMutability: "view" },
  { name: "getReservesBC", type: "function", outputs: [{ type: "uint256" }, { type: "uint256" }], stateMutability: "view" },
];

// ------------------ Contract Addresses ------------------
const DEX_ADDRESS = "0xE0AdC4976bfbd0b59eBba32047F0B17756621EBd";
const TOKEN_A = "0x0e0Fd4B9D8B114Ee75CbC65ed80eE49F3EA45D95";
const TOKEN_B = "0x26a25ACc7ad5b30f92e8B1f69Df7266b367a9b83";
const TOKEN_C = "0x268c876dFf9f364d1f8Dc9e5dE0c0A8f56C286E6";

const TOKENS = [
  { address: TOKEN_A, symbol: "PLAT", name: "Platinum Token", color: "from-gray-400 to-gray-600", icon: "💎" },
  { address: TOKEN_B, symbol: "SIMP", name: "Simple Token", color: "from-blue-400 to-blue-600", icon: "🔷" },
  { address: TOKEN_C, symbol: "LMN", name: "Lemon Token", color: "from-yellow-400 to-yellow-600", icon: "🍋" },
];

// ------------------ Token Select Modal ------------------
function TokenSelectModal({ isOpen, onClose, onSelect, currentToken, tokens }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  if (!isOpen) return null;

  const filteredTokens = tokens.filter(token => 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 rounded-3xl border border-slate-700/50 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Select a Token</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredTokens.map((token) => (
            <button
              key={token.address}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              disabled={currentToken?.address === token.address}
              className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${
                currentToken?.address === token.address
                  ? 'bg-slate-800/50 cursor-not-allowed opacity-50'
                  : 'hover:bg-slate-800/70'
              }`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${token.color} flex items-center justify-center text-xl`}>
                {token.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-white">{token.symbol}</div>
                <div className="text-sm text-slate-400">{token.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------ Main Component ------------------
export default function DexPage() {
  const { address, isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState(TOKENS[1]);
  const [pairId, setPairId] = useState(1);
  const [amountIn, setAmountIn] = useState("");
  const [previewOut, setPreviewOut] = useState("0");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenSelectFrom, setShowTokenSelectFrom] = useState(false);
  const [showTokenSelectTo, setShowTokenSelectTo] = useState(false);
  const [swapStage, setSwapStage] = useState("idle"); // idle, approving, approved, swapping, success

  // ------------------ Auto Pair ID ------------------
  useEffect(() => {
    if (tokenIn.address === TOKEN_A && tokenOut.address === TOKEN_B) setPairId(1);
    else if (tokenIn.address === TOKEN_A && tokenOut.address === TOKEN_C) setPairId(2);
    else if (tokenIn.address === TOKEN_B && tokenOut.address === TOKEN_C) setPairId(3);
    else if (tokenIn.address === TOKEN_B && tokenOut.address === TOKEN_A) setPairId(1);
    else if (tokenIn.address === TOKEN_C && tokenOut.address === TOKEN_A) setPairId(2);
    else if (tokenIn.address === TOKEN_C && tokenOut.address === TOKEN_B) setPairId(3);
  }, [tokenIn, tokenOut]);

  // ------------------ Read: Preview Swap ------------------
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useReadContract({
    address: DEX_ADDRESS,
    abi: DEX_ABI,
    functionName: "previewSwap",
    args: [pairId, tokenIn.address, parseEther(amountIn || "0")],
    query: { 
      enabled: !!amountIn && amountIn !== "0" && parseFloat(amountIn) > 0,
      refetchInterval: 5000 
    },
  });

  useEffect(() => {
    setPreviewOut(previewData ? formatEther(previewData as bigint) : "0");
  }, [previewData]);

  // ------------------ Read: Balance & Allowance ------------------
  const { data: balanceIn, refetch: refetchBalance } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address!, DEX_ADDRESS],
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const allowance = (allowanceData as bigint) || 0n;

  // ------------------ Write: Approve ------------------
  const {
    writeContract: approveWrite,
    data: approveTx,
    isPending: approveWritePending,
    error: approveError,
  } = useWriteContract();

  const { 
    isLoading: approveTxLoading, 
    isSuccess: approveSuccess 
  } = useWaitForTransactionReceipt({ hash: approveTx });

  // ------------------ Write: Swap ------------------
  const {
    writeContract: swapWrite,
    data: swapTx,
    isPending: swapWritePending,
    error: swapError,
  } = useWriteContract();

  const { 
    isLoading: swapTxLoading, 
    isSuccess: swapSuccess 
  } = useWaitForTransactionReceipt({ hash: swapTx });

  // ------------------ Auto-Execute Approve Then Swap ------------------
  const handleApproveAndSwap = async () => {
    const needsApproval = allowance < parseEther(amountIn || "0");
    
    if (needsApproval) {
      setSwapStage("approving");
      await approveWrite({
        address: tokenIn.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [DEX_ADDRESS, BigInt(2) ** BigInt(256) - BigInt(1)],
      });
    } else {
      setSwapStage("swapping");
      const minOut = (parseFloat(previewOut) * (1 - slippage / 100)).toFixed(18);
      await swapWrite({
        address: DEX_ADDRESS,
        abi: DEX_ABI,
        functionName: "swapExactInput",
        args: [pairId, tokenIn.address, parseEther(amountIn), parseEther(minOut), address!],
      });
    }
  };

  // Auto-trigger swap after approval
  useEffect(() => {
    if (approveSuccess && swapStage === "approving") {
      setSwapStage("approved");
      refetchAllowance();
      
      // Wait 1 second then trigger swap
      setTimeout(async () => {
        setSwapStage("swapping");
        const minOut = (parseFloat(previewOut) * (1 - slippage / 100)).toFixed(18);
        await swapWrite({
          address: DEX_ADDRESS,
          abi: DEX_ABI,
          functionName: "swapExactInput",
          args: [pairId, tokenIn.address, parseEther(amountIn), parseEther(minOut), address!],
        });
      }, 1000);
    }
  }, [approveSuccess, swapStage]);

  useEffect(() => {
    if (swapSuccess) {
      setSwapStage("success");
      refetchBalance();
      refetchAllowance();
      setTimeout(() => {
        refetchReserves();
      }, 2000);
      
      // Reset after 5 seconds
      setTimeout(() => {
        setAmountIn("");
        setPreviewOut("0");
        setSwapStage("idle");
      }, 5000);
    }
  }, [swapSuccess]);

  // Reset stage on error
  useEffect(() => {
    if (approveError || swapError) {
      setSwapStage("idle");
    }
  }, [approveError, swapError]);

  // ------------------ Read: Liquidity Pools ------------------
  const { data: reservesAB, refetch: refetchAB } = useReadContract({ 
    address: DEX_ADDRESS, 
    abi: DEX_ABI, 
    functionName: "getReservesAB",
    query: { refetchInterval: 10000 }
  });
  const { data: reservesAC, refetch: refetchAC } = useReadContract({ 
    address: DEX_ADDRESS, 
    abi: DEX_ABI, 
    functionName: "getReservesAC",
    query: { refetchInterval: 10000 }
  });
  const { data: reservesBC, refetch: refetchBC } = useReadContract({ 
    address: DEX_ADDRESS, 
    abi: DEX_ABI, 
    functionName: "getReservesBC",
    query: { refetchInterval: 10000 }
  });

  const refetchReserves = () => {
    refetchAB();
    refetchAC();
    refetchBC();
  };

  // ------------------ Helper ------------------
  const swapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn("");
    setPreviewOut("0");
  };

  const setMaxAmount = () => {
    if (balanceIn) {
      const balance = formatEther(balanceIn as bigint);
      setAmountIn(balance);
    }
  };

  const handleTokenInSelect = (token) => {
    if (token.address === tokenOut.address) {
      setTokenOut(tokenIn);
    }
    setTokenIn(token);
    setAmountIn("");
    setPreviewOut("0");
  };

  const handleTokenOutSelect = (token) => {
    if (token.address === tokenIn.address) {
      setTokenIn(tokenOut);
    }
    setTokenOut(token);
    setPreviewOut("0");
  };

  const needsApproval = allowance < parseEther(amountIn || "0");
  const balanceDisplay = balanceIn ? parseFloat(formatEther(balanceIn as bigint)).toFixed(4) : "0.0000";
  const priceImpact = amountIn && previewOut !== "0" && parseFloat(amountIn) > 0
    ? Math.abs((parseFloat(previewOut) / parseFloat(amountIn) - 1) * 100)
    : 0;

  const isProcessing = swapStage !== "idle" && swapStage !== "success";
  const hasInsufficientBalance = balanceIn && parseFloat(amountIn) > parseFloat(formatEther(balanceIn as bigint));

  const exchangeRate = previewOut !== "0" && parseFloat(amountIn) > 0 
    ? (parseFloat(previewOut) / parseFloat(amountIn)).toFixed(6)
    : "0";

  // ------------------ UI ------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Token Select Modals */}
      <TokenSelectModal 
        isOpen={showTokenSelectFrom} 
        onClose={() => setShowTokenSelectFrom(false)}
        onSelect={handleTokenInSelect}
        currentToken={tokenIn}
        tokens={TOKENS}
      />
      <TokenSelectModal 
        isOpen={showTokenSelectTo} 
        onClose={() => setShowTokenSelectTo(false)}
        onSelect={handleTokenOutSelect}
        currentToken={tokenOut}
        tokens={TOKENS}
      />

      <div className="w-full mx-auto mt-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-slate-300 text-xl font-medium">Lightning-fast token swaps with zero intermediaries</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span>Live Prices</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
              <span>Best Rates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
              <span>Secure</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Swap Card */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ArrowDownUp className="w-5 h-5 text-white" />
                  </div>
                  Swap Tokens
                </h2>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2.5 hover:bg-slate-800/50 rounded-xl transition-all group"
                >
                  <Settings className={`w-5 h-5 text-slate-400 group-hover:text-white transition-all duration-300 ${showSettings ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="p-6 bg-slate-800/40 border-b border-slate-700/50 space-y-4 animate-in slide-in-from-top">
                  <div>
                    <label className="text-sm font-semibold text-slate-300 mb-3 block">Slippage Tolerance</label>
                    <div className="flex gap-2 flex-wrap">
                      {[0.1, 0.5, 1.0, 2.0].map(val => (
                        <button
                          key={val}
                          onClick={() => setSlippage(val)}
                          className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                            slippage === val 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                        className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white w-28 font-semibold focus:border-blue-500 outline-none transition-colors"
                        step="0.1"
                        min="0"
                        max="50"
                        placeholder="Custom"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-2">
                {/* From Token */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/70 transition-all shadow-xl">
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">You Pay</label>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300 font-medium">
                        {balanceDisplay}
                      </span>
                      {balanceIn && parseFloat(formatEther(balanceIn as bigint)) > 0 && (
                        <button
                          onClick={setMaxAmount}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 ml-1 px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-all"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={amountIn}
                      onChange={(e) => setAmountIn(e.target.value)}
                      className="flex-1 bg-transparent text-5xl font-black text-white outline-none placeholder-slate-600"
                      step="0.000001"
                    />
                    <button 
                      onClick={() => setShowTokenSelectFrom(true)}
                      className={`flex items-center px-1 py-2 rounded-2xl font-bold transition-all bg-gradient-to-r ${tokenIn.color} text-white hover:scale-105 shadow-xl hover:shadow-2xl`}
                    >
                      <span className="text-base">{tokenIn.icon}</span>
                      <span className="text-sm">{tokenIn.symbol}</span>
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                  {hasInsufficientBalance && (
                    <p className="text-red-400 text-sm mt-3 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Insufficient balance
                    </p>
                  )}
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-4 relative z-20">
                  <button
                    onClick={swapTokens}
                    className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border-4 border-slate-950 rounded-2xl p-4 transition-all hover:scale-110 group shadow-2xl"
                  >
                    <ArrowDownUp className="w-7 h-7 text-slate-300 group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
                  </button>
                </div>

                {/* To Token */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/70 transition-all shadow-xl">
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">You Receive</label>
                    {previewLoading && (
                      <span className="text-sm text-blue-400 flex items-center gap-2 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculating...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="0.0"
                      value={previewOut !== "0" ? parseFloat(previewOut).toFixed(6) : ""}
                      readOnly
                      className="flex-1 bg-transparent text-5xl font-black text-white outline-none placeholder-slate-600"
                    />
                    <button 
                      onClick={() => setShowTokenSelectTo(true)}
                      className={`flex items-center px-1 py-2 rounded-2xl font-bold transition-all bg-gradient-to-r ${tokenOut.color} text-white hover:scale-105 shadow-xl hover:shadow-2xl`}
                    >
                      <span className="text-base">{tokenOut.icon}</span>
                      <span className="text-sm">{tokenOut.symbol}</span>
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Transaction Details */}
                {amountIn && previewOut !== "0" && parseFloat(amountIn) > 0 && (
                  <div className="mt-4 bg-slate-800/50 rounded-2xl p-5 space-y-3 border border-slate-700/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Exchange Rate</span>
                      <span className="text-white font-bold">
                        1 {tokenIn.symbol} ≈ {exchangeRate} {tokenOut.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Price Impact</span>
                      <span className={`font-black ${
                        priceImpact > 5 ? "text-red-400" : 
                        priceImpact > 2 ? "text-yellow-400" : 
                        "text-green-400"
                      }`}>
                        {priceImpact < 0.01 ? "< 0.01" : priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Minimum Received</span>
                      <span className="text-white font-bold">
                        {(parseFloat(previewOut) * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-700/50">
                      <span className="text-slate-400 font-medium">Est. Network Fee</span>
                      <span className="text-slate-300 font-semibold">~$0.50 - $1.50</span>
                    </div>
                  </div>
                )}

                {/* Action Button with Multi-Stage Process */}
                <div className="mt-6">
                  {!isConnected ? (
                    <button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 rounded-2xl font-black text-xl transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] flex items-center justify-center gap-2">
                      <Wallet className="w-6 h-6" />
                      Connect Wallet
                    </button>
                  ) : !amountIn || amountIn === "0" ? (
                    <button 
                      disabled 
                      className="w-full bg-slate-800 text-slate-500 py-6 rounded-2xl font-black text-xl cursor-not-allowed"
                    >
                      Enter Amount
                    </button>
                  ) : hasInsufficientBalance ? (
                    <button 
                      disabled 
                      className="w-full bg-red-500/20 text-red-400 py-6 rounded-2xl font-black text-xl cursor-not-allowed border-2 border-red-500/50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-6 h-6" />
                      Insufficient {tokenIn.symbol} Balance
                    </button>
                  ) : (
                    <button 
                      onClick={handleApproveAndSwap} 
                      disabled={isProcessing || previewOut === "0"}
                      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-6 rounded-2xl font-black text-xl transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                      {swapStage === "approving" && (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Approving {tokenIn.symbol}...</span>
                        </>
                      )}
                      {swapStage === "approved" && (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          <span>Approved! Initiating Swap...</span>
                        </>
                      )}
                      {swapStage === "swapping" && (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Swapping Tokens...</span>
                        </>
                      )}
                      {swapStage === "idle" && (
                        <>
                          <Zap className="w-6 h-6" />
                          <span>{needsApproval ? "Approve & Swap" : "Swap Tokens"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Multi-Stage Progress Indicator */}
                {isProcessing && (
                  <div className="mt-4 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-300">Transaction Progress</span>
                      <span className="text-xs text-slate-400">
                        {swapStage === "approving" && "Step 1 of 2"}
                        {swapStage === "approved" && "Step 2 of 2"}
                        {swapStage === "swapping" && "Step 2 of 2"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        swapStage === "approving" ? "bg-blue-500/20 border border-blue-500/50" : 
                        swapStage === "approved" || swapStage === "swapping" ? "bg-green-500/20 border border-green-500/50" : 
                        "bg-slate-700/30"
                      }`}>
                        {(swapStage === "approved" || swapStage === "swapping") ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : swapStage === "approving" ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">Approve Token</p>
                          <p className="text-xs text-slate-400">Allow DEX to spend your {tokenIn.symbol}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        swapStage === "swapping" ? "bg-blue-500/20 border border-blue-500/50" : 
                        "bg-slate-700/30"
                      }`}>
                        {swapStage === "swapping" ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">Execute Swap</p>
                          <p className="text-xs text-slate-400">Complete the token exchange</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {swapStage === "success" && swapSuccess && (
                  <div className="mt-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl p-5 flex items-center gap-4 animate-in slide-in-from-top">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-green-400 font-bold text-lg">Swap Successful! 🎉</p>
                      <p className="text-green-300/80 text-sm">Your tokens have been exchanged successfully</p>
                    </div>
                    <a 
                      href={`https://etherscan.io/tx/${swapTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                )}
                {(approveError || swapError) && (
                  <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <XCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <div>
                      <p className="text-red-400 font-bold text-lg">Transaction Failed</p>
                      <p className="text-red-300/80 text-sm">Please try again or check your wallet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Liquidity Pools */}
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Liquidity Pools</h2>
                    <p className="text-xs text-slate-400">Real-time reserves</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <PoolCard 
                  title="PLAT / SIMP" 
                  token1="PLAT"
                  token2="SIMP"
                  reserves={reservesAB}
                  color1={TOKENS[0].color}
                  color2={TOKENS[1].color}
                  icon1={TOKENS[0].icon}
                  icon2={TOKENS[1].icon}
                />
                <PoolCard 
                  title="PLAT / LMN" 
                  token1="PLAT"
                  token2="LMN"
                  reserves={reservesAC}
                  color1={TOKENS[0].color}
                  color2={TOKENS[2].color}
                  icon1={TOKENS[0].icon}
                  icon2={TOKENS[2].icon}
                />
                <PoolCard 
                  title="SIMP / LMN" 
                  token1="SIMP"
                  token2="LMN"
                  reserves={reservesBC}
                  color1={TOKENS[1].color}
                  color2={TOKENS[2].color}
                  icon1={TOKENS[1].icon}
                  icon2={TOKENS[2].icon}
                />
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-2xl rounded-3xl border border-blue-500/30 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-bold text-white text-lg">DEX Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-sm text-slate-300">Total Volume (24h)</span>
                  <span className="text-white font-bold">$1.2M</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-sm text-slate-300">Total Liquidity</span>
                  <span className="text-white font-bold">$850K</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <span className="text-sm text-slate-300">Active Pairs</span>
                  <span className="text-white font-bold">3</span>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-2xl rounded-3xl border border-purple-500/30 p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-3">Pro Trading Tips</h3>
                  <ul className="text-sm text-slate-300 space-y-2.5">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1 font-bold">•</span>
                      <span>One-click approve & swap saves time and gas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1 font-bold">•</span>
                      <span>Monitor price impact for optimal trades</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1 font-bold">•</span>
                      <span>Adjust slippage for market volatility</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1 font-bold">•</span>
                      <span>Check pool liquidity before large swaps</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ PoolCard Component ------------------
function PoolCard({ title, token1, token2, reserves, color1, color2, icon1, icon2 }: any) {
  if (!reserves) {
    return (
      <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50">
        <div className="flex justify-between mb-3 items-center">
          <span className="text-base font-bold text-white">{title}</span>
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm">Loading pool data...</p>
      </div>
    );
  }

  const reserve1 = parseFloat(formatEther(reserves[0] as bigint));
  const reserve2 = parseFloat(formatEther(reserves[1] as bigint));
  const priceRatio = (reserve2 / reserve1).toFixed(6);
  const tvl = ((reserve1 + reserve2) * 1.5).toFixed(2);
  const percentage1 = (reserve1 / (reserve1 + reserve2)) * 100;
  const percentage2 = (reserve2 / (reserve1 + reserve2)) * 100;

  return (
    <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600/70 transition-all hover:bg-slate-800/60 group cursor-pointer hover:scale-[1.02] hover:shadow-xl">
      <div className="flex justify-between mb-4 items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color1} flex items-center justify-center text-lg shadow-lg`}>
              {icon1}
            </div>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color2} flex items-center justify-center text-lg shadow-lg absolute -right-4 top-0 border-2 border-slate-800`}>
              {icon2}
            </div>
          </div>
          <span className="text-base font-black text-white ml-5">{title}</span>
        </div>
        <TrendingUp className="w-5 h-5 text-green-400 group-hover:scale-125 transition-transform" />
      </div>
      
      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-medium">{token1} Reserve</span>
          <span className="text-white font-bold">{reserve1.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-medium">{token2} Reserve</span>
          <span className="text-white font-bold">{reserve2.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        
        <div className="pt-3 border-t border-slate-700/50 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Price Ratio</span>
            <span className="text-blue-400 font-black">{priceRatio}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-medium">Total Value</span>
            <span className="text-purple-400 font-black">${tvl}K</span>
          </div>
        </div>
      </div>
      
      {/* Enhanced Progress Bar */}
      <div className="mt-4 h-2.5 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full bg-gradient-to-r ${color1} transition-all duration-500 shadow-lg`}
          style={{ width: `${percentage1}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-2 font-semibold">
        <span>{percentage1.toFixed(1)}% {token1}</span>
        <span>{percentage2.toFixed(1)}% {token2}</span>
      </div>
    </div>
  );
}