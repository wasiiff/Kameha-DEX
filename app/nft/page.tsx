"use client";

import React, { useState, useEffect } from "react";
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt 
} from "wagmi";
import { 
  ShoppingCart, 
  Wallet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Grid3x3,
  Filter,
  Loader2,
  ExternalLink,
  Tag,
  User
} from "lucide-react";
import { formatEther, parseEther } from "viem";

const NFT_ADDRESS = "0xDA47f9cB54F34BbF1988bD6263634CF8F4816DB2";
const MARKETPLACE_ADDRESS = "0xcf1731f89A0E4e5Af0e2EB8b433E1De66e7E0FD0";
const TOKEN_A_ADDRESS = "0x0e0Fd4B9D8B114Ee75CbC65ed80eE49F3EA45D95";
const TOKEN_B_ADDRESS = "0x26a25ACc7ad5b30f92e8B1f69Df7266b367a9b83";
const TOKEN_C_ADDRESS = "0x268c876dFf9f364d1f8Dc9e5dE0c0A8f56C286E6";

const MARKETPLACE_ABI = [
  {
    name: "listNFT",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "priceInTokenA", type: "uint256" }
    ],
    outputs: []
  },
  {
    name: "buyWithTokenA",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: []
  },
  {
    name: "buyWithTokenB",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: []
  },
  {
    name: "buyWithTokenC",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: []
  },
  {
    name: "getListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "active", type: "bool" }
    ]
  },
  {
    name: "calculatePriceInToken",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "paymentToken", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  }
];

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }]
  }
];

const NFT_ABI = [
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }]
  }
];

const TOKENS = [
  { 
    address: TOKEN_A_ADDRESS, 
    symbol: "PLAT", 
    name: "Platinum Token", 
    gradient: "from-slate-400 via-slate-300 to-slate-500",
    icon: "💎"
  },
  { 
    address: TOKEN_B_ADDRESS, 
    symbol: "SIMP", 
    name: "Simple Token", 
    gradient: "from-blue-400 via-cyan-300 to-blue-500",
    icon: "🔷"
  },
  { 
    address: TOKEN_C_ADDRESS, 
    symbol: "LMN", 
    name: "Lemon Token", 
    gradient: "from-yellow-400 via-amber-300 to-yellow-500",
    icon: "🍋"
  }
];

// NFT Card Component
function NFTCard({ tokenId, selectedToken, onRefresh }) {
  const { address, isConnected } = useAccount();
  const [processingStage, setProcessingStage] = useState("idle");

  // Listing info
  const { data: listingData, refetch: refetchListing } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getListing",
    args: [BigInt(tokenId)],
    query: { refetchInterval: 10000 }
  });

  const listing = listingData ? {
    seller: listingData[0],
    price: listingData[1],
    active: listingData[2]
  } : null;

  // NFT owner (to disable buying own NFT)
  const { data: nftOwner } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
    query: { enabled: !!listing?.active }
  });

  // Price
  const { data: calculatedPrice } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "calculatePriceInToken",
    args: [BigInt(tokenId), selectedToken.address],
    query: { enabled: !!listing?.active }
  });

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address!, MARKETPLACE_ADDRESS],
    query: { enabled: !!address }
  });

  const { data: balanceData } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address }
  });

  const allowance = (allowanceData as bigint) || 0n;
  const balance = (balanceData as bigint) || 0n;
  const needsApproval = calculatedPrice && allowance < (calculatedPrice as bigint);
  const hasInsufficientBalance = calculatedPrice && balance < (calculatedPrice as bigint);

  const { writeContract: approve, data: approveTx } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTx });

  const { writeContract: buy, data: buyTx, error: buyError } = useWriteContract();
  const { isSuccess: buySuccess } = useWaitForTransactionReceipt({ hash: buyTx });

  const handleApprove = () => {
    if (!calculatedPrice) return;
    setProcessingStage("approving");
    approve({
      address: selectedToken.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, (calculatedPrice as bigint) * 2n]
    });
  };

  const handleBuy = () => {
    setProcessingStage("buying");
    const fn =
      selectedToken.address === TOKEN_A_ADDRESS ? "buyWithTokenA" :
      selectedToken.address === TOKEN_B_ADDRESS ? "buyWithTokenB" : "buyWithTokenC";
    buy({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: fn,
      args: [BigInt(tokenId)]
    });
  };

  useEffect(() => {
    if (approveSuccess) {
      setProcessingStage("approved");
      refetchAllowance();
      setTimeout(() => setProcessingStage("idle"), 2000);
    }
  }, [approveSuccess]);

  useEffect(() => {
    if (buySuccess) {
      setProcessingStage("success");
      setTimeout(() => {
        setProcessingStage("idle");
        refetchListing();
        onRefresh();
      }, 3000);
    }
  }, [buySuccess]);

  if (!listing?.active) return null;

  const isOwnNFT = nftOwner?.toLowerCase() === address?.toLowerCase();
  const priceFormatted = calculatedPrice ? parseFloat(formatEther(calculatedPrice as bigint)).toFixed(4) : "0";

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden hover:border-slate-700/80 transition-all hover:scale-[1.02] group">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <img
          src={`/nft-images/${tokenId}.jpg`}
          alt={`NFT #${tokenId}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/400/1e293b/94a3b8?text=NFT+%23${tokenId}`;
          }}
        />
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/50">
          <span className="text-white text-xs font-bold">#{tokenId}</span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-white">NFT #{tokenId}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white truncate">
            {priceFormatted}
          </span>
          <span className="text-sm text-slate-400">{selectedToken.symbol}</span>
        </div>

        {isConnected ? (
          <div>
            {isOwnNFT ? (
              <div className="bg-slate-800/60 text-slate-400 py-3 rounded-xl font-semibold text-center border border-slate-700/60">
                You own this NFT
              </div>
            ) : hasInsufficientBalance ? (
              <div className="bg-red-500/10 text-red-400 py-3 rounded-xl font-semibold text-center border border-red-500/30">
                Insufficient Balance
              </div>
            ) : needsApproval ? (
              <button
                onClick={handleApprove}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white py-3 rounded-xl font-semibold transition-all"
              >
                Approve {selectedToken.symbol}
              </button>
            ) : (
              <button
                onClick={handleBuy}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3 rounded-xl font-semibold transition-all"
              >
                Buy Now
              </button>
            )}
          </div>
        ) : (
          <button disabled className="w-full bg-slate-800/60 text-slate-500 py-3 rounded-xl font-semibold cursor-not-allowed">
            Connect Wallet
          </button>
        )}

        <div className="pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
          <User className="w-3.5 h-3.5" />
          <span>{listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</span>
        </div>
      </div>
    </div>
  );
}

// Main Marketplace Page
export default function NftMarketplacePage() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tokenIdToList, setTokenIdToList] = useState("");
  const [priceToList, setPriceToList] = useState("");

  const { writeContract: listNFT, data: listTx, error: listError, isPending: listPending } = useWriteContract();
  const { isSuccess: listSuccess } = useWaitForTransactionReceipt({ hash: listTx });

  const handleListNFT = () => {
    if (!tokenIdToList || !priceToList) return;
    listNFT({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: "listNFT",
      args: [BigInt(tokenIdToList), parseEther(priceToList)]
    });
  };

  useEffect(() => {
    if (listSuccess) {
      setTokenIdToList("");
      setPriceToList("");
      setRefreshKey(prev => prev + 1);
    }
  }, [listSuccess]);

  const tokenIds = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm px-5 py-2.5 rounded-full border border-slate-800/60 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 text-sm font-medium">NFT Marketplace</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            Collect NFTs
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-6">
            Discover, collect, and trade unique digital assets on Kaspa Finance
          </p>
        </div>

        {/* List NFT Section */}
        {isConnected && (
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">List Your NFT</h3>
              </div>
              <button
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Token ID"
                value={tokenIdToList}
                onChange={(e) => setTokenIdToList(e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
              />
              <input
                type="number"
                placeholder="Price (PLAT)"
                value={priceToList}
                onChange={(e) => setPriceToList(e.target.value)}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                onClick={handleListNFT}
                disabled={listPending}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {listPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {listPending ? "Listing..." : "List NFT"}
              </button>
            </div>

            {listError && (
              <div className="mt-3 bg-red-900/40 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {listError.message}
              </div>
            )}
            {listSuccess && (
              <div className="mt-3 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                NFT Listed Successfully!
              </div>
            )}
          </div>
        )}

        {/* Token Selector */}
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Payment Token</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TOKENS.map((token) => (
              <button
                key={token.address}
                onClick={() => setSelectedToken(token)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedToken.address === token.address
                    ? `border-transparent bg-gradient-to-r ${token.gradient} shadow-lg`
                    : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
                    selectedToken.address === token.address 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-br ${token.gradient}`
                  }`}>
                    {token.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">{token.symbol}</div>
                    <div className="text-xs text-slate-300">{token.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tokenIds.map((id) => (
            <NFTCard 
              key={`${id}-${refreshKey}`}
              tokenId={id} 
              selectedToken={selectedToken}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          ))}
        </div>

        {!isConnected && (
          <div className="text-center py-16 mt-8 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800/60">
            <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
            <p className="text-slate-400">Connect your wallet to view and purchase NFTs</p>
          </div>
        )}
      </div>
    </div>
  );
}
