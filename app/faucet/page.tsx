"use client";

import { useAccount, useContractRead, useContractWrite, useWaitForTransactionReceipt } from "wagmi";
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
  Coins,
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

  // --- Read lastClaimTime ---
  const {
    data: lastClaim,
    refetch: refetchLastClaim,
    isError: lastClaimError,
  } = useContractRead({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "lastClaimTime",
    args: address ? [address] : undefined,
    watch: Boolean(address),
    enabled: Boolean(address),
  });

  // --- Read interval and claim amount ---
  const { data: interval } = useContractRead({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "CLAIM_INTERVAL",
    watch: true,
  });

  const { data: claimAmount } = useContractRead({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "CLAIM_AMOUNT",
    watch: true,
  });

  // --- Read token addresses ---
  const { data: tokenAAddress } = useContractRead({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "tokenA",
    watch: true,
  });
  const { data: tokenBAddress } = useContractRead({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "tokenB",
    watch: true,
  });
  const { data: tokenCAddress } = useContractRead({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "tokenC",
    watch: true,
  });

  // --- Faucet balances ---
  const { data: faucetBalanceA } = useContractRead({
    address: tokenAAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [FAUCET_ADDRESS],
    enabled: Boolean(tokenAAddress),
    watch: Boolean(tokenAAddress),
  });
  const { data: faucetBalanceB } = useContractRead({
    address: tokenBAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [FAUCET_ADDRESS],
    enabled: Boolean(tokenBAddress),
    watch: Boolean(tokenBAddress),
  });
  const { data: faucetBalanceC } = useContractRead({
    address: tokenCAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [FAUCET_ADDRESS],
    enabled: Boolean(tokenCAddress),
    watch: Boolean(tokenCAddress),
  });

  // --- Write (claim) ---
  const {
    writeContract,
    data: claimWriteData,
    isPending: claimPending,
    error: claimWriteError,
  } = useContractWrite();

  // --- Wait for transaction receipt ---
  const {
    isLoading: waitLoading,
    isSuccess: waitSuccess,
  } = useWaitForTransactionReceipt({
    hash: claimWriteData,
    onSuccess: () => refetchLastClaim?.(),
  });

  // --- Claim logic ---
  const handleClaim = async () => {
    if (!isConnected) return;
    try {
      await writeContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: "claim",
      });
    } catch (err) {
      console.error("Claim failed:", err);
    }
  };

  // --- Timer ---
  useEffect(() => {
    if (!lastClaim || !interval) return;

    const last = Number(lastClaim);
    const intv = Number(interval);
    const nextClaim = last + intv;

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
    const t = setInterval(updateTimer, 1000);
    return () => clearInterval(t);
  }, [lastClaim, interval]);

  const canClaim = cooldown === 0 && isConnected && !claimPending;
  const claimAmountFormatted = claimAmount ? formatEther(claimAmount as bigint) : "100";
  const progressPercentage = interval ? ((Number(interval) - cooldown) / Number(interval)) * 100 : 0;

  const faucetBalances = [
    { symbol: "PLAT", balance: faucetBalanceA, ...TOKENS[0] },
    { symbol: "SIMP", balance: faucetBalanceB, ...TOKENS[1] },
    { symbol: "LMN", balance: faucetBalanceC, ...TOKENS[2] },
  ];

  const etherscanTxUrl = claimWriteData ? `https://etherscan.io/tx/${claimWriteData}` : null;

  return (
    <div className="min-h-screen px-4 pb-12">
      <div className="max-w-7xl mx-auto">
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
            <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden p-8">
              {!isConnected ? (
                <div className="text-center py-16">
                  <Wallet className="w-10 h-10 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h3>
                  <p className="text-slate-400">Connect your wallet to claim testnet tokens</p>
                </div>
              ) : cooldown > 0 ? (
                <div className="text-center">
                  <Timer className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Next Claim In</h3>
                  <p className="text-slate-400 mb-4">
                    {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                  </p>
                  <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-3">Ready to Claim!</h3>
                  <p className="text-slate-400 mb-6">Claim {claimAmountFormatted} tokens of each type</p>
                  <button
                    onClick={handleClaim}
                    disabled={!canClaim}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-[1.02] transition-all text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {claimPending || waitLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" /> Claim Tokens
                      </>
                    )}
                  </button>
                </div>
              )}

              {waitSuccess && (
                <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div className="flex-1 text-left">
                    <p className="text-emerald-400 font-bold">Tokens Claimed Successfully!</p>
                    {etherscanTxUrl && (
                      <a
                        href={etherscanTxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-300 hover:underline text-sm"
                      >
                        View on Etherscan
                      </a>
                    )}
                  </div>
                </div>
              )}

              {claimWriteError && (
                <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                  <AlertCircle className="inline w-5 h-5 mr-2" />
                  {String(claimWriteError.message || claimWriteError)}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/60 p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-blue-400" /> Faucet Reserves
              </h3>
              {faucetBalances.map((t, i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center`}>
                        {t.icon}
                      </div>
                      <span className="font-bold">{t.symbol}</span>
                    </div>
                    <span>{t.balance ? Number(formatEther(t.balance)).toFixed(0) : "0"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
