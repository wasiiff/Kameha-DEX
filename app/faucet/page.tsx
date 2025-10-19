"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { 
  Droplet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Wallet,
  Zap,
  ExternalLink,
  Sparkles,
  Timer,
  Coins
} from "lucide-react";

// ------------------ ABIs ------------------
const FAUCET_ABI = [
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "lastClaimTime",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "CLAIM_INTERVAL",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "CLAIM_AMOUNT",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "tokenA",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "tokenB",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "tokenC",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
];

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
];

const FAUCET_ADDRESS = "0x607D41d416304C0440ED374377AC0AA839d254AA";

const TOKENS = [
  { symbol: "PLAT", icon: "💎", gradient: "from-slate-400 via-slate-300 to-slate-500" },
  { symbol: "SIMP", icon: "🔷", gradient: "from-blue-400 via-cyan-300 to-blue-500" },
  { symbol: "LMN", icon: "🍋", gradient: "from-yellow-400 via-amber-300 to-yellow-500" },
];

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const [cooldown, setCooldown] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Read faucet data
  const { data: lastClaim, refetch: refetchLastClaim } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "lastClaimTime",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: interval } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "CLAIM_INTERVAL",
  });

  const { data: claimAmount } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "CLAIM_AMOUNT",
  });

  const { data: tokenAAddress } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "tokenA",
  });

  const { data: tokenBAddress } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "tokenB",
  });

  const { data: tokenCAddress } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "tokenC",
  });

  // Read faucet balances
  const { data: faucetBalanceA } = useReadContract({
    address: tokenAAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [FAUCET_ADDRESS],
    query: { enabled: !!tokenAAddress, refetchInterval: 10000 },
  });

  const { data: faucetBalanceB } = useReadContract({
    address: tokenBAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [FAUCET_ADDRESS],
    query: { enabled: !!tokenBAddress, refetchInterval: 10000 },
  });

  const { data: faucetBalanceC } = useReadContract({
    address: tokenCAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [FAUCET_ADDRESS],
    query: { enabled: !!tokenCAddress, refetchInterval: 10000 },
  });

  // Claim function
  const { 
    writeContract: claim, 
    data: claimTx, 
    isPending: claimPending,
    error: claimError 
  } = useWriteContract();

  const { 
    isLoading: claimTxLoading, 
    isSuccess: claimSuccess 
  } = useWaitForTransactionReceipt({ hash: claimTx });

  const handleClaim = () => {
    claim({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "claim",
    });
  };

  // Update after successful claim
  useEffect(() => {
    if (claimSuccess) {
      refetchLastClaim();
    }
  }, [claimSuccess, refetchLastClaim]);

  // Countdown timer
  useEffect(() => {
    if (!lastClaim || !interval) return;
    
    const nextClaim = Number(lastClaim) + Number(interval);
    
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remain = nextClaim - now;
      
      if (remain > 0) {
        setCooldown(remain);
        const hours = Math.floor(remain / 3600);
        const minutes = Math.floor((remain % 3600) / 60);
        const seconds = remain % 60;
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setCooldown(0);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [lastClaim, interval]);

  const canClaim = cooldown === 0 && isConnected;
  const isClaiming = claimPending || claimTxLoading;
  const claimAmountFormatted = claimAmount ? formatEther(claimAmount as bigint) : "100";

  const faucetBalances = [
    { token: "PLAT", balance: faucetBalanceA, ...TOKENS[0] },
    { token: "SIMP", balance: faucetBalanceB, ...TOKENS[1] },
    { token: "LMN", balance: faucetBalanceC, ...TOKENS[2] },
  ];

  const progressPercentage = interval ? ((Number(interval) - cooldown) / Number(interval)) * 100 : 0;

  return (
    <div className="min-h-screen px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-3 bg-slate-900/60 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-800/60 mb-6">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300 text-sm font-medium">Free Testnet Tokens</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Token Faucet
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Claim {claimAmountFormatted} tokens of each type every 24 hours for testing on Kaspa Finance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Claim Section */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden">
              <div className="p-8">
                {!isConnected ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-6 border border-blue-500/20">
                      <Wallet className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                      Connect your wallet to start claiming free testnet tokens for development
                    </p>
                  </div>
                ) : cooldown > 0 ? (
                  <div>
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
                        <Timer className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Next Claim Available In</h3>
                      <p className="text-slate-400">Your tokens will be ready to claim when the timer reaches zero</p>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                      <div className="bg-slate-800/60 rounded-xl p-4 min-w-[100px] border border-slate-700/50">
                        <div className="text-4xl font-bold text-white mb-1 text-center">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 text-center uppercase tracking-wider">Hours</div>
                      </div>
                      <div className="text-3xl font-bold text-slate-600">:</div>
                      <div className="bg-slate-800/60 rounded-xl p-4 min-w-[100px] border border-slate-700/50">
                        <div className="text-4xl font-bold text-white mb-1 text-center">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 text-center uppercase tracking-wider">Minutes</div>
                      </div>
                      <div className="text-3xl font-bold text-slate-600">:</div>
                      <div className="bg-slate-800/60 rounded-xl p-4 min-w-[100px] border border-slate-700/50">
                        <div className="text-4xl font-bold text-white mb-1 text-center">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-slate-400 text-center uppercase tracking-wider">Seconds</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-300 font-medium">{Math.floor(progressPercentage)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/50">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-1000 rounded-full"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4 border border-emerald-500/20 animate-pulse">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Ready to Claim!</h3>
                      <p className="text-slate-400 mb-6">
                        Claim {claimAmountFormatted} tokens of each type
                      </p>
                    </div>

                    {/* Token Preview */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {TOKENS.map((token, idx) => (
                        <div key={idx} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 text-center">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${token.gradient} flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg`}>
                            {token.icon}
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">{claimAmountFormatted}</div>
                          <div className="text-sm text-slate-400">{token.symbol}</div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Claim Tokens
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Success Message */}
                {claimSuccess && (
                  <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-emerald-400 font-bold">Tokens Claimed Successfully!</p>
                      <p className="text-emerald-300/70 text-sm">Check your wallet for the tokens</p>
                    </div>
                    {claimTx && (
                      <a 
                        href={`https://etherscan.io/tx/${claimTx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {claimError && (
                  <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-red-400 font-bold">Claim Failed</p>
                      <p className="text-red-300/70 text-sm">Please try again later</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/60 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Claim Interval</div>
                    <div className="text-lg font-bold text-white">24 Hours</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/60 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <Coins className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Per Token</div>
                    <div className="text-lg font-bold text-white">{claimAmountFormatted}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/60 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Droplet className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Token Types</div>
                    <div className="text-lg font-bold text-white">3 Tokens</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Available Tokens */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden">
              <div className="p-5 border-b border-slate-800/60">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-blue-400" />
                  Faucet Reserves
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {faucetBalances.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-lg shadow-md`}>
                          {item.icon}
                        </div>
                        <span className="font-bold text-white">{item.symbol}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {item.balance 
                        ? parseFloat(formatEther(item.balance as bigint)).toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : "0"
                      }
                    </div>
                    <div className="text-xs text-slate-400">tokens available</div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 p-5">
              <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-400">1</div>
                  <p className="text-sm text-slate-300">Connect your wallet to the faucet</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-400">2</div>
                  <p className="text-sm text-slate-300">Click claim to receive {claimAmountFormatted} of each token</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-400">3</div>
                  <p className="text-sm text-slate-300">Wait 24 hours before next claim</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-400">4</div>
                  <p className="text-sm text-slate-300">Use tokens for testing on the DEX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}