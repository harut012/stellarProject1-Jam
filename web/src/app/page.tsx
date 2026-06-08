'use client';
import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import ConnectWallet from '@/components/ConnectWallet';
import FundAccount from '@/components/FundAccount';
import AddTrustline from '@/components/AddTrustline';
import BalanceCard from '@/components/BalanceCard';
import SendPayment from '@/components/SendPayment';
import TransactionHistory from '@/components/TransactionHistory';
import QRCode from 'react-qr-code';
import { Wallet, RefreshCw, QrCode } from 'lucide-react';

export default function Home() {
  const wallet = useWallet();
  const { publicKey, connecting } = wallet;
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      <div className="mx-auto max-w-6xl w-full px-4 py-8 flex-1 flex flex-col">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/20 p-2 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Vendor POS</h1>
              <p className="text-xs text-emerald-400 font-medium tracking-wide uppercase">
                Stellar Network
              </p>
            </div>
          </div>
          <ConnectWallet {...wallet} />
        </header>

        {!publicKey && !connecting && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.15)] border border-slate-800">
              <QrCode className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Ready to receive</h2>
            <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
              Connect your Freighter wallet to instantly accept secure digital payments without a bank account.
            </p>
            <div className="text-sm">
              <p className="text-slate-500 mb-2">Don't have a wallet?</p>
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-900 text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition-colors border border-slate-800"
              >
                Get Freighter
              </a>
            </div>
          </div>
        )}

        {publicKey && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: QR Code & Balance */}
            <div className="flex flex-col gap-8">
            <div className="mb-6 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-20"></div>
              <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Balance</h3>
                  <button
                    onClick={refresh}
                    className="p-2 -mr-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-all active:scale-95"
                    title="Refresh Balance"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <BalanceCard publicKey={publicKey} refreshKey={refreshKey} />
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center mb-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative z-10">
                <QRCode 
                  value={publicKey} 
                  size={240} 
                  level="M"
                  fgColor="#020617"
                />
              </div>
              
              <div className="mt-8 text-center relative z-10 w-full">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 inline-flex items-center justify-center">
                  <p className="text-sm text-slate-600 font-mono break-all font-medium tracking-wide">
                    {publicKey.substring(0, 8)}...{publicKey.substring(publicKey.length - 8)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Hidden Utils for testnet */}
            <div className="pt-4 border-t border-slate-800/50">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <FundAccount publicKey={publicKey} onFunded={refresh} />
                <AddTrustline publicKey={publicKey} onDone={refresh} />
              </div>
            </div>
          </div>

          {/* Right Column: Transactions & Interactions */}
          <div className="flex flex-col gap-6">
            <TransactionHistory publicKey={publicKey} refreshKey={refreshKey} />
            <SendPayment publicKey={publicKey} onSent={refresh} />
          </div>
        </div>
        )}

      </div>
    </main>
  );
}
