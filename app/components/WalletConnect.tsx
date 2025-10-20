"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, AlertCircle, Loader2, Power, Zap } from "lucide-react";
import { useState } from "react";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [isHovered, setIsHovered] = useState(false);

  // Connected State - Sleek inline display
  if (isConnected && address) {
    return (
      <div className="relative group">
        <div 
          className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 p-[2px] rounded-2xl shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="bg-slate-900 rounded-[14px] px-5 py-2.5 flex items-center gap-3">
            {/* Pulse Indicator */}
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
            </div>

            {/* Address Display */}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-white tracking-tight text-sm">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>

            {/* Disconnect Button - Appears on Hover */}
            <button
              onClick={disconnect}
              className={`ml-2 transition-all duration-300 ${
                isHovered 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-2 pointer-events-none'
              }`}
            >
              <div className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors group/btn">
                <LogOut className="w-4 h-4 text-red-400 group-hover/btn:text-red-300" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Disconnected State - Bold connect button
  return (
    <div className="relative">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={status === "pending"}
        className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 p-[2px] rounded-2xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 disabled:shadow-none transition-all duration-300 disabled:opacity-50"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
        
        <div className="relative bg-slate-900 rounded-[14px] px-6 py-3 flex items-center justify-center gap-3">
          {status === "pending" ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="font-bold text-white text-sm">Connecting...</span>
            </>
          ) : (
            <>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-sm tracking-wide">
                Connect Wallet
              </span>
            </>
          )}
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-gradient-to-r from-red-600 to-orange-600 p-[2px] rounded-xl shadow-2xl shadow-red-500/50 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="bg-slate-900 rounded-[10px] p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-sm mb-1">Connection Failed</p>
                <p className="text-red-300/80 text-xs leading-relaxed">{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}