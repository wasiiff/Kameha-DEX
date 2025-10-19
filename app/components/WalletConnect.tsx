"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  // ✅ Connected State
  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-md border border-blue-500/30 rounded-xl p-3 shadow-md shadow-blue-900/30 flex flex-col gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wallet size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-cyan-400 font-medium leading-tight">
              Connected
            </p>
            <p className="text-blue-100 font-mono text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        </div>

        <button
          onClick={() => disconnect()}
          className="w-full bg-slate-800/60 hover:bg-slate-700/60 border border-blue-500/40 text-blue-300 hover:text-blue-200 px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <LogOut size={15} />
          Disconnect
        </button>
      </motion.div>
    );
  }

  // ✅ Disconnected State
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/80 backdrop-blur-md border border-blue-500/30 rounded-xl p-3 shadow-md shadow-blue-900/30"
    >
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={status === "pending"}
        className="w-full bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 disabled:from-gray-800 disabled:to-gray-900 text-blue-100 px-5 py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 text-sm border border-blue-500/40 shadow-lg shadow-blue-900/40 hover:shadow-blue-800/50 disabled:cursor-not-allowed"
      >
        {status === "pending" ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Connecting...
          </>
        ) : (
          <>
            <Wallet size={18} /> Connect Wallet
          </>
        )}
      </button>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 bg-red-900/40 border border-red-500/50 rounded-lg p-3 flex items-start gap-2"
        >
          <AlertCircle className="text-red-400 mt-0.5" size={16} />
          <p className="text-red-300 text-sm leading-tight">{error.message}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
